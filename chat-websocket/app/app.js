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

// Creation of a Redis client
const redis = require("redis");
const client = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
  },
});

// Retrieving middlewares, controllers and utils
const middlewares = require("./middlewares");
const controllers = require("./controllers");
const { emitError } = require("./utils/errors.func");

(async () => {
  // Connecting to Redis
  await client.connect();

  // Websocket Manager
  io.on("connection", (socket) => {
    console.log(`[CONNECTION] ${socket.id}`);

    middlewares(socket, client);
    controllers(io, socket, client);

    // Manage errors
    socket.on("error", (err) => {
      emitError(socket, err);
    });

    // Client disconnection
    socket.on("disconnect", () => console.log(`[DISCONNECTION] ${socket.id}`));
  });
})();

module.exports = httpServer;
module.exports.io = io;
