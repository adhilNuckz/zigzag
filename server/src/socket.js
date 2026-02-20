const { Server } = require('socket.io');
const crypto = require('crypto');
const sanitizeHtml = require('sanitize-html');
const Message = require('./models/Message');
const User = require('./models/User');
const logger = require('./utils/logger');

let io;

// Per-socket rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 30;

function isRateLimited(socketId) {
  const now = Date.now();
  const record = rateLimitMap.get(socketId) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW };

  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + RATE_LIMIT_WINDOW;
  }

  record.count++;
  rateLimitMap.set(socketId, record);

  return record.count > RATE_LIMIT_MAX;
}

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
    pingTimeout: 20000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e6, // 1MB max
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));

      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const user = await User.findOne({ tokenHash, active: true });
      if (!user) return next(new Error('Invalid session'));

      socket.user = {
        anonId: user.anonId,
        alias: user.alias,
      };
      next();
    } catch (err) {
      next(new Error('Auth failed'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.user.alias}`);

    // Auto-join global room
    socket.join('global');

    // Notify room
    socket.to('global').emit('user:joined', {
      alias: socket.user.alias,
      timestamp: Date.now(),
    });

    // Send online count
    const onlineCount = io.sockets.adapter.rooms.get('global')?.size || 0;
    io.to('global').emit('room:count', onlineCount);

    // === Chat Message ===
    socket.on('chat:message', async (data) => {
      try {
        if (isRateLimited(socket.id)) {
          return socket.emit('error:ratelimit', 'Slow down.');
        }

        const content = sanitizeHtml(data.content || '', {
          allowedTags: [],
          allowedAttributes: {},
        }).trim();

        if (!content || content.length > 2000) return;

        const msgData = {
          content,
          type: data.type === 'image' ? 'image' : 'text',
          imageUrl: data.type === 'image' ? data.imageUrl : null,
          sender: {
            anonId: socket.user.anonId,
            alias: socket.user.alias,
          },
          room: 'global',
        };

        const message = await Message.create(msgData);

        io.to('global').emit('chat:message', {
          _id: message._id,
          content: message.content,
          type: message.type,
          imageUrl: message.imageUrl,
          sender: message.sender,
          createdAt: message.createdAt,
        });
      } catch (err) {
        logger.error('Chat message error:', err);
      }
    });

    // === Typing Indicator ===
    socket.on('chat:typing', () => {
      socket.to('global').emit('chat:typing', {
        alias: socket.user.alias,
      });
    });

    socket.on('chat:stop-typing', () => {
      socket.to('global').emit('chat:stop-typing', {
        alias: socket.user.alias,
      });
    });

    // === Temporary Rooms ===
    socket.on('room:join', (roomName) => {
      if (!roomName || roomName.length > 50) return;
      const safeName = roomName.replace(/[^a-zA-Z0-9_-]/g, '');
      socket.join(safeName);
      socket.emit('room:joined', safeName);
    });

    socket.on('room:leave', (roomName) => {
      socket.leave(roomName);
    });

    // === Disconnect ===
    socket.on('disconnect', () => {
      rateLimitMap.delete(socket.id);

      socket.to('global').emit('user:left', {
        alias: socket.user.alias,
        timestamp: Date.now(),
      });

      const onlineCount = io.sockets.adapter.rooms.get('global')?.size || 0;
      io.to('global').emit('room:count', onlineCount);

      logger.info(`Socket disconnected: ${socket.user.alias}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

module.exports = { initSocket, getIO };
