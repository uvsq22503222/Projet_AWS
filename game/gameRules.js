function initBoard() {
  const board = Array(10).fill().map(() => Array(10).fill(null));

  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 10; j++) {
      if ((i + j) % 2 === 1) board[i][j] = "black";
    }
  }

  for (let i = 6; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      if ((i + j) % 2 === 1) board[i][j] = "white";
    }
  }

  return board;
}

function isValidMove(board, from, to, piece) {
  const [x1, y1] = from;
  const [x2, y2] = to;

  if (board[x2][y2]) return false;

  const dx = x2 - x1;
  const dy = y2 - y1;

  // 必须对角线
  if (Math.abs(dy) !== 1) return false;

  // 白棋向上（-1）
  if (piece === "white" && dx !== -1) return false;

  // 黑棋向下（+1）
  if (piece === "black" && dx !== 1) return false;

  return true;
}

module.exports = { initBoard, isValidMove };