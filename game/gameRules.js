function initialiserPlateau() {
    const plateau = Array.from({ length: 10 }, () => Array(10).fill(null));

    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 10; j++) {
            if ((i + j) % 2 === 1) plateau[i][j] = "noir";
        }
    }

    for (let i = 6; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
            if ((i + j) % 2 === 1) plateau[i][j] = "blanc";
        }
    }

    return plateau;
}

function couleurDe(piece) {
    if (!piece) return null;
    return piece.startsWith("blanc") ? "blanc" : "noir";
}

function estDame(piece) {
    return piece && piece.endsWith("dame");
}

function dansPlateau(x, y) {
    return x >= 0 && x < 10 && y >= 0 && y < 10;
}

// Génère toutes les extensions de prise possibles depuis (x, y).
// dejaPris : positions déjà capturées dans cette séquence (toujours sur le plateau).
// piece    : la pièce qui se déplace.
// Retourne un tableau de { vers, prises, chemin }.
function continuerPrise(plateau, x, y, dejaPris, piece) {
    const couleur = couleurDe(piece);
    const extensions = [];

    if (estDame(piece)) {
        for (const [dx, dy] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
            // Chercher la première case non vide dans cette direction
            let ex = x + dx, ey = y + dy;
            while (dansPlateau(ex, ey) && plateau[ex][ey] === null) {
                ex += dx; ey += dy;
            }

            if (!dansPlateau(ex, ey)) continue;
            // Pièce déjà capturée dans cette séquence : bloque
            if (dejaPris.some(d => d[0] === ex && d[1] === ey)) continue;
            // Pièce de la même couleur : bloque
            if (!plateau[ex][ey] || couleurDe(plateau[ex][ey]) === couleur) continue;

            // Ennemi trouvé en (ex, ey) — chercher les cases d'atterrissage
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
        // Pion : peut capturer dans les 4 directions diagonales
        for (const [dx, dy] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
            const ex = x + dx, ey = y + dy; // position de l'ennemi
            const lx = ex + dx, ly = ey + dy; // case d'atterrissage

            if (!dansPlateau(ex, ey) || !dansPlateau(lx, ly)) continue;

            const p = plateau[ex][ey];
            if (!p || couleurDe(p) === couleur) continue;
            if (dejaPris.some(d => d[0] === ex && d[1] === ey)) continue;

            if (plateau[lx][ly] !== null) continue; // case d'atterrissage occupée
            if (dejaPris.some(d => d[0] === lx && d[1] === ly)) continue;

            const nouvellesPrises = [...dejaPris, [ex, ey]];

            // Si le pion atteint la rangée de promotion, il devient dame et la séquence s'arrête
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

function coupsPourPiece(plateau, x, y) {
    const piece = plateau[x][y];
    if (!piece) return [];

    const couleur = couleurDe(piece);
    const coups = [];

    // Chercher d'abord les prises
    const prises = continuerPrise(plateau, x, y, [], piece);
    for (const e of prises) {
        coups.push({ de: [x, y], vers: e.vers, prises: e.prises, chemin: e.chemin });
    }

    if (coups.length > 0) return coups;

    // Pas de prise : déplacements simples
    if (estDame(piece)) {
        for (const [dx, dy] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
            let nx = x + dx, ny = y + dy;
            while (dansPlateau(nx, ny) && plateau[nx][ny] === null) {
                coups.push({ de: [x, y], vers: [nx, ny], prises: [], chemin: [] });
                nx += dx; ny += dy;
            }
        }
    } else {
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

function coupsValides(plateau, couleur) {
    let tousLesCoups = [];

    for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 10; y++) {
            if (couleurDe(plateau[x][y]) === couleur) {
                tousLesCoups.push(...coupsPourPiece(plateau, x, y));
            }
        }
    }

    // Prise obligatoire
    const avecPrise = tousLesCoups.filter(c => c.prises.length > 0);
    if (avecPrise.length === 0) return tousLesCoups;

    // Règle du maximum : on ne garde que les séquences qui capturent le plus
    const maxPrises = Math.max(...avecPrise.map(c => c.prises.length));
    return avecPrise.filter(c => c.prises.length === maxPrises);
}

function appliquerCoup(plateau, coup) {
    const nouveauPlateau = plateau.map(ligne => [...ligne]);

    const [x1, y1] = coup.de;
    const [x2, y2] = coup.vers;

    const piece = nouveauPlateau[x1][y1];

    nouveauPlateau[x2][y2] = piece;
    nouveauPlateau[x1][y1] = null;

    for (const [px, py] of (coup.prises || [])) {
        nouveauPlateau[px][py] = null;
    }

    // Promotion
    const couleur = couleurDe(piece);
    if (couleur === "blanc" && x2 === 0) nouveauPlateau[x2][y2] = "blanc-dame";
    if (couleur === "noir" && x2 === 9) nouveauPlateau[x2][y2] = "noir-dame";

    return nouveauPlateau;
}

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
