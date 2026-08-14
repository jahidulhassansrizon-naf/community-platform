const express = require("express");
const router = express.Router();
const { getMatchesForPost } = require("../controllers/matchController");
const { protect } = require("../middlewares/authMiddleware");

router.get("/:postId", protect, getMatchesForPost);

module.exports = router;
