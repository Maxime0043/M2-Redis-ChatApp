const { getRoom } = require("../utils/rooms.func");
const { buildError } = require("../utils/errors.func");

module.exports = (socket, redis) => {
  socket.use(async ([event, ...args], next) => {
    const checkIfRoomExists = ["join-room"];

    // We add the name of the triggering event in the socket request
    socket.request.eventTriggered = event;

    const data = args[0];
    const invalidDataError = buildError("invalid-data", event);

    // Check if the room exists
    if (checkIfRoomExists.includes(event)) {
      // Verify if the variable "data" is valid
      if (!data) return next(invalidDataError);

      // Verify if the variable "idRoom" is valid
      if (!data?.idRoom || data?.idRoom?.length == 0)
        return next(invalidDataError);

      const { idRoom } = data;
      const room = await getRoom(redis, idRoom);
      const roomExists = room !== undefined;
      const roomExistsError = buildError("room-not-existing", event);

      if (!roomExists) return next(roomExistsError);
    }

    next();
  });
};
