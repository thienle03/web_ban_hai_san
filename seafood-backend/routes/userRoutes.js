const express = require("express");
const multer = require("multer");
const path = require("path");
const User = require("../models/user");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

// 📌 Cấu hình Multer - Lưu file vào thư mục uploads/
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); // Lưu vào thư mục uploads
    },
    filename: (req, file, cb) => {
        cb(null, req.user.id + path.extname(file.originalname)); // Đổi tên file theo user ID
    }
});

const upload = multer({ storage });

// 📌 Lấy thông tin User Profile
router.get("/profile", authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password"); // Loại bỏ password
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
            { new: true } // Trả về dữ liệu mới sau khi cập nhật
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

// 📌 API Upload Avatar
router.post("/upload-avatar", authenticateToken, upload.single("avatar"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Không có file nào được upload!" });
        }

        const avatarUrl = `/uploads/${req.file.filename}`; // Đường dẫn ảnh

        // Cập nhật avatar trong database
        const updatedUser = await User.findByIdAndUpdate(req.user.id, { avatar: avatarUrl }, { new: true });

        res.json({ message: "Cập nhật avatar thành công!", avatarUrl });
    } catch (error) {
        console.error("Lỗi upload avatar:", error);
        res.status(500).json({ message: "Lỗi server!" });
    }
});

// 📌 Lấy tất cả người dùng
router.get("/all", authenticateToken, async (req, res) => {
    try {
        const users = await User.find().select("-password"); // Lấy tất cả người dùng, loại bỏ mật khẩu
        if (users.length === 0) {
            return res.status(404).json({ message: "Không có người dùng nào!" });
        }
        res.json(users); // Trả về danh sách người dùng
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error });
    }
});

// API lấy tất cả người bán (sellers)
router.get("/sellers", authenticateToken, async (req, res) => {
    try {
        // Chỉ cho phép admin truy cập
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Chỉ admin mới có quyền truy cập!" });
        }

        // Lấy tất cả người bán từ database
        const sellers = await User.find({ role: "seller" }).select("-password"); // Loại bỏ mật khẩu
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
