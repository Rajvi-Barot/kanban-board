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

// Only accept socket connections carrying a valid JWT, same as the REST API.
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('No token provided'));
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    next(new Error('Invalid or expired token'));
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
