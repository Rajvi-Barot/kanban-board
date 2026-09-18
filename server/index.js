const { webcrypto } = require('node:crypto');
globalThis.crypto ??= webcrypto;

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

// Make io available to route handlers via req.app.get('io')
app.set('io', io);

app.use(cors());
app.use(express.json());

const requireAuth = require('./middleware/auth');
const jwt = require('jsonwebtoken');

app.use('/api/auth', require('./routes/auth'));
app.use('/api/boards', requireAuth, require('./routes/boards'));
app.use('/api/columns', requireAuth, require('./routes/columns'));
app.use('/api/tasks', requireAuth, require('./routes/tasks'));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

const User = require('./models/user');

// Only accept socket connections carrying a valid JWT, same as the REST API.
// Also attach the username to the socket so presence/cursor events can
// carry a human-readable name without a DB round trip on every move.
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('No token provided'));
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.data.userId = payload.userId;

    if (payload.username) {
      socket.data.username = payload.username;
    } else {
      // Older tokens issued before username was embedded — look it up once.
      const user = await User.findById(payload.userId).select('username');
      socket.data.username = user ? user.username : 'Someone';
    }

    next();
  } catch (err) {
    next(new Error('Invalid or expired token'));
  }
});

// In-memory presence roster: who's currently connected and looking at the
// board. This resets on server restart, which is fine — presence is a
// live-only concept, not something that needs to survive a restart.
const presentUsers = new Map(); // socketId -> { userId, username }

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id, socket.data.username);

  presentUsers.set(socket.id, {
    userId: socket.data.userId,
    username: socket.data.username,
  });

  // Tell the newcomer who's already here, and tell everyone else the
  // newcomer arrived.
  socket.emit('presence:list', Array.from(presentUsers.entries()).map(
    ([socketId, info]) => ({ socketId, ...info })
  ));
  socket.broadcast.emit('presence:join', { socketId: socket.id, ...presentUsers.get(socket.id) });

  // Broadcast this user's cursor position to everyone else. Coordinates
  // are sent as fractions of the sender's viewport (0-1) so they translate
  // reasonably onto a viewer's own, possibly differently-sized, window.
  socket.on('cursor:move', ({ xPct, yPct }) => {
    if (typeof xPct !== 'number' || typeof yPct !== 'number') return;
    socket.broadcast.emit('cursor:move', {
      socketId: socket.id,
      username: socket.data.username,
      xPct,
      yPct,
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    presentUsers.delete(socket.id);
    socket.broadcast.emit('presence:leave', { socketId: socket.id });
  });
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
