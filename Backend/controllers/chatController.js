const Chat = require('../models/Chat');
const Employee = require('../models/Employee');

// Create or get a chat between two users
const getOrCreateChat = async (req, res) => {
  try {
    const { participantId, isAdminChat = false } = req.body;
    const currentUserId = req.user.id;
    const organizationId = req.organizationId;
    const isAdmin = req.role === 'ADMIN' || req.role === 'HR';

    if (!participantId) {
      return res.status(400).json({ message: 'Participant ID is required' });
    }

    // If making an admin chat, ensure the requester is an admin or is the participant (for employees wanting to talk to admin)
    if (isAdminChat && !isAdmin && participantId !== currentUserId) {
      return res.status(403).json({ message: 'Cannot create admin chat for another user' });
    }

    // Check if participant exists and belongs to same organization
    const participant = await Employee.findOne({ 
      _id: participantId, 
      organizationId: organizationId 
    });

    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    // Check if chat already exists
    let query = {
      organization: organizationId,
      isGroupChat: false
    };

    if (isAdminChat) {
      query.isAdminChat = true;
      query.participants = { $size: 1, $in: [participantId] }; // Admin chat has only the employee as participant
    } else {
      query.isAdminChat = false;
      query.participants = { $all: [currentUserId, participantId], $size: 2 };
    }

    let chat = await Chat.findOne(query)
      .populate('participants', 'name email profilePic')
      .populate('messages.sender', 'name profilePic');

    if (!chat) {
      // Create new chat
      chat = new Chat({
        organization: organizationId,
        participants: isAdminChat ? [participantId] : [currentUserId, participantId],
        isGroupChat: false,
        isAdminChat: isAdminChat
      });
      await chat.save();
      
      // Populate the newly created chat
      chat = await Chat.findById(chat._id)
        .populate('participants', 'name email profilePic')
        .populate('messages.sender', 'name profilePic');
    }

    res.status(200).json(chat);
  } catch (error) {
    console.error('Error in getOrCreateChat:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create a group chat
const createGroupChat = async (req, res) => {
  try {
    const { name, participants } = req.body;
    const currentUserId = req.user.id;
    const organizationId = req.organizationId;

    if (!name || !participants || participants.length < 2) {
      return res.status(400).json({ 
        message: 'Group name and at least 2 participants are required' 
      });
    }

    // Verify all participants belong to the same organization
    const validParticipants = await Employee.find({
      _id: { $in: participants },
      organizationId: organizationId
    });

    if (validParticipants.length !== participants.length) {
      return res.status(400).json({ 
        message: 'Some participants are not valid or not in your organization' 
      });
    }

    const groupChat = new Chat({
      organization: organizationId,
      participants: [currentUserId, ...participants],
      isGroupChat: true,
      groupName: name,
      groupAdmin: currentUserId
    });

    await groupChat.save();

    const populatedChat = await Chat.findById(groupChat._id)
      .populate('participants', 'name email profilePic')
      .populate('groupAdmin', 'name profilePic');

    res.status(201).json(populatedChat);
  } catch (error) {
    console.error('Error in createGroupChat:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all chats for a user
const getUserChats = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const organizationId = req.organizationId;
    const isAdmin = req.role === 'ADMIN' || req.role === 'HR';

    const query = { organization: organizationId };
    if (isAdmin) {
      query.$or = [
        { isAdminChat: true },
        { participants: currentUserId }
      ];
    } else {
      query.participants = currentUserId;
    }

    const chats = await Chat.find(query)
    .populate('participants', 'name email profilePic')
    .populate('groupAdmin', 'name profilePic')
    .populate('lastMessage.sender', 'name')
    .sort({ updatedAt: -1 });

    res.status(200).json(chats);
  } catch (error) {
    console.error('Error in getUserChats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Send a message
const sendMessage = async (req, res) => {
  try {
    const { chatId, content, messageType = 'text' } = req.body;
    const senderId = req.user.id;
    const isAdmin = req.role === 'ADMIN' || req.role === 'HR';

    if (!chatId || !content) {
      return res.status(400).json({ message: 'Chat ID and content are required' });
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is a participant or admin
    if (!isAdmin && !chat.participants.includes(senderId)) {
      return res.status(403).json({ message: 'You are not a participant in this chat' });
    }

    const newMessage = {
      sender: senderId,
      senderModel: isAdmin ? 'Organization1' : 'Employee',
      content,
      messageType,
      timestamp: new Date()
    };

    chat.messages.push(newMessage);
    chat.lastMessage = chat.messages[chat.messages.length - 1];
    chat.updatedAt = new Date();

    await chat.save();

    const populatedChat = await Chat.findById(chatId)
      .populate('participants', 'name email profilePic')
      .populate('messages.sender', 'name profilePic');

    // Get the newly added message
    const messageIndex = populatedChat.messages.length - 1;
    const newPopulatedMessage = populatedChat.messages[messageIndex];

    res.status(201).json({
      message: newPopulatedMessage,
      chat: populatedChat
    });
  } catch (error) {
    console.error('Error in sendMessage:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Mark messages as read
const markMessagesAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is a participant
    if (!chat.participants.includes(userId)) {
      return res.status(403).json({ message: 'You are not a participant in this chat' });
    }

    // Mark unread messages as read
    chat.messages.forEach(message => {
      const isReadByUser = message.readBy.some(read => 
        read.user.toString() === userId
      );
      
      if (!isReadByUser && message.sender.toString() !== userId) {
        message.readBy.push({
          user: userId,
          readAt: new Date()
        });
      }
    });

    await chat.save();

    res.status(200).json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error in markMessagesAsRead:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get chat details
const getChatDetails = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.role === 'ADMIN' || req.role === 'HR';

    const chat = await Chat.findById(chatId)
      .populate('participants', 'name email profilePic')
      .populate('groupAdmin', 'name profilePic')
      .populate('messages.sender', 'name profilePic')
      .populate('messages.readBy.user', 'name');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is a participant or admin
    if (!isAdmin && !chat.participants.some(p => p._id.toString() === userId)) {
      return res.status(403).json({ message: 'You are not a participant in this chat' });
    }

    res.status(200).json(chat);
  } catch (error) {
    console.error('Error in getChatDetails:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add participant to group chat
const addParticipant = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { participantId } = req.body;
    const currentUserId = req.user.id;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.isGroupChat) {
      return res.status(400).json({ message: 'Cannot add participants to direct chat' });
    }

    // Check if user is group admin
    if (chat.groupAdmin.toString() !== currentUserId) {
      return res.status(403).json({ message: 'Only group admin can add participants' });
    }

    // Check if participant is already in the chat
    if (chat.participants.includes(participantId)) {
      return res.status(400).json({ message: 'Participant already in the chat' });
    }

    chat.participants.push(participantId);
    await chat.save();

    const updatedChat = await Chat.findById(chatId)
      .populate('participants', 'name email profilePic')
      .populate('groupAdmin', 'name profilePic');

    res.status(200).json(updatedChat);
  } catch (error) {
    console.error('Error in addParticipant:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getOrCreateChat,
  createGroupChat,
  getUserChats,
  sendMessage,
  markMessagesAsRead,
  getChatDetails,
  addParticipant
};
