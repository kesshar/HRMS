const express = require('express');
const router = express.Router();
const {
  getOrCreateChat,
  createGroupChat,
  getUserChats,
  sendMessage,
  markMessagesAsRead,
  getChatDetails,
  addParticipant
} = require('../controllers/chatController');
const { protectEmployee } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protectEmployee);

// Get or create a one-on-one chat
router.post('/one-on-one', (req, res) => getOrCreateChat(req, res));

// Create a group chat
router.post('/group', (req, res) => createGroupChat(req, res));

// Get all chats for the current user
router.get('/', (req, res) => getUserChats(req, res));

// Send a message
router.post('/message', (req, res) => sendMessage(req, res));

// Mark messages as read
router.patch('/:chatId/read', (req, res) => markMessagesAsRead(req, res));

// Get chat details
router.get('/:chatId', (req, res) => getChatDetails(req, res));

// Add participant to group chat
router.patch('/:chatId/add-participant', (req, res) => addParticipant(req, res));

module.exports = router;
