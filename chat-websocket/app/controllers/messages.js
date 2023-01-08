const { getMessage } = require("../utils/messages.func");

module.exports = async (io, socket, redis) => {
  // Manage Redis Pub
  const publisher = redis.duplicate();
  await publisher.connect();

  // Manage Events
  socket.on("new-message", async (data) => {
    const { idUser, idRoom, message, username } = data;

    // We create the identifier of the message
    const idMessage = await redis.INCR(`rooms:${idRoom}:messages:id`);

    // We add the message
    const messageData = {
      id: idMessage,
      author: idUser,
      date: Date.now(),
      message,
      username,
    };

    await publisher.publish(
      "chat-filter-start",
      JSON.stringify({ idRoom, messageData })
    );
  });

  socket.on("delete-message", async (data) => {
    const { idRoom, idMessage } = data;

    // Retrieve the message to delete
    const message = await getMessage(redis, idRoom, idMessage);

    // If the message has not been found
    if (!message) return;

    // Delete the message from the room
    await redis.SREM(`rooms:${idRoom}:messages`, JSON.stringify(message));

    // We indicate to the users of the room the message to delete
    io.to(idRoom).emit("delete-message", { idMessage: idMessage, idRoom: idRoom });

    console.log(`[DELETE MESSAGE] ${idRoom} : ${idMessage}`);
  });
};

// Manage Redis Sub
module.exports.activateSubscribers = async (io, redis) => {
  const subscriber = redis.duplicate();
  await subscriber.connect();

  await subscriber.subscribe("chat-filter-end", async (data) => {
    const { idRoom, messageData } = JSON.parse(data);
    await redis.SADD(`rooms:${idRoom}:messages`, JSON.stringify(messageData));

    // We send the message to the users of the room
    io.to(idRoom).emit("new-message", { message: messageData, idRoom: idRoom });

    console.log(`[NEW MESSAGE] ${idRoom} : ${JSON.stringify(messageData)}`);
  });
};
