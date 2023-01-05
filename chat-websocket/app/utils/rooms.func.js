const getAllRooms = async (redis) => {
  let rooms = await redis.SMEMBERS(`rooms`);
  rooms = rooms.map((room) => JSON.parse(room));

  return rooms;
};

const getRoom = async (redis, idRoom) => {
  const rooms = await getAllRooms(redis);
  const room = rooms.find((room) => room.id == idRoom);

  return room;
};

const getRoomsIds = async (redis, idUser) => {
  return await redis.SMEMBERS(`users:${idUser}:rooms`);
};

const getRoomId = async (redis, idUser, idRoom) => {
  const rooms = await getRoomsIds(redis, idUser);
  const room = rooms.find((id) => id == idRoom);

  return room;
};

const getUserRooms = async (redis, idUser) => {
  const userRoomsIds = await getRoomsIds(redis, idUser);
  let rooms = await getAllRooms(redis);

  rooms = rooms.filter((room) => userRoomsIds.includes(room.id));

  return rooms;
};

module.exports = {
  getAllRooms: getAllRooms,
  getRoom: getRoom,
  getRoomsIds: getRoomsIds,
  getRoomId: getRoomId,
  getUserRooms: getUserRooms,
};
