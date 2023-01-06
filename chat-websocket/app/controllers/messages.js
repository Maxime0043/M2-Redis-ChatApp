const { getMessage } = require("../utils/messages.func");

module.exports = async (io, socket, redis) => {
  socket.on("new-message", async (data) => {
    const { idUser, idRoom, message } = data;

    // We create the identifier of the message
    const idMessage = await redis.INCR(`rooms:${idRoom}:messages:id`);

    // We add the message
    const messageData = {
      id: idMessage,
      author: idUser,
      date: Date.now(),
      message,
    };

    await redis.SADD(`rooms:${idRoom}:messages`, JSON.stringify(messageData));

    // We send the message to the users of the room
    io.to(idRoom).emit("new-message", { message: messageData });

    console.log(`[NEW MESSAGE] ${idRoom} : ${JSON.stringify(messageData)}`);
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
    io.to(idRoom).emit("delete-message", { idMessage });

    console.log(`[DELETE MESSAGE] ${idRoom} : ${idMessage}`);
  });
};
