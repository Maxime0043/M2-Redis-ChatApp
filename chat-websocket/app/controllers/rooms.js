const { v4: uuidv4 } = require("uuid");

const { getRoom, getUserRooms } = require("../utils/rooms.func");
const { getUsers } = require("../utils/users.func");
const { getMessages } = require("../utils/messages.func");
const { buildError, emitError } = require("../utils/errors.func");

module.exports = (io, socket, redis) => {
  socket.on("get-rooms", async (data) => {
    // Data validation
    if (!data || !data?.idUser || data?.idUser?.length == 0) {
      const err = buildError("invalid-data", socket.request.eventTriggered);
      emitError(socket, err);
      return;
    }

    const { idUser } = data;

    // Retrieve rooms
    const rooms = await getUserRooms(redis, idUser);

    // We send the list of rooms to the user
    socket.emit("get-rooms", { rooms });

    console.log(`[GET ROOMS] ${idUser}`);
  });

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

  socket.on("join-room", async (data) => {
    const { idRoom, idUser } = data;

    // Check if the user is already in this room
    const isMember = await redis.SISMEMBER(`users:${idUser}:rooms`, idRoom);

    // Adding the user to the room
    if (!isMember) {
      await redis.SADD(`rooms:${idRoom}:users`, idUser);
      await redis.SADD(`users:${idUser}:rooms`, idRoom);
    }
    socket.join(idRoom);

    // Retrieve the messages
    const messages = await getMessages(redis, idRoom);

    // Retrieve the room
    const room = await getRoom(redis, idRoom);

    // We tell the user that he has joined the room
    socket.emit("join-room", { room, messages });

    console.log(`[JOIN ROOM] ${idUser} : ${idRoom}`);
  });

  socket.on("delete-room", async (data) => {
    const { idRoom, idUser } = data;

    // Retrieve all users
    const users = await getUsers(redis);

    // Retrieve the room to delete
    const room = await getRoom(redis, idRoom);

    // Delete room
    await redis.SREM(`rooms`, JSON.stringify(room));
    await redis.DEL(`rooms:${idRoom}:users`);
    await redis.DEL(`rooms:${idRoom}:messages`);
    await redis.DEL(`rooms:${idRoom}:messages:id`);

    console.log(users);

    // Remove all users from the room
    users.forEach(
      async (user) => await redis.SREM(`users:${user.id}:rooms`, idRoom)
    );

    // We tell the users that the room has been deleted
    io.to(idRoom).emit("delete-room", { idRoom });

    // disconnect all users in the room
    io.in(idRoom).socketsLeave(idRoom);

    console.log(`[DELETE ROOM] ${idUser} : ${idRoom}`);
  });
};
