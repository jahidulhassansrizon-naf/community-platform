const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const { catchAsync } = require("../middlewares/errorMiddleware");

// @desc    Get all conversations for logged-in user
// @route   GET /api/messages/conversations
// @access  Private
const getConversations = catchAsync(async (req, res) => {
  const conversations = await Conversation.find({
    participants: req.user._id,
  })
    .populate("participants", "name username profileImage")
    .sort({ updatedAt: -1 });

  res.status(200).json(conversations);
});

// @desc    Get messages of a conversation
// @route   GET /api/messages/:conversationId
// @access  Private
const getMessages = catchAsync(async (req, res) => {
  const messages = await Message.find({
    conversation: req.params.conversationId,
  }).sort({ createdAt: 1 });

  res.status(200).json(messages);
});

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
const sendMessage = catchAsync(async (req, res) => {
  const { recipientId, content, conversationId } = req.body;

  let convoId = conversationId;

  if (!convoId) {
    if (!recipientId) {
      res.status(400);
      throw new Error("Recipient ID or Conversation ID is required");
    }

    // Check if conversation already exists between two users
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, recipientId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, recipientId],
        lastMessage: content,
      });
    }
    convoId = conversation._id;
  }

  const message = await Message.create({
    conversation: convoId,
    sender: req.user._id,
    content,
  });

  await Conversation.findByIdAndUpdate(convoId, {
    lastMessage: content,
    updatedAt: Date.now(),
  });

  res.status(201).json(message);
});

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
};
