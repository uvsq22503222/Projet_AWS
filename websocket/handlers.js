const { createGame, makeMove, games } = require('../game/gameManager');
const db = require('../db');
const playerGameMap = new Map(); // userId -> gameId

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
                    data: users.map(u => ({ ...u, inGame: playerGameMap.has(u.id) }))
                }));
            });

            break;
        }

        case "challenge":
            const from = data.from;
            const to = data.to;

            if(playerGameMap.has(from)){
                ws.send(JSON.stringify({
                    type: "error",
                    data: "Vous êtes déjà dans une partie"
                }));
                return;
            }

            if(playerGameMap.has(to)){
                ws.send(JSON.stringify({
                    type: "error",
                    data: "Ce joueur est déjà dans une partie"
                }));
                return;
            }

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

            playerGameMap.set(data.from, game.id);
            playerGameMap.set(data.to, game.id);

            wss.clients.forEach(client => {
                const clientUser = clients.get(client);
                if (clientUser === game.joueurs.blanc || clientUser === game.joueurs.noir) {
                    client.send(JSON.stringify({ type: "startGame", data: game }));
                    client.send(JSON.stringify({ type: "gameState", data: game }));
                }
            });

            broadcastPlayers(wss, users, playerGameMap);

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
            const player = clients.get(ws);
            const gameId = playerGameMap.get(player);
            const game = games[gameId];

            if (!game) {
                ws.send(JSON.stringify({
                    type: "error",
                    data: "Aucune partie en cours"
                }));
                return;
            }

            ws.send(JSON.stringify({
                type: "gameState",
                data: game
            }));
            break;
        }

        case "abandon": {
            const player = clients.get(ws);
            const gameId = playerGameMap.get(player);
            const game = games[gameId];

            if (!game) {
                ws.send(JSON.stringify({ type: "error", data: "Aucune partie en cours" }));
                return;
            }

            const winnerId = game.joueurs.blanc === player
                ? game.joueurs.noir
                : game.joueurs.blanc;

            game.gagnant = game.joueurs.blanc === winnerId ? "blanc" : "noir";

            await db('users').where({ id: winnerId }).increment('score', 1);
            const winnerUser = users.find(u => u.id === winnerId);
            if (winnerUser) winnerUser.score = (winnerUser.score || 0) + 1;

            playerGameMap.delete(game.joueurs.blanc);
            playerGameMap.delete(game.joueurs.noir);

            wss.clients.forEach(client => {
                const clientUser = clients.get(client);
                if (clientUser === game.joueurs.blanc || clientUser === game.joueurs.noir) {
                    client.send(JSON.stringify({ type: "gameState", data: game }));
                }
            });

            broadcastPlayers(wss, users, playerGameMap);
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

            if (game && game.error) {
                ws.send(JSON.stringify({
                    type: "error",
                    data: game.error
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

                playerGameMap.delete(game.joueurs.blanc);
                playerGameMap.delete(game.joueurs.noir);

                broadcastPlayers(wss, users, playerGameMap);
            }

            wss.clients.forEach(client => {
                const clientUser = clients.get(client);
                if (clientUser === game.joueurs.blanc || clientUser === game.joueurs.noir) {
                    client.send(JSON.stringify({
                        type: "gameState",
                        data: game
                    }));
                }
            });

            break;
        }
    }
}

function broadcastPlayers(wss, users, playerGameMap) {
    wss.clients.forEach(client => {
        client.send(JSON.stringify({
            type: "players",
            data: users.map(u => ({
                ...u,
                inGame: playerGameMap.has(u.id)
            }))
        }));
    });
}



module.exports = { handleMessage };