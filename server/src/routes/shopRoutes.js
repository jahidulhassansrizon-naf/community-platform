const express = require("express");
const router = express.Router();
const {
  searchProducts,
  getCategories,
} = require("../controllers/shopController");

// ক্যাটাগরি ফেচ করার এআই রাউট
router.get("/categories", getCategories);

// প্রোডাক্ট সার্চ রাউট
router.get("/search", searchProducts);

module.exports = router;
