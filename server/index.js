import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

let rooms = {};

function findRoomBySocketId(id) {
  for (let room in rooms) {
    if (rooms[room].p1 === id || rooms[room].p2 === id) {
      return room;
    }
  }
  return null;
}

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("join_room", (room) => {
    if (!rooms[room]) {
      rooms[room] = { p1: socket.id, p2: null, moves: {} };
      socket.join(room);
      socket.emit("player_assignment", "p1");
      console.log(`Room ${room} created by ${socket.id} (P1)`);
    }
    else if (!rooms[room].p2) {
      rooms[room].p2 = socket.id;
      socket.join(room);
      socket.emit("player_assignment", "p2");
      io.to(room).emit("game_start", true);
      console.log(`User ${socket.id} joined room ${room} (P2)`);
    }
    else {
      socket.emit("room_full");
    }
  });

  socket.on("send_move", ({ room, move, player }) => {
    if (!rooms[room]) return;

    rooms[room].moves[player] = move;

    if (rooms[room].moves.p1 && rooms[room].moves.p2) {
      io.to(room).emit("round_complete", {
        p1Move: rooms[room].moves.p1,
        p2Move: rooms[room].moves.p2
      });

      rooms[room].moves = {};
    } else {
      io.to(room).emit("waiting_for_opponent");
    }
  });

  socket.on("disconnect", () => {
    const room = findRoomBySocketId(socket.id);
    if (room) {
      delete rooms[room];
      io.to(room).emit("player_disconnected");
      console.log(`Room ${room} closed because player left.`);
    }
    console.log("User Disconnected", socket.id);
  });
});

server.listen(3001, () => {
  console.log("SERVER RUNNING ON PORT 3001");
});