const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const router = express.Router();

// 📌 Đăng ký User hoặc Seller
router.post("/register", async (req, res) => {
    try {
        const { name, email, password, phone, address, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin!" });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: "Email đã tồn tại!" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ 
            name, 
            email: email.toLowerCase(), 
            password: hashedPassword, 
            phone, 
            address, 
            role 
        });

        await newUser.save();

        const userResponse = { 
            id: newUser._id, 
            name: newUser.name, 
            email: newUser.email, 
            phone: newUser.phone, 
            address: newUser.address, 
            role: newUser.role 
        };

        res.status(201).json({ message: "Đăng ký thành công!", user: userResponse });
    } catch (error) {
        console.error("💥 Lỗi đăng ký:", error);
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
});

// 📌 Đăng nhập User hoặc Seller
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Vui lòng nhập email và mật khẩu!" });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(400).json({ message: "Người dùng không tồn tại!" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Mật khẩu không đúng!" });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "30d" });

        const userResponse = { 
            id: user._id, 
            name: user.name, 
            email: user.email, 
            phone: user.phone, 
            address: user.address, 
            role: user.role 
        };

        res.cookie("token", token, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === "production", 
            sameSite: "strict", 
            maxAge: 24 * 60 * 60 * 1000 
        });

        res.status(200).json({ message: "Đăng nhập thành công!",token, user: userResponse });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error });
    }
});

module.exports = router;
