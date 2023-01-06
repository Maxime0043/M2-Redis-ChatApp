const getUsers = async (redis) => {
  let users = await redis.SMEMBERS(`users`);
  users = users.map((user) => JSON.parse(user));

  return users;
};

module.exports = {
  getUsers: getUsers,
};
