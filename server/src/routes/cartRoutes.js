const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");
const { protect } = require("../middlewares/authMiddleware");

// Get user's cart
router.get("/", protect, async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.json({ items: [] });
    }
    res.json(cart);
  } catch (error) {
    console.error("Error fetching cart:", error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// Save or Update user's cart
router.post("/", protect, async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ message: "Invalid items data" });
    }

    let cart = await Cart.findOne({ userId: req.user._id });

    if (cart) {
      cart.items = items;
      await cart.save();
    } else {
      cart = new Cart({
        userId: req.user._id,
        items,
      });
      await cart.save();
    }

    res.json({ message: "Cart updated successfully", cart });
  } catch (error) {
    console.error("Error saving cart:", error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

module.exports = router;
