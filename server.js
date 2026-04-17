const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const bcrypt = require('bcrypt');
const db = require('./db');

const { handleMessage, handleDisconnect } = require('./websocket/handlers');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// serveur HTTP
const server = http.createServer(app);

// serveur WebSocket
const wss = new WebSocket.Server({ server });

const clients = new Map(); // ws -> userId
const users = []; // joueurs en ligne

// inscription
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        const hash = await bcrypt.hash(password, 10); // hashage mot de passe
        await db('users').insert({ username, password: hash });
        res.json({ success: true });
    } catch (e) {
        res.json({ success: false, error: 'username already exists' });
    }
});

// connexion
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const user = await db('users').where({ username }).first();

    if (!user) return res.json({ success: false, error: 'username not found' });

    const ok = await bcrypt.compare(password, user.password); // vérification mot de passe
    if (!ok) return res.json({ success: false, error: 'incorrect password' });

    res.json({
        success: true,
        user: { id: user.id, username: user.username, score: user.score }
    });
});

wss.on('connection', (ws) => {
    console.log("WebSocket connected");

    // message reçu
    ws.on('message', (msg) => {
        handleMessage(ws, msg, clients, users, wss);
    });

    // déconnexion
    ws.on('close', async () => {
        const userId = clients.get(ws);

        await handleDisconnect(ws, clients, users, wss); // gérer abandon si en partie

        clients.delete(ws);

        // retirer de la liste en ligne
        const index = users.findIndex(u => u.id === userId);
        if (index !== -1) users.splice(index, 1);

        console.log("WebSocket disconnected:", userId);

        // mettre à jour la liste pour tous
        wss.clients.forEach(client => {
            client.send(JSON.stringify({ type: "players", data: users }));
        });
    });
});

server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
