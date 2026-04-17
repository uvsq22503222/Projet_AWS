# Projet_AWS — Jeu de dames international

- GE Shuning (AMIS)
- HUANG Yanmo (DATASCALE)

---

## Description du jeu

Le jeu de dames international se joue à deux joueurs (noir et blanc) sur un échiquier de 10×10.

1. Chaque joueur dispose de 20 pions placés sur les cases noires des quatre premières rangées côté joueur.
2. Les blancs commencent. Les joueurs jouent à tour de rôle.
3. Un pion se déplace d'une case en diagonale vers l'avant. S'il peut sauter un pion adverse avec une case vide derrière, il doit le capturer.
4. **Prise obligatoire** : si une capture est possible, le joueur doit capturer. Si plusieurs séquences sont possibles, il doit choisir celle qui capture le **maximum** de pions.
5. **Rafle (captures multiples)** : après une prise, si le pion peut encore capturer, il doit continuer dans le même tour.
6. **Capture arrière** : un pion peut capturer en arrière (dans les 4 directions diagonales).
7. **Promotion en dame** : un pion atteignant la rangée opposée devient une dame. La dame peut se déplacer de plusieurs cases en diagonale dans toutes les directions (dame volante), et capturer à distance.
8. Le joueur qui n'a plus de pions, ou qui ne peut plus se déplacer, perd la partie.

---

## Lancer le projet

```bash
npm install
node init_db.js   # initialiser la base de données (à faire une seule fois)
node server.js    # démarrer le serveur
```

Ouvrir [http://localhost:3000](http://localhost:3000) dans le navigateur.

---

## Structure du projet

```
├── server.js              # Serveur Express + WebSocket
├── db.js                  # Connexion SQLite via Knex
├── init_db.js             # Initialisation de la base de données
├── knexfile.js            # Configuration Knex
├── game/
│   ├── gameRules.js       # Logique complète du jeu de dames international
│   └── gameManager.js     # Gestion des parties en cours
├── websocket/
│   └── handlers.js        # Gestion des messages WebSocket
└── public/
    ├── index.html         # Page de connexion / inscription
    ├── salon.html         # Salon — liste des joueurs en ligne
    ├── partie.html        # Interface de jeu
    └── css/style.css
```

---

## Fonctionnalités implémentées

### Fonctionnalités de base
- Inscription et connexion avec mot de passe haché (bcrypt)
- Salon affichant les joueurs en ligne avec leurs **victoires et défaites**
- Mécanisme de défi : envoyer, accepter ou refuser
- Interface de jeu complète en JavaScript

### Modules supplémentaires
- **WebSockets** : toute la communication temps réel utilise WebSocket (`ws`) côté serveur et l'API native `WebSocket` côté client, à la place d'AJAX
- **Abandon de partie** : un joueur peut abandonner en cours de partie (bouton "Abandonner") — le jeu est considéré comme perdu pour lui
- **Déconnexion inattendue** : si un joueur se déconnecte pendant une partie, un délai de 5 secondes est attendu ; s'il ne se reconnecte pas, la partie est abandonnée et l'adversaire est déclaré vainqueur

### Règles du jeu de dames international
- Prise obligatoire et règle du maximum de captures
- Captures multiples enchaînées (rafle) dans un seul tour
- Capture en arrière pour les pions
- Dame volante (déplacement et capture sur plusieurs cases)
- Promotion en dame lors du passage à la dernière rangée

---

## Interface de jeu

- **Jaune** : pion sélectionné
- **Bleu** : cases de destination valides pour l'étape en cours
- **Vert** : pions adverses capturables

Pour une rafle (captures multiples), le joueur clique étape par étape : chaque clic correspond à un saut intermédiaire, le coup complet est envoyé au serveur à la fin de la séquence.
