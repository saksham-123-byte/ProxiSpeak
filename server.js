
import { createServer } from "node:http";
import { Server } from "socket.io";

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (roomId) => {
    if (typeof roomId !== "string" || !roomId.trim()) return;

    const room = roomId.trim();

    // Leave any previous room.
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

    console.log(`${socket.id} joined room ${room}`);
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

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`ProxiSpeak signaling server running on port ${PORT}`);
});
