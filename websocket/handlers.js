const { createGame, makeMove, games } = require('../game/gameManager');
const db = require('../db');

async function handleMessage(ws, msg, clients, users, wss) {
    const { type, data } = JSON.parse(msg);

    switch (type) {

        case "login": {
            clients.set(ws, data.userId);

            const dbUser = await db('users').where({ id: data.userId }).first();
            const user = {
                id: data.userId,
                username: data.username,
                score: dbUser ? dbUser.score : 0
            };

            if (!users.find(u => u.id === user.id)) {
                users.push(user);
            }

            console.log("Utilisateurs en ligne :", users);

            wss.clients.forEach(client => {
                client.send(JSON.stringify({
                    type: "players",
                    data: users
                }));
            });

            break;
        }

        case "challenge":
            console.log("avoir challenge")
            const opponent = [...clients.entries()].find(
                ([, id]) => id === data.to
            );
            console.log("Clients connectés :", [...clients.values()]);
            console.log("Recherche du joueur :", data.to);

            if (opponent) {
                opponent[0].send(JSON.stringify({
                    type: "challenge",
                    data: {
                        from: {
                            id: data.from,
                            username: users.find(u => u.id === data.from).username
                        },
                        to: data.to
                    }
                }));
            }
            break;

        case "acceptChallenge": {
            const game = createGame(data.from, data.to);
            console.log("Partie lancée :", game);

            wss.clients.forEach(client => {
                const clientUser = clients.get(client);
                if (clientUser === game.joueurs.blanc || clientUser === game.joueurs.noir) {
                    client.send(JSON.stringify({ type: "startGame", data: game }));
                    client.send(JSON.stringify({ type: "gameState", data: game }));
                }
            });

            break;
        }

        case "declineChallenge": {
            const challenger = [...clients.entries()].find(([, id]) => id === data.to);
            if (challenger) {
                const decliner = users.find(u => u.id === data.from);
                challenger[0].send(JSON.stringify({
                    type: "declineChallenge",
                    data: { username: decliner ? decliner.username : "Adversaire" }
                }));
            }
            break;
        }

        case "getGameState": {
            const game = Object.values(games)[0];

            ws.send(JSON.stringify({
                type: "gameState",
                data: game
            }));
            break;
        }

        case "move": {
            const player = clients.get(ws);

            console.log("Coup reçu de :", player);

            const game = makeMove(
                data.gameId,
                data.from,
                data.to,
                player
            );

            if (!game) {
                ws.send(JSON.stringify({
                    type: "error",
                    data: "Coup invalide ou pas ton tour"
                }));
                return;
            }

            if (game.gagnant) {
                const winnerId = game.gagnant === "blanc"
                    ? game.joueurs.blanc
                    : game.joueurs.noir;
                await db('users').where({ id: winnerId }).increment('score', 1);
                const winnerUser = users.find(u => u.id === winnerId);
                if (winnerUser) winnerUser.score = (winnerUser.score || 0) + 1;
            }

            wss.clients.forEach(client => {
                client.send(JSON.stringify({
                    type: "gameState",
                    data: game
                }));
            });

            break;
        }
    }
}

module.exports = { handleMessage };