const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const User = require("../models/user");
const authenticateToken = require("../middleware/authMiddleware");
const cloudinary = require("./cloudinaryConfig"); // Import từ config

const router = express.Router();

// 📌 Cấu hình Multer - Lưu file tạm vào thư mục uploads/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, req.user.id + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// 📌 Lấy thông tin User Profile
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại!" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error });
  }
});

// 📌 Cập nhật User Profile
router.put("/update", authenticateToken, async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone, address },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "Không tìm thấy người dùng!" });
    }

    res.json({ message: "Cập nhật thành công!", user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server!", error });
  }
});

// 📌 Xóa User
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng!" });
    }
    res.status(200).json({ message: "Xóa thành công!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error });
  }
});

// 📌 API Upload Avatar với Cloudinary
router.post("/upload-avatar", authenticateToken, upload.single("avatar"), async (req, res) => {
  try {
      if (!req.file) {
          return res.status(400).json({ message: "Không có file nào được upload!" });
      }

      const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "avatars",
          public_id: `avatar_${req.user.id}`,
          overwrite: true
      });
      console.log("Cloudinary upload result:", result);

      fs.unlinkSync(req.file.path);
      const avatarUrl = result.secure_url;

      const updatedUser = await User.findByIdAndUpdate(
          req.user.id,
          { avatar: avatarUrl },
          { new: true }
      );

      res.json({ message: "Cập nhật avatar thành công!", avatarUrl });
  } catch (error) {
      console.error("Server error in upload-avatar:", error.message);
      res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
});

// 📌 Lấy tất cả người dùng
router.get("/all", authenticateToken, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    if (users.length === 0) {
      return res.status(404).json({ message: "Không có người dùng nào!" });
    }
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error });
  }
});

// 📌 API lấy tất cả người bán (sellers)
router.get("/sellers", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Chỉ admin mới có quyền truy cập!" });
    }

    const sellers = await User.find({ role: "seller" }).select("-password");
    if (sellers.length === 0) {
      return res.status(404).json({ message: "Không có người bán nào!" });
    }

    res.status(200).json({
      message: "Danh sách người bán",
      data: sellers,
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách người bán:", error);
    res.status(500).json({ message: "Lỗi server!", error });
  }
});

module.exports = router;