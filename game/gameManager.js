const {
    initialiserPlateau,
    coupsValides,
    appliquerCoup,
    verifierGagnant,
} = require("./gameRules");

let games = {}; // toutes les parties en cours
let gameId = 1; // compteur d'id

// créer une nouvelle partie
function createGame(p1, p2) {
    const id = gameId++;

    const plateau = initialiserPlateau();
    games[id] = {
        id,
        joueurs: { blanc: p1, noir: p2 },
        plateau,
        tour: "blanc", // les blancs commencent
        gagnant: null,
        coupsDisponibles: coupsValides(plateau, "blanc"),
    };

    return games[id];
}

// jouer un coup
function makeMove(id, from, to, joueur) {
    const game = games[id];
    if (!game) return { error: "Partie non trouvée" };

    const piece = game.plateau[from[0]][from[1]];
    if (!piece) return { error: "Pas de pièce ici" };

    // vérifier que c'est bien son tour
    if (
        (game.tour === "blanc" && joueur !== game.joueurs.blanc) ||
        (game.tour === "noir" && joueur !== game.joueurs.noir)
    ) {
        console.log("Pas ton tour");
        return { error: "Pas ton tour" };
    }

    // chercher le coup dans les coups valides
    const coups = coupsValides(game.plateau, game.tour);
    const coup = coups.find(
        (c) =>
            c.de[0] === from[0] &&
            c.de[1] === from[1] &&
            c.vers[0] === to[0] &&
            c.vers[1] === to[1]
    );

    if (!coup) {
        console.log("Coup invalide");
        return { error: "Coup invalide" };
    }

    game.plateau = appliquerCoup(game.plateau, coup);

    // vérifier si la partie est terminée
    const gagnant = verifierGagnant(game.plateau);
    if (gagnant) {
        game.gagnant = gagnant;
        return game;
    }

    // changer de tour
    game.tour = game.tour === "blanc" ? "noir" : "blanc";
    game.coupsDisponibles = coupsValides(game.plateau, game.tour);

    return game;
}

module.exports = { createGame, makeMove, games };
