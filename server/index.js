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
      // Create new room
      rooms[room] = { p1: socket.id, p2: null, moves: {} };
      socket.join(room);
      socket.emit("player_assignment", "p1");
      console.log(`Room ${room} created by ${socket.id} (P1)`);
    } else if (!rooms[room].p2) {
      // Join existing room
      rooms[room].p2 = socket.id;
      socket.join(room);
      socket.emit("player_assignment", "p2");
      io.to(room).emit("game_start", true);
      console.log(`User ${socket.id} joined room ${room} (P2)`);
    } else {
      socket.emit("room_full");
    }
  });

  // --- FIXED MOVE LOGIC (Prevents Freezing) ---
  socket.on("send_move", ({ room, move }) => {
    // 1. Check if room still exists (Prevents crash if room was deleted)
    if (!rooms[room]) return;

    // 2. Identify who is sending the move securely
    let playerKey = null;
    if (rooms[room].p1 === socket.id) playerKey = "p1";
    else if (rooms[room].p2 === socket.id) playerKey = "p2";

    // If socket isn't part of the room, ignore them
    if (!playerKey) return;

    // 3. Register the move
    rooms[room].moves[playerKey] = move;

    // 4. Check if BOTH have moved
    if (rooms[room].moves.p1 && rooms[room].moves.p2) {
      // Send results
      io.to(room).emit("round_complete", {
        p1Move: rooms[room].moves.p1,
        p2Move: rooms[room].moves.p2
      });
      // Reset moves for next round
      rooms[room].moves = {};
    } else {
      // Only one moved: Tell that person to wait
      socket.emit("waiting_for_opponent");
    }
  });

  socket.on("send_chat", ({ room, message, playerName }) => {
    if (!rooms[room]) return;
    io.to(room).emit("receive_chat", { message, playerName, timestamp: Date.now() });
  });

  socket.on("send_emoji", ({ room, emoji, playerRole }) => {
    if (!rooms[room]) return;
    io.to(room).emit("receive_emoji", { emoji, playerRole, timestamp: Date.now() });
  });

  socket.on("disconnect", () => {
    const room = findRoomBySocketId(socket.id);
    if (room) {
      // Deleting the room immediately on disconnect is aggressive, 
      // but compatible with your current logic.
      delete rooms[room];
      io.to(room).emit("player_disconnected");
      console.log(`Room ${room} closed.`);
    }
  });
});

// IMPORTANT: Use Render's port or fallback to 3001
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`SERVER RUNNING ON PORT ${PORT}`);
});
