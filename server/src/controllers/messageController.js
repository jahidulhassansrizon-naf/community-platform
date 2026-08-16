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

// @desc    Get messages of a conversation & mark them as read
// @route   GET /api/messages/:conversationId
// @access  Private
const getMessages = catchAsync(async (req, res) => {
  const conversationId = req.params.conversationId;

  const messages = await Message.find({
    conversation: conversationId,
  }).sort({ createdAt: 1 });

  // Mark incoming messages as read for the logged-in user
  await Message.updateMany(
    {
      conversation: conversationId,
      sender: { $ne: req.user._id },
      readStatus: false,
    },
    { readStatus: true },
  );

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
    readStatus: false,
  });

  await Conversation.findByIdAndUpdate(convoId, {
    lastMessage: content,
    updatedAt: Date.now(),
  });

  res.status(201).json(message);
});

// @desc    Get total unread message count for logged-in user
// @route   GET /api/messages/unread/count
// @access  Private
const getUnreadCount = catchAsync(async (req, res) => {
  // Find all conversations where the user is a participant
  const userConversations = await Conversation.find({
    participants: req.user._id,
  }).select("_id");

  const conversationIds = userConversations.map((convo) => convo._id);

  // Count messages not sent by the logged-in user and where readStatus is false
  const unreadCount = await Message.countDocuments({
    conversation: { $in: conversationIds },
    sender: { $ne: req.user._id },
    readStatus: false,
  });

  res.status(200).json({ unreadCount });
});

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  getUnreadCount,
};
