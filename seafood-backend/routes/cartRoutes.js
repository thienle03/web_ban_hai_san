const express = require('express');
const Cart = require('../models/cartModel');
const Product = require('../models/productModel');
const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();

// 🟢 Thêm sản phẩm vào giỏ hàng
router.post('/add', authenticateToken, async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const userId = req.user.id;

        if (!productId || !quantity || quantity <= 0) {
            return res.status(400).json({ message: 'Dữ liệu không hợp lệ!' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Sản phẩm không tồn tại!' });
        }

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        const existingItem = cart.items.find(item => item.productId.toString() === productId);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.items.push({ productId, quantity });
        }

        await cart.save();
        res.json({ message: 'Thêm vào giỏ hàng thành công!', cart });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// 🔵 Lấy giỏ hàng của user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user.id }).populate('items.productId');
        if (!cart || cart.items.length === 0) {
            return res.json({ items: [] });
        }
        res.json(cart);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// 🟠 Cập nhật số lượng sản phẩm
router.put('/update', authenticateToken, async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const userId = req.user.id;

        if (!productId || !quantity || quantity <= 0) {
            return res.status(400).json({ message: 'Số lượng không hợp lệ!' });
        }

        let cart = await Cart.findOne({ userId });
        if (!cart) return res.status(404).json({ message: 'Giỏ hàng trống!' });

        const item = cart.items.find(item => item.productId.toString() === productId);
        if (!item) return res.status(404).json({ message: 'Sản phẩm không tồn tại trong giỏ hàng!' });

        item.quantity = quantity;
        await cart.save();

        res.json({ message: 'Cập nhật giỏ hàng thành công!', cart });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// 🔴 Xóa sản phẩm khỏi giỏ hàng
router.delete('/remove/:productId', authenticateToken, async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user.id;

        let cart = await Cart.findOne({ userId });
        if (!cart) return res.status(404).json({ message: 'Giỏ hàng trống!' });

        const itemCountBefore = cart.items.length;
        cart.items = cart.items.filter(item => item.productId.toString() !== productId);
        if (itemCountBefore === cart.items.length) {
            return res.status(404).json({ message: 'Sản phẩm không tồn tại trong giỏ hàng!' });
        }

        await cart.save();
        res.json({ message: 'Xóa sản phẩm khỏi giỏ hàng thành công!', cart });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// 🛒 Xóa toàn bộ giỏ hàng
router.delete('/clear', authenticateToken, async (req, res) => {
    try {
        await Cart.findOneAndDelete({ userId: req.user.id });
        res.json({ message: 'Đã xóa toàn bộ giỏ hàng!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

module.exports = router;