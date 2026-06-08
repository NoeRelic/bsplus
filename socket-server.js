const { Server } = require('socket.io');

const io = new Server(3001, {
  cors: {
    origin: "*", // Adjust in production
    methods: ["GET", "POST"]
  }
});

console.log("🟢 Socket.io Sunucusu 3001 portunda başlatıldı.");

// Room states to track current video time and status
const rooms = new Map();

io.on('connection', (socket) => {
  console.log(`Kullanıcı bağlandı: ${socket.id}`);

  socket.on('join_room', ({ roomId, username, isHost }) => {
    socket.join(roomId);
    socket.username = username;
    socket.roomId = roomId;
    socket.isHost = isHost || false;

    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        host: socket.id,
        users: new Set([username]),
        videoState: { time: 0, playing: false }
      });
    } else {
      rooms.get(roomId).users.add(username);
      // Send current state to new user
      socket.emit('sync_video', rooms.get(roomId).videoState);
    }

    // Announce to room
    io.to(roomId).emit('chat_message', {
      system: true,
      text: `${username} odaya katıldı.`,
      time: new Date().toISOString()
    });
    
    // Update user list
    io.to(roomId).emit('room_users', Array.from(rooms.get(roomId).users));
  });

  socket.on('send_message', (data) => {
    io.to(socket.roomId).emit('chat_message', {
      username: socket.username,
      text: data.text,
      time: new Date().toISOString(),
      isHost: socket.isHost
    });
  });

  socket.on('video_update', (data) => {
    // Only host should dictate video state, but we can allow anyone if we want
    if (rooms.has(socket.roomId)) {
      const room = rooms.get(socket.roomId);
      room.videoState = data; // { time: 12.5, playing: true }
      // Broadcast to others in the room
      socket.to(socket.roomId).emit('sync_video', data);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Kullanıcı ayrıldı: ${socket.id}`);
    if (socket.roomId && rooms.has(socket.roomId)) {
      const room = rooms.get(socket.roomId);
      room.users.delete(socket.username);
      
      io.to(socket.roomId).emit('chat_message', {
        system: true,
        text: `${socket.username} odadan ayrıldı.`,
        time: new Date().toISOString()
      });
      
      io.to(socket.roomId).emit('room_users', Array.from(room.users));
      
      if (room.users.size === 0) {
        rooms.delete(socket.roomId);
      } else if (room.host === socket.id) {
        // Assign new host if possible, or just leave it open
        io.to(socket.roomId).emit('chat_message', {
          system: true,
          text: `Oda kurucusu ayrıldı. Senkronizasyon herkese açıldı.`,
          time: new Date().toISOString()
        });
      }
    }
  });
});
