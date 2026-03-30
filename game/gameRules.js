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


function coupsPourPiece(plateau, x, y) {
  const piece = plateau[x][y];
  if (!piece) return [];

  const couleur = couleurDe(piece);
  const coups = [];

  const direction = couleur === "blanc" ? -1 : 1;

  const directions = estDame(piece)
    ? [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ]
    : [
        [direction, -1],
        [direction, 1],
      ];

  for (const [dx, dy] of directions) {
    const nx = x + dx;
    const ny = y + dy;

    if (!dansPlateau(nx, ny)) continue;


    if (plateau[nx][ny] === null) {
      coups.push({
        de: [x, y],
        vers: [nx, ny],
        prise: null,
      });
    }
 
    else if (couleurDe(plateau[nx][ny]) !== couleur) {
      const cx = nx + dx;
      const cy = ny + dy;

      if (dansPlateau(cx, cy) && plateau[cx][cy] === null) {
        coups.push({
          de: [x, y],
          vers: [cx, cy],
          prise: [nx, ny],
        });
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

  const prises = tousLesCoups.filter((c) => c.prise !== null);
  return prises.length > 0 ? prises : tousLesCoups;
}

function appliquerCoup(plateau, coup) {
  const nouveauPlateau = plateau.map((ligne) => [...ligne]);

  const [x1, y1] = coup.de;
  const [x2, y2] = coup.vers;

  const piece = nouveauPlateau[x1][y1];

  nouveauPlateau[x2][y2] = piece;
  nouveauPlateau[x1][y1] = null;

  if (coup.prise) {
    const [px, py] = coup.prise;
    nouveauPlateau[px][py] = null;
  }

  const couleur = couleurDe(piece);
  if (couleur === "blanc" && x2 === 0) nouveauPlateau[x2][y2] = "blanc-dame";
  if (couleur === "noir" && x2 === 9) nouveauPlateau[x2][y2] = "noir-dame";

  return nouveauPlateau;
}

function verifierGagnant(plateau) {
  const aPieces = (couleur) =>
    plateau.some((ligne) => ligne.some((p) => couleurDe(p) === couleur));

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
