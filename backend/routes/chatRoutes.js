/**
 * Chat Routes
 */
const express = require('express');
const router = express.Router();
const {
  getOrCreateConversation, getConversations, getMessages, sendMessage, getUnreadCount,
} = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.post('/conversation', protect, getOrCreateConversation);
router.get('/conversations', protect, getConversations);
router.get('/messages/:conversationId', protect, getMessages);
router.post('/messages', protect, sendMessage);
router.get('/unread-count', protect, getUnreadCount);

module.exports = router;
