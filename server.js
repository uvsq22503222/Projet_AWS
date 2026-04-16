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

// HTTP server
const server = http.createServer(app);

// WebSocket
const wss = new WebSocket.Server({ server });

// stocke users
const clients = new Map(); // ws -> userId

const users = [];

// users registered
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const hash = await bcrypt.hash(password, 10);

    await db('users').insert({
      username,
      password: hash
    });

    res.json({ success: true });
  } catch (e) {
    res.json({ success: false, error: 'username already exists' });
  }
});

// users login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const user = await db('users')
    .where({ username })
    .first();

  if (!user) {
    return res.json({ success: false, error: 'username not found' });
  }

  const ok = await bcrypt.compare(password, user.password);

  if (!ok) {
    return res.json({ success: false, error: 'incorrect password' });
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      score: user.score
    }
  });
});

wss.on('connection', (ws) => {
  console.log("WebSocket connected");

  ws.on('message', (msg) => {
    handleMessage(ws, msg, clients, users, wss);
  });

  ws.on('close', async () => {
    const userId = clients.get(ws);

    await handleDisconnect(ws, clients, users, wss);

    clients.delete(ws);

    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
      users.splice(index, 1);
    }

    console.log("WebSocket disconnected:", userId);

    wss.clients.forEach(client => {
      client.send(JSON.stringify({
        type: "players",
        data: users
      }));
    });
  });

});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});