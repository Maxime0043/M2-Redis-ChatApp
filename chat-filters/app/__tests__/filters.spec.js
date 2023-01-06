// Import App
require("../index");

// Creation of a Redis client
const redis = require("redis");
const publisher = redis.createClient({
  socket: {
    host: "localhost",
    port: 6379,
  },
});

describe("Chat Filters", () => {
  let subscriber;

  const channelSend = "chat-filter-start";
  const channelRecieve = "chat-filter-end";

  beforeAll(async () => {
    // Create subscriber Redis client
    subscriber = publisher.duplicate();

    // Connecting to Redis
    await publisher.connect();
    await subscriber.connect();
  });

  describe("Filter : Format Message", () => {
    test.each([
      { message: "some text" },
      { message: " some text" },
      { message: "some text " },
      { message: "  some  text  " },
    ])("Send Message : %p -> recieve 'some text'", (data, done) => {
      subscriber.subscribe(channelRecieve, (res) => {
        console.log(JSON.parse(res));
        subscriber.unsubscribe(channelRecieve);

        const resData = JSON.parse(res);

        expect(resData.messageData.message).toBe("some text");
        done();
      });

      const dataToSend = {
        messageData: { ...data },
      };

      publisher.publish(channelSend, JSON.stringify(dataToSend));
    });
  });

  describe("Filter : Filter Insults", () => {
    test.each([
      { message: "débile" },
      { message: "merde" },
      { message: "crétin" },
    ])("Send Message : %p -> recieve text like 'd****e'", (data, done) => {
      subscriber.subscribe(channelRecieve, (res) => {
        console.log(JSON.parse(res));
        subscriber.unsubscribe(channelRecieve);

        const resData = JSON.parse(res);
        const message = resData.messageData.message;

        let insultRegex;

        if (data.length == 2) {
          insultRegex = new RegExp(`${data.message[0]}\*`, "gi");
        } else {
          insultRegex = new RegExp(
            `${data.message[0]}[*]{${data.message.length - 2}}${
              data.message[data.message.length - 1]
            }`,
            "gi"
          );
        }

        expect(insultRegex.test(message)).toBe(true);
        done();
      });

      const dataToSend = {
        messageData: { ...data },
      };

      publisher.publish(channelSend, JSON.stringify(dataToSend));
    });
  });
});
