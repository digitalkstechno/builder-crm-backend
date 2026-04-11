const socketIo = require("socket.io");

let io;

module.exports = {
  init: (server) => {
    io = socketIo(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });
    
    console.log("Socket.io initialized with path: /api/socket.io");
    
    io.on("connection", (socket) => {
      console.log(`[Socket] Client connected: ${socket.id} (Total: ${io.engine.clientsCount})`);
      
      socket.on("error", (err) => {
        console.error(`[Socket] Error for ${socket.id}:`, err);
      });
      
      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });
    
    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error("Socket.io not initialized!");
    }
    return io;
  },
};
