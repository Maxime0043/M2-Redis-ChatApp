const buildError = (name, event) => {
  const error = new Error();

  error.name = name;
  error.event = event;

  return error;
};

const emitError = (socket, err) => {
  const error = { error: err.name, event: err.event };

  socket.emit("error", error);
  console.log(`[ERROR] ${JSON.stringify(error)}`);
};

module.exports = {
  buildError: buildError,
  emitError: emitError,
};
