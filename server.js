const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const { handleMessage } = require('./websocket/handlers');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

// HTTP server
const server = http.createServer(app);

// WebSocket
const wss = new WebSocket.Server({ server });

// stocke users
const clients = new Map(); // ws -> userId

// users default
const users = ["player1", "player2"];

wss.on('connection', (ws) => {
  console.log("Client connected");

  ws.on('message', (msg) => {
    handleMessage(ws, msg, clients, users, wss);
  });

  ws.on('close', () => {
    console.log("Client disconnected");
    clients.delete(ws);
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});