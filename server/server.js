const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Store users and their rooms
const users = {};
const rooms = ['general', 'nairobi', 'mombasa', 'kisumu', 'coastal'];

io.on('connection', (socket) => {
  console.log('🔗 New user connected:', socket.id);

  // Handle user registration
  socket.on('register', (username) => {
    users[socket.id] = { username, room: 'general' };
    socket.join('general');
    
    // Notify everyone in the room
    io.to('general').emit('user joined', getUsersInRoom('general'));
    socket.emit('room users', { 
      users: getUsersInRoom('general'),
      room: 'general'
    });
    
    // Send welcome message
    io.to('general').emit('chat message', {
      text: `🎉 ${username} joined the chat! Welcome!`,
      sender: 'System',
      timestamp: new Date().toISOString(),
      room: 'general'
    });
    
    console.log(`👋 ${username} entered the system`);
  });

  // Handle room joining
  socket.on('join room', ({ username, room }) => {
    if (users[socket.id]) {
      const previousRoom = users[socket.id].room;
      
      // Leave previous room
      socket.leave(previousRoom);
      
      // Join new room
      socket.join(room);
      users[socket.id].room = room;
      
      // Notify both rooms
      io.to(previousRoom).emit('user joined', getUsersInRoom(previousRoom));
      io.to(room).emit('user joined', getUsersInRoom(room));
      
      // Send room switch notification
      io.to(room).emit('chat message', {
        text: `🚶 ${username} entered this room`,
        sender: 'System',
        timestamp: new Date().toISOString(),
        room: room
      });
      
      console.log(`🚶 ${username} moved from ${previousRoom} to ${room}`);
    }
  });

  // Handle chat messages
  socket.on('chat message', (data) => {
    io.to(data.room).emit('chat message', data);
    console.log(`💬 Message from ${data.sender} in ${data.room}: ${data.text}`);
  });

  // Handle private messages
  socket.on('private message', (data) => {
    const targetSocket = Object.keys(users).find(
      key => users[key].username === data.to
    );
    
    if (targetSocket) {
      io.to(targetSocket).emit('private message', data);
      socket.emit('private message', data);
    }
    
    console.log(`🔒 Private message: ${data.from} → ${data.to}: ${data.text}`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const user = users[socket.id];
    if (user) {
      const room = user.room;
      delete users[socket.id];
      
      io.to(room).emit('user joined', getUsersInRoom(room));
      io.to(room).emit('chat message', {
        text: `👋 ${user.username} left the chat`,
        sender: 'System',
        timestamp: new Date().toISOString(),
        room: room
      });
      
      console.log(`👋 ${user.username} disconnected`);
    }
  });

  // Helper function to get users in a room
  function getUsersInRoom(room) {
    return Object.values(users)
      .filter(user => user.room === room)
      .map(user => user.username);
  }
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🇰🇪 Kenya Chat Connect Server running on PORT ${PORT}`);
  console.log(`🏠 URL: http://localhost:${PORT}`);
  console.log(`🎉 Ready for connections!`);
});
