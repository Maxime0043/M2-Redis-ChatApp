const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

// Creation of the websocket
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Websocket Manager
io.on("connection", (socket) => {
  console.log(`[CONNECTION] ${socket.id}`);

  // Client disconnection
  socket.on("disconnect", () => console.log(`[DISCONNECTION] ${socket.id}`));
});

module.exports = httpServer;
module.exports.io = io;
