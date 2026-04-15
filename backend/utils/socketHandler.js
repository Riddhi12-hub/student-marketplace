/**
 * Socket.io Handler
 * Manages real-time chat events
 */
const { Conversation, Message } = require('../models/Message');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Map of userId -> socketId for online presence
const onlineUsers = new Map();

const socketHandler = (io) => {
  // Authenticate socket connections via JWT
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error('Authentication error'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('name avatar');
      if (!user) return next(new Error('User not found'));

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`⚡ Socket connected: ${socket.user.name} (${socket.id})`);

    // Track online users
    onlineUsers.set(socket.userId, socket.id);
    io.emit('userOnline', { userId: socket.userId });

    // ─── Join a conversation room ─────────────────────────────────────
    socket.on('joinConversation', async (conversationId) => {
      try {
        // Verify user is participant
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return;

        if (!conversation.participants.map(String).includes(socket.userId)) return;

        socket.join(`conversation:${conversationId}`);
        console.log(`${socket.user.name} joined conversation ${conversationId}`);
      } catch (err) {
        console.error('joinConversation error:', err);
      }
    });

    // ─── Leave a conversation room ────────────────────────────────────
    socket.on('leaveConversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // ─── Send message ─────────────────────────────────────────────────
    socket.on('sendMessage', async ({ conversationId, content }) => {
      try {
        if (!content || !content.trim()) return;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return;
        if (!conversation.participants.map(String).includes(socket.userId)) return;

        // Save message to DB
        const message = await Message.create({
          conversation: conversationId,
          sender: socket.userId,
          content: content.trim(),
        });

        const populatedMessage = await message.populate('sender', 'name avatar');

        // Update conversation last message + unread counts
        const otherParticipant = conversation.participants.find(
          (p) => p.toString() !== socket.userId
        );

        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: content.trim().substring(0, 100),
          lastMessageAt: new Date(),
          $inc: { [`unreadCount.${otherParticipant}`]: 1 },
        });

        // Emit to conversation room
        io.to(`conversation:${conversationId}`).emit('newMessage', populatedMessage);

        // Send real-time notification to other user if they're online
        const otherSocketId = onlineUsers.get(otherParticipant.toString());
        if (otherSocketId) {
          io.to(otherSocketId).emit('messageNotification', {
            conversationId,
            sender: { _id: socket.userId, name: socket.user.name, avatar: socket.user.avatar },
            preview: content.trim().substring(0, 60),
          });
        }
      } catch (err) {
        console.error('sendMessage socket error:', err);
        socket.emit('messageError', { error: 'Failed to send message' });
      }
    });

    // ─── Typing indicator ─────────────────────────────────────────────
    socket.on('typing', ({ conversationId, isTyping }) => {
      socket.to(`conversation:${conversationId}`).emit('userTyping', {
        userId: socket.userId,
        name: socket.user.name,
        isTyping,
      });
    });

    // ─── Mark messages as read ────────────────────────────────────────
    socket.on('markRead', async (conversationId) => {
      try {
        await Message.updateMany(
          { conversation: conversationId, sender: { $ne: socket.userId }, isRead: false },
          { isRead: true, readAt: new Date() }
        );
        await Conversation.findByIdAndUpdate(conversationId, {
          $set: { [`unreadCount.${socket.userId}`]: 0 },
        });
        socket.to(`conversation:${conversationId}`).emit('messagesRead', {
          conversationId,
          readBy: socket.userId,
        });
      } catch (err) {
        console.error('markRead error:', err);
      }
    });

    // ─── Disconnect ───────────────────────────────────────────────────
    socket.on('disconnect', () => {
      onlineUsers.delete(socket.userId);
      io.emit('userOffline', { userId: socket.userId });
      console.log(`❌ Socket disconnected: ${socket.user.name}`);
    });
  });
};

module.exports = socketHandler;
