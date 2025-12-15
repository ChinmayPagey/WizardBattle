import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();

app.use(cors());

const server = http.createServer(app);

// SETUP: Allow connections from ANYWHERE (Vercel, localhost, friend's house)
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"],
  },
});

// DATA: Stores active rooms
// Format: { roomID: { p1: socketId, p2: socketId, moves: {} } }
let rooms = {};

// HELPER: Find which room a socket ID belongs to
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

  // 1. JOIN ROOM LOGIC
  socket.on("join_room", (room) => {
    // Case A: New Room
    if (!rooms[room]) {
      rooms[room] = { p1: socket.id, p2: null, moves: {} };
      socket.join(room);
      socket.emit("player_assignment", "p1");
      console.log(`Room ${room} created by ${socket.id} (P1)`);
    } 
    // Case B: Room exists, needs P2
    else if (!rooms[room].p2) {
      rooms[room].p2 = socket.id;
      socket.join(room);
      socket.emit("player_assignment", "p2");
      io.to(room).emit("game_start", true); // Tell both to start
      console.log(`User ${socket.id} joined room ${room} (P2)`);
    } 
    // Case C: Room Full
    else {
      socket.emit("room_full");
    }
  });

  // 2. MOVE LOGIC
  socket.on("send_move", ({ room, move, player }) => {
    if (!rooms[room]) return;

    // Store the move
    rooms[room].moves[player] = move;

    // Check if both have moved
    if (rooms[room].moves.p1 && rooms[room].moves.p2) {
      // Send BOTH moves back to resolve the turn
      io.to(room).emit("round_complete", {
        p1Move: rooms[room].moves.p1,
        p2Move: rooms[room].moves.p2
      });

      // Clear moves for next round
      rooms[room].moves = {};
    } else {
        // Tell the room someone is waiting
        io.to(room).emit("waiting_for_opponent");
    }
  });

  // 3. DISCONNECT LOGIC
  socket.on("disconnect", () => {
    const room = findRoomBySocketId(socket.id);
    if (room) {
        // If a player leaves, kill the room so it doesn't get stuck
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