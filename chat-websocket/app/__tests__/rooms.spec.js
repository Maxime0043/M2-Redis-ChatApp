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

  describe("Event 'join-room'", () => {
    test.each([
      null,
      "idUser",
      "idRoom",
      {},
      { id: "idUser1" },
      { idUser: null, idRoom: null },
      { idUser: "idUser1", idRoom: null },
      { idUser: null, idRoom },
      { idUser: "", idRoom: "" },
    ])("Invalid data : %p", (data, done) => {
      clientSocket.once("error", (res) => {
        expect(res?.error).toBe("invalid-data");
        done();
      });
      clientSocket.emit("join-room", data);
    });

    test("Invalid data : wrong idRoom", (done) => {
      clientSocket.once("error", (res) => {
        expect(res?.error).toBe("room-not-existing");
        done();
      });
      clientSocket.emit("join-room", { idUser: "idUser2", idRoom: "wrong" });
    });

    test("Valid data", (done) => {
      clientSocket.once("join-room", async (data) => {
        const userInRoom = await redisClient.SISMEMBER(
          `rooms:${idRoom}:users`,
          "idUser2"
        );
        const userHasRoom = await redisClient.SISMEMBER(
          `users:idUser2:rooms`,
          idRoom
        );

        expect(data).toBeDefined();
        expect(data.room).toBeDefined();
        expect(data.room.name).toBe("first room");
        expect(data.room.owner).toBe("idUser1");
        expect(userInRoom).toBe(true);
        expect(userHasRoom).toBe(true);
        done();
      });
      clientSocket.emit("join-room", { idUser: "idUser2", idRoom });
    });
  });

  describe("Event 'delete-room'", () => {
    test.each([
      null,
      "idUser",
      "idRoom",
      {},
      { id: "idUser1" },
      { idUser: null, idRoom: null },
      { idUser: "idUser1", idRoom: null },
      { idUser: null, idRoom },
      { idUser: "", idRoom: "" },
    ])("Invalid data : %p", (data, done) => {
      clientSocket.once("error", (res) => {
        expect(res?.error).toBe("invalid-data");
        done();
      });
      clientSocket.emit("delete-room", data);
    });

    test("Invalid data : wrong idRoom", (done) => {
      clientSocket.once("error", (res) => {
        expect(res?.error).toBe("room-not-existing");
        done();
      });
      clientSocket.emit("delete-room", { idUser: "idUser1", idRoom: "wrong" });
    });

    test("Invalid data : user does not own the room", (done) => {
      clientSocket.once("error", (res) => {
        expect(res?.error).toBe("user-not-owner");
        done();
      });
      clientSocket.emit("delete-room", { idUser: "idUser2", idRoom });
    });

    test("Valid data", (done) => {
      clientSocket.once("delete-room", async (data) => {
        const rooms = await redisClient.SMEMBERS("rooms");
        const room = rooms.find((room) => JSON.parse(room).id == idRoom);
        const user1InRoom = await redisClient.SISMEMBER(
          `rooms:${idRoom}:users`,
          "idUser1"
        );
        const user2InRoom = await redisClient.SISMEMBER(
          `rooms:${idRoom}:users`,
          "idUser2"
        );
        const user1HasRoom = await redisClient.SISMEMBER(
          `users:idUser1:rooms`,
          idRoom
        );
        const user2HasRoom = await redisClient.SISMEMBER(
          `users:idUser2:rooms`,
          idRoom
        );

        expect(data).toBeDefined();
        expect(data.idRoom).toBeDefined();
        expect(room).toBeUndefined();
        expect(user1InRoom).toBe(false);
        expect(user2InRoom).toBe(false);
        expect(user1HasRoom).toBe(false);
        expect(user2HasRoom).toBe(false);
        done();
      });
      clientSocket.emit("delete-room", { idUser: "idUser1", idRoom });
    });
  });
});
