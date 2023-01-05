const getMessages = async (redis, idRoom) => {
  let messages = await redis.SMEMBERS(`rooms:${idRoom}:messages`);
  messages = messages.map((msg) => JSON.parse(msg)).sort((a, b) => a.id - b.id);

  return messages;
};

const getMessage = async (redis, idRoom, idMessage) => {
  const messages = await getMessages(redis, idRoom);
  const message = messages.find((msg) => msg.id == idMessage);

  return message;
};

module.exports = {
  getMessages: getMessages,
  getMessage: getMessage,
};
