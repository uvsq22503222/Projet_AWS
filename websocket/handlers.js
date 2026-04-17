const { createGame, makeMove, games } = require('../game/gameManager');
const db = require('../db');
const playerGameMap = new Map(); // userId -> gameId
const minuteursDeconnexion = new Map(); // userId -> timer

async function handleMessage(ws, msg, clients, users, wss) {
    const { type, data } = JSON.parse(msg);

    switch (type) {

        case "login": {
            clients.set(ws, data.userId);

            // Annuler le minuteur de déconnexion si le joueur reconnecte
            if (minuteursDeconnexion.has(data.userId)) {
                clearTimeout(minuteursDeconnexion.get(data.userId));
                minuteursDeconnexion.delete(data.userId);
                console.log("Reconnexion détectée, minuteur annulé :", data.userId);
            }

            const dbUser = await db('users').where({ id: data.userId }).first();
            const user = {
                id: data.userId,
                username: data.username,
                score: dbUser ? dbUser.score : 0,
                losses: dbUser ? dbUser.losses : 0
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

            if (playerGameMap.has(from)) {
                ws.send(JSON.stringify({
                    type: "error",
                    data: "Vous êtes déjà dans une partie"
                }));
                return;
            }

            if (playerGameMap.has(to)) {
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
            game.raison = "abandon";

            const loserId = game.joueurs.blanc === player ? game.joueurs.blanc : game.joueurs.noir;
            await db('users').where({ id: winnerId }).increment('score', 1);
            await db('users').where({ id: loserId }).increment('losses', 1);
            const winnerUser = users.find(u => u.id === winnerId);
            if (winnerUser) winnerUser.score = (winnerUser.score || 0) + 1;
            const loserUser = users.find(u => u.id === loserId);
            if (loserUser) loserUser.losses = (loserUser.losses || 0) + 1;

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
                const loserId = game.gagnant === "blanc"
                    ? game.joueurs.noir
                    : game.joueurs.blanc;
                await db('users').where({ id: winnerId }).increment('score', 1);
                await db('users').where({ id: loserId }).increment('losses', 1);
                const winnerUser = users.find(u => u.id === winnerId);
                if (winnerUser) winnerUser.score = (winnerUser.score || 0) + 1;
                const loserUser = users.find(u => u.id === loserId);
                if (loserUser) loserUser.losses = (loserUser.losses || 0) + 1;

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

function handleDisconnect(ws, clients, users, wss) {
    const userId = clients.get(ws);
    if (!userId) return;

    const gameId = playerGameMap.get(userId);
    if (!gameId) return;

    // Attendre 5 secondes avant de traiter la déconnexion (pour laisser le temps de se reconnecter)
    const timer = setTimeout(async () => {
        minuteursDeconnexion.delete(userId);

        const game = games[gameId];
        if (!game || game.gagnant) return;

        // Vérifier que le joueur ne s'est pas reconnecté
        const estReconnecte = [...clients.values()].includes(userId);
        if (estReconnecte) return;

        console.log("Déconnexion confirmée pour :", userId);

        const winnerId = game.joueurs.blanc === userId
            ? game.joueurs.noir
            : game.joueurs.blanc;

        game.gagnant = game.joueurs.blanc === winnerId ? "blanc" : "noir";
        game.raison = "deconnexion";

        await db('users').where({ id: winnerId }).increment('score', 1);
        await db('users').where({ id: userId }).increment('losses', 1);
        const winnerUser = users.find(u => u.id === winnerId);
        if (winnerUser) winnerUser.score = (winnerUser.score || 0) + 1;
        const loserUser = users.find(u => u.id === userId);
        if (loserUser) loserUser.losses = (loserUser.losses || 0) + 1;

        playerGameMap.delete(game.joueurs.blanc);
        playerGameMap.delete(game.joueurs.noir);

        wss.clients.forEach(client => {
            const clientUser = clients.get(client);
            if (clientUser === winnerId) {
                client.send(JSON.stringify({ type: "gameState", data: game }));
            }
        });

        broadcastPlayers(wss, users, playerGameMap);
    }, 5000);

    minuteursDeconnexion.set(userId, timer);
}

module.exports = { handleMessage, handleDisconnect };
