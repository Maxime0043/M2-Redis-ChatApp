const { v4: uuidv4 } = require("uuid");

const { getRoom } = require("../utils/rooms.func");
const { buildError, emitError } = require("../utils/errors.func");

module.exports = (io, socket, redis) => {
  socket.on("create-room", async (data) => {
    // Data validation
    if (
      !data ||
      !data?.idUser ||
      data?.idUser?.length == 0 ||
      !data?.name ||
      data?.name?.length == 0
    ) {
      const err = buildError("invalid-data", socket.request.eventTriggered);
      emitError(socket, err);
      return;
    }

    let idRoom, roomExists;
    const { idUser, name: nameRoom } = data;

    // Generate room ID
    do {
      idRoom = uuidv4();
      roomExists = await getRoom(redis, idRoom);
    } while (roomExists);

    // Adding the room in the DB
    await redis.SADD(
      "rooms",
      JSON.stringify({ id: idRoom, name: nameRoom, owner: idUser })
    );

    // Adding the user to the room
    await redis.SADD(`rooms:${idRoom}:users`, idUser);
    await redis.SADD(`users:${idUser}:rooms`, idRoom);
    socket.join(idRoom);

    // Retrieve the room
    const room = await getRoom(redis, idRoom);

    // We tell the user that he has joined the room
    socket.emit("join-room", { room, messages: [] });

    console.log(`[CREATE ROOM] ${idUser} : ${idRoom}`);
  });
};
