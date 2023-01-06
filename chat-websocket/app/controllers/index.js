module.exports = (io, socket, redis) => {
  require("./rooms")(io, socket, redis);
  require("./messages")(io, socket, redis);
};
