# Projet_AWS
Jeu de dames

Description du jeu

1. Deux joueurs, le noir et le blanc, jouent sur un échiquier 10×10.

2. Chaque joueur dispose de 20 pions. Les pions ne peuvent être posés que sur les cases noire, ils commencent la partie disposés sur les quatres lignes les plus proches du joueur respectif.

3. Les joueurs jouent à tour de rôle, les blancs commencent. Un pion ne peut se déplacer que d’une case, en diagonal vers l’avant (deux choix possibles). Lorsque l’une des deux cases en face d’un pion est occupée par un pion adverse, et qu’il y a une case libre derrière, le joueur peut prendre le pion adverse en le “sautant”, le pion est alors éliminé de l’échiquier.

4. Lorsqu’un pion arrive sur la ligne opposée de l’échiquier, il est promu en dame. Une dame se comporte comme un pion, mais en plus elle peut se déplacer en arrière.

5. Le joueur qui n’a plus de pions perd la partie.

Description du projet

- Une page permettant de s'enregistrer,
- Une page présentant la liste des utilisateurs en ligne, leur nombre de parties gagnées/perdues, et autres informations éventuelles,
- Un mécanisme pour se connecter,
- Un mécanisme permettant de défier un adversaire,
- Une interface permettant de jouer le jeu.

L'interface du jeu doit être réalisée en JavaScript :
- Les pions sont disposés au début la partie, et c'est au blanc de jouer.
- Le joueur sélectionne le pion à jouer en cliquant dessus, puis il clique sur la case où le pion doit se déplacer. Le serveur vérifie que le coup est valide, et prend le pion adverse le cas échéant.
- Lorsqu'un joueur a perdu tous ses pions, ce joueur est déclaré perdant et le jeu se termine.

Modules supplémentaires

- Utiliser une base de données No-SQL (par ex., MongoDB) à la place de SQL.
- (Obligatoire en parcours SeCReTS et IRS) Configurer https sur le serveur Node.js.
- Vous pouvez utiliser AJAX et l'API fetch vu en cours pour écrire l’application complète, cependant cela
deviendrait rapidement désordonné, lent et sujet aux erreurs. À la place, vous pouvez remplacer les appels AJAX par des WebSockets. Pour gérer les WebSockets côté serveur, nous utiliserons le module ws.
Côté client, nous utiliserons l’API native WebSocket. Ces deux interfaces sont très similaires.
- Permettre à un utilisateur de quitter un jeu en abandonnant (le jeu est considéré comme perdu pour l’utilisateur). Gérer les déconnexions inattendues (abandonner le jeu si l’utilisateur est en train de jouer).
