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

describe("Room Socket", () => {
  let clientSocket;
  let idRoom;

  beforeAll((done) => {
    httpServer.listen(async () => {
      const port = httpServer.address().port;

      // Connecting to Redis
      await redisClient.connect();

      // Create users
      await redisClient.SADD("users", JSON.stringify({ id: "idUser1" }));
      await redisClient.SADD("users", JSON.stringify({ id: "idUser2" }));

      clientSocket = new Client(`http://localhost:${port}`);
      clientSocket.on("connect", done);
    });
  });

  afterAll(async () => {
    // Purge DB
    await redisClient.DEL("users");
    await redisClient.DEL("rooms");
    await redisClient.DEL(`rooms:${idRoom}:users`);
    await redisClient.DEL(`users:idUser1:rooms`);
    await redisClient.DEL(`users:idUser2:rooms`);

    // Close connections
    io.close();
    clientSocket.close();
    await redisClient.disconnect();
  });

  describe("Event 'create-room'", () => {
    test.each([
      null,
      "idUser",
      {},
      { id: "idUser1" },
      { idUser: null, name: null },
      { idUser: "idUser1", name: null },
      { idUser: null, name: "first room" },
      { idUser: "", name: "" },
    ])("Invalid data : %p", (data, done) => {
      clientSocket.once("error", async (res) => {
        const roomsCount = await redisClient.SCARD("rooms");

        expect(res?.error).toBe("invalid-data");
        expect(roomsCount).toBe(0);
        done();
      });
      clientSocket.emit("create-room", data);
    });

    test("Valid data", (done) => {
      clientSocket.once("join-room", async (data) => {
        const roomExists = await redisClient.SISMEMBER(
          "rooms",
          JSON.stringify(data.room)
        );

        idRoom = data.room.id;

        expect(data).toBeDefined();
        expect(data.room).toBeDefined();
        expect(data.room.name).toBe("first room");
        expect(data.room.owner).toBe("idUser1");
        expect(roomExists).toBe(true);
        done();
      });
      clientSocket.emit("create-room", {
        idUser: "idUser1",
        name: "first room",
      });
    });
  });

  describe("Event 'get-rooms'", () => {
    test.each([
      null,
      "idUser",
      {},
      { id: "idUser1" },
      { idUser: null },
      { idUser: "" },
    ])("Invalid data : %p", (data, done) => {
      clientSocket.once("error", (res) => {
        expect(res?.error).toBe("invalid-data");
        done();
      });
      clientSocket.emit("get-rooms", data);
    });

    test("Valid data", (done) => {
      clientSocket.once("get-rooms", (data) => {
        expect(data).toBeDefined();
        expect(data.rooms).toBeDefined();
        done();
      });
      clientSocket.emit("get-rooms", { idUser: "idUser1" });
    });
  });
});
