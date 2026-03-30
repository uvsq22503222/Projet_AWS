const { initBoard, isValidMove } = require('./gameRules');

let games = {};
let gameId = 1;

function createGame(p1, p2) {
    const id = gameId++;

    games[id] = {
        id,
        players: [p1, p2],
        colors: {
            white: p1,
            black: p2
        },
        board: initBoard(),
        turn: "white"
    };

    return games[id];
}

function makeMove(id, from, to, player) {
  const game = games[id];
  if (!game) return null;

  const piece = game.board[from[0]][from[1]];
  if (!piece) return null;

  if (
    (game.turn === "white" && player !== game.colors.white) ||
    (game.turn === "black" && player !== game.colors.black)
  ) {
    console.log("❌ 不是你的回合");
    return null;
  }

  if (!isValidMove(game.board, from, to, piece)) {
    console.log("❌ 非法移动");
    return null;
  }

  // 移动
  game.board[to[0]][to[1]] = piece;
  game.board[from[0]][from[1]] = null;

  // 切换回合
  game.turn = game.turn === "white" ? "black" : "white";

  return game;
}

module.exports = { createGame, makeMove, games };