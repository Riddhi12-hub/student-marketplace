/**
 * Chat Controller
 * Manages conversations and messages between buyers and sellers
 */
const { Conversation, Message } = require('../models/Message');
const Product = require('../models/Product');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// @desc    Get or create conversation between user and seller for a product
// @route   POST /api/chat/conversation
// @access  Private
exports.getOrCreateConversation = asyncHandler(async (req, res) => {
  const { productId, sellerId } = req.body;
  const buyerId = req.user._id;

  // Can't chat with yourself
  if (buyerId.toString() === sellerId.toString()) {
    throw new AppError("You can't start a chat with yourself", 400);
  }

  // Check product exists
  const product = await Product.findById(productId);
  if (!product) throw new AppError('Product not found', 404);

  // Find existing conversation
  let conversation = await Conversation.findOne({
    participants: { $all: [buyerId, sellerId] },
    product: productId,
  }).populate('participants', 'name avatar lastSeen')
    .populate('product', 'title images price isSold');

  // Create new conversation if doesn't exist
  if (!conversation) {
    conversation = await Conversation.create({
      participants: [buyerId, sellerId],
      product: productId,
      unreadCount: { [sellerId]: 0, [buyerId]: 0 },
    });
    conversation = await Conversation.findById(conversation._id)
      .populate('participants', 'name avatar lastSeen')
      .populate('product', 'title images price isSold');
  }

  res.json({ success: true, conversation });
});

// @desc    Get all conversations for current user
// @route   GET /api/chat/conversations
// @access  Private
exports.getConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({
    participants: req.user._id,
  })
    .populate('participants', 'name avatar lastSeen')
    .populate('product', 'title images price isSold category')
    .sort({ lastMessageAt: -1 })
    .lean();

  // Add unread count for current user
  const enriched = conversations.map((conv) => ({
    ...conv,
    myUnread: conv.unreadCount?.[req.user._id.toString()] || 0,
  }));

  res.json({ success: true, conversations: enriched });
});

// @desc    Get messages for a conversation
// @route   GET /api/chat/messages/:conversationId
// @access  Private
exports.getMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  // Verify user is participant
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new AppError('Conversation not found', 404);

  if (!conversation.participants.includes(req.user._id)) {
    throw new AppError('Not authorized to view this conversation', 403);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const messages = await Message.find({ conversation: conversationId })
    .populate('sender', 'name avatar')
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(parseInt(limit));

  // Mark messages as read
  await Message.updateMany(
    {
      conversation: conversationId,
      sender: { $ne: req.user._id },
      isRead: false,
    },
    { isRead: true, readAt: new Date() }
  );

  // Reset unread count for current user
  await Conversation.findByIdAndUpdate(conversationId, {
    $set: { [`unreadCount.${req.user._id}`]: 0 },
  });

  res.json({ success: true, messages });
});

// @desc    Send a message (REST fallback - Socket.io is primary)
// @route   POST /api/chat/messages
// @access  Private
exports.sendMessage = asyncHandler(async (req, res) => {
  const { conversationId, content } = req.body;

  if (!content || !content.trim()) {
    throw new AppError('Message content is required', 400);
  }

  // Verify conversation and participant
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new AppError('Conversation not found', 404);

  if (!conversation.participants.includes(req.user._id)) {
    throw new AppError('Not authorized', 403);
  }

  const message = await Message.create({
    conversation: conversationId,
    sender: req.user._id,
    content: content.trim(),
  });

  // Update conversation's last message
  const otherParticipant = conversation.participants.find(
    (p) => p.toString() !== req.user._id.toString()
  );

  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: content.trim().substring(0, 100),
    lastMessageAt: new Date(),
    $inc: { [`unreadCount.${otherParticipant}`]: 1 },
  });

  const populatedMessage = await message.populate('sender', 'name avatar');

  // Emit via socket.io if available
  const io = req.app.get('io');
  if (io) {
    io.to(`conversation:${conversationId}`).emit('newMessage', populatedMessage);
  }

  res.status(201).json({ success: true, message: populatedMessage });
});

// @desc    Get total unread message count for user
// @route   GET /api/chat/unread-count
// @access  Private
exports.getUnreadCount = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({ participants: req.user._id });
  
  let total = 0;
  conversations.forEach((conv) => {
    total += conv.unreadCount?.get?.(req.user._id.toString()) || 0;
  });

  res.json({ success: true, unreadCount: total });
});
