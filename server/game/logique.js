function initialiserPlateau() {
    const plateau = Array.from({ length: 10 }, () => Array(10).fill(null));
    for (let ligne = 0; ligne < 4; ligne++)
        for (let colonne = 0; colonne < 10; colonne++)
            if ((ligne + colonne) % 2 === 1) plateau[ligne][colonne] = 'noir';
    for (let ligne = 6; ligne < 10; ligne++)
        for (let colonne = 0; colonne < 10; colonne++)
            if ((ligne + colonne) % 2 === 1) plateau[ligne][colonne] = 'blanc';
    return plateau;
}

function initialiserPartie(joueurBlanc, joueurNoir) {
    return {
        plateau: initialiserPlateau(),
        tour: 'blanc',
        joueurBlanc,
        joueurNoir,
        gagnant: null,
    };
}

function dansPlateau(ligne, colonne) {
    return ligne >= 0 && ligne < 10 && colonne >= 0 && colonne < 10;
}

function couleurDe(piece) {
    if (!piece) return null;
    return piece.startsWith('blanc') ? 'blanc' : 'noir';
}

function estDame(piece) {
    return piece && piece.endsWith('dame');
}

function coupsPourPiece(plateau, ligne, colonne) {
    const piece = plateau[ligne][colonne];
    if (!piece) return [];
    const couleur = couleurDe(piece);
    const coups = [];

    const directionAvant = couleur === 'blanc' ? -1 : 1;
    const directions = estDame(piece)
        ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
        : [[directionAvant, -1], [directionAvant, 1]];

    for (const [dl, dc] of directions) {
        const nl = ligne + dl;
        const nc = colonne + dc;
        if (!dansPlateau(nl, nc)) continue;

        if (plateau[nl][nc] === null) {
            coups.push({ de: { ligne, colonne }, vers: { ligne: nl, colonne: nc }, prise: null });
        } else if (couleurDe(plateau[nl][nc]) !== couleur) {
            const pl = nl + dl;
            const pc = nc + dc;
            if (dansPlateau(pl, pc) && plateau[pl][pc] === null) {
                coups.push({ de: { ligne, colonne }, vers: { ligne: pl, colonne: pc }, prise: { ligne: nl, colonne: nc } });
            }
        }
    }
    return coups;
}

function coupsValides(plateau, couleur) {
    const tousLesCoups = [];
    for (let ligne = 0; ligne < 10; ligne++)
        for (let colonne = 0; colonne < 10; colonne++)
            if (couleurDe(plateau[ligne][colonne]) === couleur)
                tousLesCoups.push(...coupsPourPiece(plateau, ligne, colonne));

    const prises = tousLesCoups.filter(c => c.prise !== null);
    return prises.length > 0 ? prises : tousLesCoups;
}

function jouerCoup(partie, de, vers) {
    const { plateau, tour } = partie;
    const coups = coupsValides(plateau, tour);

    const coup = coups.find(
        c => c.de.ligne === de.ligne && c.de.colonne === de.colonne
            && c.vers.ligne === vers.ligne && c.vers.colonne === vers.colonne
    );

    if (!coup) return { ok: false, erreur: 'Coup invalide' };

    const nouveauPlateau = plateau.map(ligne => [...ligne]);
    const piece = nouveauPlateau[de.ligne][de.colonne];

    nouveauPlateau[vers.ligne][vers.colonne] = piece;
    nouveauPlateau[de.ligne][de.colonne] = null;
    if (coup.prise) nouveauPlateau[coup.prise.ligne][coup.prise.colonne] = null;

    const couleur = couleurDe(piece);
    if (couleur === 'blanc' && vers.ligne === 0) nouveauPlateau[vers.ligne][vers.colonne] = 'blanc-dame';
    if (couleur === 'noir' && vers.ligne === 9) nouveauPlateau[vers.ligne][vers.colonne] = 'noir-dame';

    const tourSuivant = tour === 'blanc' ? 'noir' : 'blanc';
    const gagnant = verifierGagnant(nouveauPlateau, tourSuivant);

    return {
        ok: true,
        partie: { ...partie, plateau: nouveauPlateau, tour: tourSuivant, gagnant },
    };
}

function verifierGagnant(plateau, tourSuivant) {
    const aPieces = couleur => plateau.some(ligne => ligne.some(c => couleurDe(c) === couleur));
    const aCoups = couleur => coupsValides(plateau, couleur).length > 0;

    if (!aPieces('noir') || !aCoups('noir')) return 'blanc';
    if (!aPieces('blanc') || !aCoups('blanc')) return 'noir';
    return null;
}

module.exports = { initialiserPartie, jouerCoup, coupsValides };
