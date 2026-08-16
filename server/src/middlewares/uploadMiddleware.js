const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// .env থেকে ডেটা কনফিগার করা
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "community_profiles", // Cloudinary-তে যে ফোল্ডারে ফাইল জমা হবে
    allowed_formats: ["jpg", "png", "jpeg", "webp", "mp4", "mov", "avi", "mkv"], // ইমেজ ও ভিডিও ফরম্যাটগুলো যুক্ত করা হলো
    resource_type: "auto", // ইমেজ এবং ভিডিও উভয় ফাইল টাইপ হ্যান্ডেল করার জন্য
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // ফাইলের সাইজ লিমিট বাড়িয়ে ৫০ এমবি করা হলো (দরকার হলে আরও বাড়াতে পারেন)
});

module.exports = upload;
