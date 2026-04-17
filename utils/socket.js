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
    
    console.log("------------------------------------------");
    console.log("SOCKET.IO SERVER INITIALIZED");
    console.log("------------------------------------------");
    
    io.on("connection", (socket) => {
      console.log(`>>> NEW CONNECTION: ${socket.id}`);
      console.log(`>>> Total clients: ${io.engine.clientsCount}`);
      
      socket.on("error", (err) => {
        console.error(`!!! Socket Error [${socket.id}]:`, err);
      });
      
      socket.on("join", (userId) => {
        if (userId) {
          socket.join(userId.toString());
          console.log(`>>> USER JOINED ROOM: ${userId} (Socket: ${socket.id})`);
        }
      });

      socket.on("disconnect", (reason) => {
        console.log(`<<< DISCONNECTED: ${socket.id} (Reason: ${reason})`);
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
