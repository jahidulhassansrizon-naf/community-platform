const Order = require("../models/Order");

// @desc    Create new order
// @route   POST /api/orders
// @access  Private (Logged in users only)
const createOrder = async (req, res) => {
  try {
    const { orderItems, shippingAddress, totalPrice, paymentMethod } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No order items found" });
    }

    const order = new Order({
      userId: req.user._id,
      orderItems,
      shippingAddress,
      totalPrice,
      paymentMethod: paymentMethod || "Cash on Delivery",
    });

    const createdOrder = await order.save();

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: createdOrder,
    });
  } catch (error) {
    console.error("Error creating order:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

// @desc    Get logged in user's orders
// @route   GET /api/orders/my-orders
// @access  Private
const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("Error fetching user orders:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Get all orders (For Admin)
// @route   GET /api/orders/admin/all
// @access  Private
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("userId", "name email")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("Error fetching all orders:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Update order status (For Admin)
// @route   PUT /api/orders/admin/:id/status
// @access  Private
const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    order.status = req.body.status || order.status;
    const updatedOrder = await order.save();

    res
      .status(200)
      .json({ success: true, message: "Order status updated", updatedOrder });
  } catch (error) {
    console.error("Error updating order status:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
};
