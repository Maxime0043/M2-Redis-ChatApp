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
};
