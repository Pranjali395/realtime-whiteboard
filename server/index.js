const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const usersInRoom = {};

const app = express();

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

   socket.on("clearBoard", (data) => {
  socket.to(data.roomId).emit("clearBoard");
});
socket.on("joinRoom", (roomId) => {
  console.log("JOIN ROOM:", socket.id, roomId);

  socket.join(roomId);
  socket.roomId = roomId;

  if (!usersInRoom[roomId]) {
    usersInRoom[roomId] = 0;
  }

  usersInRoom[roomId]++;

  console.log("COUNT:", usersInRoom[roomId]);

  io.to(roomId).emit("userCount", usersInRoom[roomId]);
});

  socket.on("startDrawing", (data) => {
    socket.to(data.roomId).emit("startDrawing", data);
  });

  socket.on("draw", (data) => {
    
    socket.to(data.roomId).emit("draw", data);
  });

  socket.on("stopDrawing", (data) => {
    socket.to(data.roomId).emit("stopDrawing");
  });

 socket.on("disconnect", () => {
  console.log("User Disconnected:", socket.id);

  const roomId = socket.roomId;

  if (roomId && usersInRoom[roomId]) {
    usersInRoom[roomId]--;

    io.to(roomId).emit("userCount", usersInRoom[roomId]);

    if (usersInRoom[roomId] <= 0) {
      delete usersInRoom[roomId];
    }
  }
});
});

server.listen(3001, () => {
  console.log("Server running on port 3001");
});