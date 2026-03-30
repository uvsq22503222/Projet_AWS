const {
  initialiserPlateau,
  coupsValides,
  appliquerCoup,
  verifierGagnant,
} = require("./gameRules");

let games = {};
let gameId = 1;

function createGame(p1, p2) {
  const id = gameId++;

  games[id] = {
    id,
    joueurs: {
      blanc: p1,
      noir: p2,
    },
    plateau: initialiserPlateau(),
    tour: "blanc",
    gagnant: null,
  };

  return games[id];
}

function makeMove(id, from, to, joueur) {
  const game = games[id];
  if (!game) return null;

  const piece = game.plateau[from[0]][from[1]];
  if (!piece) return null;

  if (
    (game.tour === "blanc" && joueur !== game.joueurs.blanc) ||
    (game.tour === "noir" && joueur !== game.joueurs.noir)
  ) {
    console.log("❌ Pas ton tour");
    return null;
  }

  const coups = coupsValides(game.plateau, game.tour);

  const coup = coups.find(
    (c) =>
      c.de[0] === from[0] &&
      c.de[1] === from[1] &&
      c.vers[0] === to[0] &&
      c.vers[1] === to[1]
  );

  if (!coup) {
    console.log("❌ Coup invalide");
    return null;
  }

  game.plateau = appliquerCoup(game.plateau, coup);

  const gagnant = verifierGagnant(game.plateau);
  if (gagnant) {
    game.gagnant = gagnant;
    return game;
  }

  game.tour = game.tour === "blanc" ? "noir" : "blanc";

  return game;
}

module.exports = { createGame, makeMove, games };