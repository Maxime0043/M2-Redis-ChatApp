const Client = require("socket.io-client");
const httpServer = require("../app");
const { io } = require("../app");

// Creation of a Redis client
const redis = require("redis");
const redisClient = redis.createClient({
  socket: {
    host: "localhost",
    port: 6379,
  },
});

const generateMessage = (length) => {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

describe("Message Socket", () => {
  let clientSocket;
  let idRoom;
  let idMessage;

  beforeAll((done) => {
    httpServer.listen(async () => {
      const port = httpServer.address().port;

      // Connecting to Redis
      await redisClient.connect();

      // Create users
      await redisClient.SADD("users", JSON.stringify({ id: "idUser1" }));
      await redisClient.SADD("users", JSON.stringify({ id: "idUser2" }));

      clientSocket = new Client(`http://localhost:${port}`);
      clientSocket.on("connect", () => {
        // Create a room
        clientSocket.emit("create-room", {
          idUser: "idUser1",
          name: "first room",
        });

        // Let the second user join the room
        clientSocket.once("join-room", (data) => {
          idRoom = data.room.id;

          clientSocket.emit("join-room", {
            idUser: "idUser2",
            idRoom: data.room.id,
          });

          clientSocket.once("join-room", () => done());
        });
      });
    });
  });

  afterAll(async () => {
    // Purge DB
    await redisClient.DEL("users");
    await redisClient.DEL("rooms");
    await redisClient.DEL(`rooms:${idRoom}:users`);
    await redisClient.DEL(`rooms:${idRoom}:messages`);
    await redisClient.DEL(`rooms:${idRoom}:messages:id`);
    await redisClient.DEL(`users:idUser1:rooms`);
    await redisClient.DEL(`users:idUser2:rooms`);

    // Close connections
    io.close();
    clientSocket.close();
    await redisClient.disconnect();
  });

  describe("Event 'new-messages'", () => {
    test.each([
      null,
      "idUser",
      {},
      { id: "idUser1" },
      { idUser: null, idRoom: null, message: null },
      { idUser: "idUser1", idRoom: null, message: null },
      { idUser: null, idRoom, message: null },
      { idUser: null, idRoom: null, message: "first message" },
      { idUser: "", idRoom: "", message: "" },
    ])("Invalid data : %p", (data, done) => {
      clientSocket.once("error", async (res) => {
        const messagesCount = await redisClient.SCARD(
          `rooms:${idRoom}:messages`
        );

        expect(res?.error).toBe("invalid-data");
        expect(messagesCount).toBe(0);
        done();
      });
      clientSocket.emit("new-message", data);
    });

    test("Invalid data : message too long", (done) => {
      clientSocket.once("error", async (res) => {
        const messagesCount = await redisClient.SCARD(
          `rooms:${idRoom}:messages`
        );

        expect(res?.error).toBe("message-too-long");
        expect(messagesCount).toBe(0);
        done();
      });
      clientSocket.emit("new-message", {
        idUser: "idUser1",
        idRoom,
        message: generateMessage(2001),
      });
    });

    test("Valid data", (done) => {
      clientSocket.once("new-message", async (data) => {
        const messageExists = await redisClient.SISMEMBER(
          `rooms:${idRoom}:messages`,
          JSON.stringify(data.message)
        );
        const nextIdMessage = await redisClient.GET(
          `rooms:${idRoom}:messages:id`
        );

        idMessage = data.message.id;

        expect(data).toBeDefined();
        expect(data.message).toBeDefined();
        expect(data.message.message).toBe("first message");
        expect(messageExists).toBe(true);
        expect(nextIdMessage).toBe("1");
        done();
      });
      clientSocket.emit("new-message", {
        idUser: "idUser1",
        idRoom,
        message: "first message",
      });
    });
  });

  describe("Event 'delete-messages'", () => {
    test.each([
      null,
      "idUser",
      {},
      { id: "idUser1" },
      { idUser: null, idRoom: null, idMessage: null },
      { idUser: "idUser1", idRoom: null, idMessage: null },
      { idUser: null, idRoom, idMessage: null },
      { idUser: null, idRoom: null, idMessage },
      { idUser: "", idRoom: "", idMessage: "" },
    ])("Invalid data : %p", (data, done) => {
      clientSocket.once("error", async (res) => {
        const messagesCount = await redisClient.SCARD(
          `rooms:${idRoom}:messages`
        );

        expect(res?.error).toBe("invalid-data");
        expect(messagesCount).toBe(1);
        done();
      });
      clientSocket.emit("delete-message", data);
    });

    test("Invalid data : user not author", (done) => {
      clientSocket.once("error", async (res) => {
        const messagesCount = await redisClient.SCARD(
          `rooms:${idRoom}:messages`
        );

        expect(res?.error).toBe("user-not-author");
        expect(messagesCount).toBe(1);
        done();
      });
      clientSocket.emit("delete-message", {
        idUser: "idUser2",
        idRoom,
        idMessage,
      });
    });

    test("Valid data", (done) => {
      clientSocket.once("delete-message", async (data) => {
        const messagesCount = await redisClient.SCARD(
          `rooms:${idRoom}:messages`
        );
        const nextIdMessage = await redisClient.GET(
          `rooms:${idRoom}:messages:id`
        );

        expect(data).toBeDefined();
        expect(data.idMessage).toBeDefined();
        expect(messagesCount).toBe(0);
        expect(nextIdMessage).toBe("1");
        done();
      });
      clientSocket.emit("delete-message", {
        idUser: "idUser1",
        idRoom,
        idMessage,
      });
    });
  });
});
