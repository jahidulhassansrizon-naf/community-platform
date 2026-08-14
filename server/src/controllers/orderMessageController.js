const OrderMessage = require("../models/OrderMessage");
const Order = require("../models/Order");

// Send a message for a specific order
exports.sendMessage = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { message } = req.body;
    const senderId = req.user._id;
    const isAdmin = req.user.role === "admin" || req.user.isAdmin;
    const senderRole = isAdmin ? "Admin" : "User";

    if (!message || message.trim() === "") {
      return res
        .status(400)
        .json({ success: false, message: "Message cannot be empty" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (!isAdmin && order.userId.toString() !== senderId.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized access to this chat" });
    }

    const newMessage = new OrderMessage({
      orderId,
      sender: senderId,
      senderModel: senderRole,
      message,
      isRead: false,
    });

    await newMessage.save();

    const populatedMessage = await OrderMessage.findById(
      newMessage._id,
    ).populate("sender", "name email role profileImage");

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: populatedMessage,
    });
  } catch (error) {
    console.error("Error sending order message:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get all messages for a specific order and mark unread messages as read for the viewer
exports.getOrderMessages = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;
    const isAdmin = req.user.role === "admin" || req.user.isAdmin;

    const order = await Order.findById(orderId)
      .populate("userId", "name email profileImage")
      .catch(() => null);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (!isAdmin) {
      const orderUserId = order.userId?._id
        ? order.userId._id.toString()
        : order.userId.toString();

      if (orderUserId !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized access to this chat",
        });
      }
    }

    // Mark messages sent by the *other* party as read
    const readerRole = isAdmin ? "Admin" : "User";
    await OrderMessage.updateMany(
      { orderId, senderModel: { $ne: readerRole }, isRead: false },
      { $set: { isRead: true } },
    );

    const messages = await OrderMessage.find({ orderId })
      .populate("sender", "name email role profileImage")
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      order,
      messages,
    });
  } catch (error) {
    console.error("Error fetching order messages:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Check if there are any unread messages for the logged-in user or admin
exports.getUnreadMessageStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const isAdmin = req.user.role === "admin" || req.user.isAdmin;
    const readerRole = isAdmin ? "Admin" : "User";

    let unreadCount = 0;

    if (isAdmin) {
      // Admin wants to know if any order has messages from 'User' where isRead is false
      unreadCount = await OrderMessage.countDocuments({
        senderModel: "User",
        isRead: false,
      });
    } else {
      // User wants to know if any of their orders have messages from 'Admin' where isRead is false
      const userOrders = await Order.find({ userId }).select("_id");
      const orderIds = userOrders.map((o) => o._id);

      unreadCount = await OrderMessage.countDocuments({
        orderId: { $in: orderIds },
        senderModel: "Admin",
        isRead: false,
      });
    }

    res.status(200).json({
      success: true,
      hasUnread: unreadCount > 0,
      unreadCount,
    });
  } catch (error) {
    console.error("Error checking unread messages:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
