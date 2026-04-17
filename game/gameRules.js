// plateau initial
function initialiserPlateau() {
    const plateau = Array.from({ length: 10 }, () => Array(10).fill(null));

    // pions noirs en haut
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 10; j++) {
            if ((i + j) % 2 === 1) plateau[i][j] = "noir";
        }
    }

    // pions blancs en bas
    for (let i = 6; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
            if ((i + j) % 2 === 1) plateau[i][j] = "blanc";
        }
    }

    return plateau;
}

// couleur d'une pièce
function couleurDe(piece) {
    if (!piece) return null;
    return piece.startsWith("blanc") ? "blanc" : "noir";
}

// est-ce une dame ?
function estDame(piece) {
    return piece && piece.endsWith("dame");
}

// case dans les limites ?
function dansPlateau(x, y) {
    return x >= 0 && x < 10 && y >= 0 && y < 10;
}

// génère toutes les extensions de prise depuis (x, y)
// dejaPris : pièces déjà capturées dans la séquence (encore sur le plateau)
function continuerPrise(plateau, x, y, dejaPris, piece) {
    const couleur = couleurDe(piece);
    const extensions = [];

    if (estDame(piece)) {
        for (const [dx, dy] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
            // chercher le premier obstacle dans cette direction
            let ex = x + dx, ey = y + dy;
            while (dansPlateau(ex, ey) && plateau[ex][ey] === null) {
                ex += dx; ey += dy;
            }

            if (!dansPlateau(ex, ey)) continue;
            if (dejaPris.some(d => d[0] === ex && d[1] === ey)) continue; // déjà capturée
            if (!plateau[ex][ey] || couleurDe(plateau[ex][ey]) === couleur) continue; // alliée ou vide

            // cases d'atterrissage après l'ennemi
            let lx = ex + dx, ly = ey + dy;
            while (
                dansPlateau(lx, ly) &&
                plateau[lx][ly] === null &&
                !dejaPris.some(d => d[0] === lx && d[1] === ly)
            ) {
                const nouvellesPrises = [...dejaPris, [ex, ey]];
                const suite = continuerPrise(plateau, lx, ly, nouvellesPrises, piece);

                if (suite.length === 0) {
                    extensions.push({ vers: [lx, ly], prises: [[ex, ey]], chemin: [] });
                } else {
                    for (const s of suite) {
                        extensions.push({
                            vers: s.vers,
                            prises: [[ex, ey], ...s.prises],
                            chemin: [[lx, ly], ...s.chemin]
                        });
                    }
                }
                lx += dx; ly += dy;
            }
        }
    } else {
        // pion : capture dans les 4 directions
        for (const [dx, dy] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
            const ex = x + dx, ey = y + dy; // ennemi
            const lx = ex + dx, ly = ey + dy; // atterrissage

            if (!dansPlateau(ex, ey) || !dansPlateau(lx, ly)) continue;

            const p = plateau[ex][ey];
            if (!p || couleurDe(p) === couleur) continue;
            if (dejaPris.some(d => d[0] === ex && d[1] === ey)) continue; // déjà capturée

            if (plateau[lx][ly] !== null) continue; // case occupée
            if (dejaPris.some(d => d[0] === lx && d[1] === ly)) continue;

            const nouvellesPrises = [...dejaPris, [ex, ey]];

            // promotion en cours de rafle : séquence s'arrête
            const promouvoir = (couleur === "blanc" && lx === 0) || (couleur === "noir" && lx === 9);

            if (promouvoir) {
                extensions.push({ vers: [lx, ly], prises: [[ex, ey]], chemin: [] });
            } else {
                const suite = continuerPrise(plateau, lx, ly, nouvellesPrises, piece);

                if (suite.length === 0) {
                    extensions.push({ vers: [lx, ly], prises: [[ex, ey]], chemin: [] });
                } else {
                    for (const s of suite) {
                        extensions.push({
                            vers: s.vers,
                            prises: [[ex, ey], ...s.prises],
                            chemin: [[lx, ly], ...s.chemin]
                        });
                    }
                }
            }
        }
    }

    return extensions;
}

// coups possibles pour une pièce
function coupsPourPiece(plateau, x, y) {
    const piece = plateau[x][y];
    if (!piece) return [];

    const couleur = couleurDe(piece);
    const coups = [];

    // prises d'abord
    const prises = continuerPrise(plateau, x, y, [], piece);
    for (const e of prises) {
        coups.push({ de: [x, y], vers: e.vers, prises: e.prises, chemin: e.chemin });
    }

    if (coups.length > 0) return coups; // si prise possible, pas de déplacement simple

    // déplacements simples
    if (estDame(piece)) {
        // dame : toutes les diagonales, plusieurs cases
        for (const [dx, dy] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
            let nx = x + dx, ny = y + dy;
            while (dansPlateau(nx, ny) && plateau[nx][ny] === null) {
                coups.push({ de: [x, y], vers: [nx, ny], prises: [], chemin: [] });
                nx += dx; ny += dy;
            }
        }
    } else {
        // pion : une case vers l'avant
        const direction = couleur === "blanc" ? -1 : 1;
        for (const dy of [-1, 1]) {
            const nx = x + direction, ny = y + dy;
            if (dansPlateau(nx, ny) && plateau[nx][ny] === null) {
                coups.push({ de: [x, y], vers: [nx, ny], prises: [], chemin: [] });
            }
        }
    }

    return coups;
}

// tous les coups valides pour une couleur
function coupsValides(plateau, couleur) {
    let tousLesCoups = [];

    for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 10; y++) {
            if (couleurDe(plateau[x][y]) === couleur) {
                tousLesCoups.push(...coupsPourPiece(plateau, x, y));
            }
        }
    }

    // prise obligatoire
    const avecPrise = tousLesCoups.filter(c => c.prises.length > 0);
    if (avecPrise.length === 0) return tousLesCoups;

    // règle du maximum
    const maxPrises = Math.max(...avecPrise.map(c => c.prises.length));
    return avecPrise.filter(c => c.prises.length === maxPrises);
}

// appliquer un coup sur le plateau
function appliquerCoup(plateau, coup) {
    const nouveauPlateau = plateau.map(ligne => [...ligne]);

    const [x1, y1] = coup.de;
    const [x2, y2] = coup.vers;
    const piece = nouveauPlateau[x1][y1];

    nouveauPlateau[x2][y2] = piece;
    nouveauPlateau[x1][y1] = null;

    // retirer les pièces capturées
    for (const [px, py] of (coup.prises || [])) {
        nouveauPlateau[px][py] = null;
    }

    // promotion
    const couleur = couleurDe(piece);
    if (couleur === "blanc" && x2 === 0) nouveauPlateau[x2][y2] = "blanc-dame";
    if (couleur === "noir" && x2 === 9) nouveauPlateau[x2][y2] = "noir-dame";

    return nouveauPlateau;
}

// vérifier s'il y a un gagnant
function verifierGagnant(plateau) {
    const aPieces = (couleur) =>
        plateau.some(ligne => ligne.some(p => couleurDe(p) === couleur));

    const aCoups = (couleur) => coupsValides(plateau, couleur).length > 0;

    if (!aPieces("noir") || !aCoups("noir")) return "blanc";
    if (!aPieces("blanc") || !aCoups("blanc")) return "noir";

    return null;
}

module.exports = {
    initialiserPlateau,
    coupsValides,
    appliquerCoup,
    verifierGagnant,
};
