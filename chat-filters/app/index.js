const redis = require("redis");
const subscriber = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
  },
});

(async () => {
  await subscriber.connect();
})();
