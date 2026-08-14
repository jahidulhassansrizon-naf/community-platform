const multer = require("multer");
const path = require("path");

// স্টোরেজ কনফিগারেশন
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/"); // আপনার প্রজেক্টের আপলোড ফোল্ডার (প্রয়োজনে পাথ অ্যাডজাস্ট করে নিতে পারেন)
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`,
    );
  },
});

// ফাইল টাইপ চেক (শুধু ছবি এলাও করার জন্য)
function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb("Images only!");
  }
}

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

module.exports = upload;
