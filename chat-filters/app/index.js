const redis = require("redis");
const subscriber = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
  },
});

// Build the filtering steps
const { formatMessage, filterInsults } = require("./filters");
const steps = [formatMessage, filterInsults];

(async () => {
  await subscriber.connect();

  const publisher = subscriber.duplicate();
  await publisher.connect();

  const channelRecieve = "chat-filter-start";
  const channelSend = "chat-filter-end";

  await subscriber.subscribe(channelRecieve, async (data) => {
    data = JSON.parse(data);

    steps.forEach((step) => {
      data.messageData.message = step(data.messageData.message);
    });

    await publisher.publish(channelSend, JSON.stringify(data));
  });
})();
