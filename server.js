
import { createServer } from "node:http";
import { Server } from "socket.io";

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST"],
  },
});

const officePlayers = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // -------------------------------
  // WEBRTC VOICE SIGNALING
  // -------------------------------
  socket.on("join-room", (roomId) => {
    if (typeof roomId !== "string" || !roomId.trim()) return;

    const room = roomId.trim();

    for (const oldRoom of socket.rooms) {
      if (oldRoom !== socket.id) {
        socket.leave(oldRoom);
      }
    }

    const existingRoom = io.sockets.adapter.rooms.get(room);
    const peerCount = existingRoom ? existingRoom.size : 0;

    if (peerCount >= 2) {
      socket.emit("room-full");
      return;
    }

    socket.join(room);
    socket.data.roomId = room;

    socket.emit("room-joined", {
      roomId: room,
      isInitiator: peerCount === 0,
    });

    socket.to(room).emit("peer-joined", {
      peerId: socket.id,
    });

    console.log(`${socket.id} joined voice room ${room}`);
  });

  socket.on("webrtc-offer", (data) => {
    if (socket.data.roomId && data?.roomId === socket.data.roomId) {
      socket.to(socket.data.roomId).emit("webrtc-offer", {
        offer: data.offer,
        from: socket.id,
      });
    }
  });

  socket.on("webrtc-answer", (data) => {
    if (socket.data.roomId && data?.roomId === socket.data.roomId) {
      socket.to(socket.data.roomId).emit("webrtc-answer", {
        answer: data.answer,
        from: socket.id,
      });
    }
  });

  socket.on("webrtc-ice-candidate", (data) => {
    if (socket.data.roomId && data?.roomId === socket.data.roomId) {
      socket.to(socket.data.roomId).emit("webrtc-ice-candidate", {
        candidate: data.candidate,
        from: socket.id,
      });
    }
  });

  // -------------------------------
  // OFFICE MULTIPLAYER
  // -------------------------------
  socket.on("join-office-room", (roomId) => {
    if (typeof roomId !== "string" || !roomId.trim()) return;

    const room = `office:${roomId.trim()}`;

    // Leave previous office room, if any.
    const oldOfficeRoom = socket.data.officeRoomId;

    if (oldOfficeRoom) {
      socket.leave(oldOfficeRoom);
      officePlayers.get(oldOfficeRoom)?.delete(socket.id);

      socket.to(oldOfficeRoom).emit("player:left", {
        socketId: socket.id,
      });
    }

    socket.join(room);
    socket.data.officeRoomId = room;

    if (!officePlayers.has(room)) {
      officePlayers.set(room, new Map());
    }

    const players = officePlayers.get(room);

    // Send existing players to the joining player.
    for (const [socketId, location] of players.entries()) {
      socket.emit("player:moved", {
        socketId,
        location,
      });
    }

    // Register this player.
    players.set(socket.id, { x: 300, y: 300 });

    socket.to(room).emit("player:joined", {
      socketId: socket.id,
      location: { x: 300, y: 300 },
    });

    console.log(`${socket.id} joined office room ${room}`);
  });

  socket.on("player:move", (data) => {
    const room = socket.data.officeRoomId;
    if (!room || !data?.location) return;

    const { x, y } = data.location;

    if (!Number.isFinite(x) || !Number.isFinite(y)) return;

    const location = { x, y };
    officePlayers.get(room)?.set(socket.id, location);

    socket.to(room).emit("player:moved", {
      socketId: socket.id,
      location,
    });
  });

  // -------------------------------
  // DISCONNECT CLEANUP
  // -------------------------------
  socket.on("disconnect", () => {
    const room = socket.data.officeRoomId;

    if (room) {
      officePlayers.get(room)?.delete(socket.id);

      socket.to(room).emit("player:left", {
        socketId: socket.id,
      });

      if (officePlayers.get(room)?.size === 0) {
        officePlayers.delete(room);
      }
    }

    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`ProxiSpeak signaling server running on port ${PORT}`);
});
