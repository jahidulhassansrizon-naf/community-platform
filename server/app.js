const express = require("express");
const cors = require("cors");
const path = require("path");
const { errorHandler, notFound } = require("./src/middlewares/errorMiddleware");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const authRoutes = require("./src/routes/authRoutes");
const postRoutes = require("./src/routes/postRoutes");
const matchRoutes = require("./src/routes/matchRoutes");
const messageRoutes = require("./src/routes/messageRoutes");
const userRoutes = require("./src/routes/userRoutes");
const cartRoutes = require("./src/routes/cartRoutes");
const shopRoutes = require("./src/routes/shopRoutes");
const orderRoutes = require("./src/routes/orderRoutes");
const orderMessageRoutes = require("./src/routes/orderMessageRoutes");
const socialRoutes = require("./src/routes/socialRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes"); // নোটিফিকেশন রাউট ইম্পোর্ট করা হলো

app.use("/api/order-messages", orderMessageRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/shop", shopRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/social", socialRoutes);
app.use("/api/notifications", notificationRoutes); // নোটিফিকেশন রাউট রেজিস্টার করা হলো

app.get("/", (req, res) => {
  res.json({
    message: "Community Need & Offer Platform API is running successfully...",
  });
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
