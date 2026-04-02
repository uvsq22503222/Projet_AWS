const { createGame, makeMove, games } = require('../game/gameManager');

function handleMessage(ws, msg, clients, users, wss) {
    const { type, data } = JSON.parse(msg);

    switch (type) {

        case "login":
            clients.set(ws, data.userId);

            const user = {
                id: data.userId,
                username: data.username
            };

            if (!users.find(u => u.id === user.id)) {
                users.push(user);
            }

            console.log("当前在线用户:", users);

            // boradcast players
            wss.clients.forEach(client => {
                client.send(JSON.stringify({
                    type: "players",
                    data: users
                }));
            });

            break;

        case "challenge":
            console.log("avoir challenge")
            const opponent = [...clients.entries()].find(
                ([, id]) => id === data.to
            );
            console.log("当前clients:", [...clients.values()]);
            console.log("要找:", data.to);

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
            console.log("游戏开始:", game);

            wss.clients.forEach(client => {
                const user = clients.get(client);

                client.send(JSON.stringify({
                    type: "startGame",
                    data: game
                }));

                if (
                    user === game.joueurs.blanc ||
                    user === game.joueurs.noir
                ) {
                    client.send(JSON.stringify({
                        type: "gameState",
                        data: game
                    }));
                }
            });

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

            console.log("move来自:", player);

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