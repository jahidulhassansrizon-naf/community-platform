const express = require("express");
const router = express.Router();
const {
  createOrder,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
} = require("../controllers/orderController");
const { protect } = require("../middlewares/authMiddleware");

// POST /api/orders - নতুন অর্ডার তৈরি
router.post("/", protect, createOrder);

// GET /api/orders/my-orders - ইউজারের নিজের অর্ডার দেখা
router.get("/my-orders", protect, getUserOrders);

// GET /api/orders/admin/all - সব অর্ডার দেখা (অ্যাডমিন)
router.get("/admin/all", protect, getAllOrders);

// PUT /api/orders/admin/:id/status - অর্ডারের স্ট্যাটাস আপডেট (অ্যাডমিন)
router.put("/admin/:id/status", protect, updateOrderStatus);

module.exports = router;
