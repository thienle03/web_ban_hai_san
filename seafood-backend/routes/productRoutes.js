const express = require('express');
const Product = require('../models/productModel');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const authenticateToken = require('../middleware/authMiddleware');

// Storage configuration for product images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },    
});

const upload = multer({ storage: storage });

// Middleware to verify seller role
const verifySeller = (req, res, next) => {
    if (req.user.role !== 'seller') {
        return res.status(403).json({ message: 'Quyền truy cập bị từ chối. Chỉ dành cho người bán.' });
    }
    next();
};

// Thêm sản phẩm mới (chỉ dành cho seller) - Hỗ trợ upload nhiều hình ảnh
router.post('/add', authenticateToken, verifySeller, upload.fields([
    { name: 'imageUrl', maxCount: 1 }, // Hình ảnh chính
    { name: 'imageUrl1', maxCount: 1 }, // Ảnh 1
    { name: 'imageUrl2', maxCount: 1 }, // Ảnh 2
    { name: 'imageUrl3', maxCount: 1 }, // Ảnh 3
    { name: 'illustrationUrl', maxCount: 1 } // Hình ảnh minh họa
]), async (req, res) => {
    try {
        const { name, price, description, category, stock, origin, storage, weight } = req.body;

        // Kiểm tra dữ liệu đầu vào
        if (!name || !price || !category || !stock) {
            return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin sản phẩm!' });
        }
        if (isNaN(price) || isNaN(stock)) {
            return res.status(400).json({ message: 'Giá và số lượng phải là số!' });
        }

        // Lấy đường dẫn các hình ảnh từ req.files
        const imageUrls = {};
        if (req.files['imageUrl']) {
            imageUrls.imageUrl = `/uploads/${req.files['imageUrl'][0].filename}`;
        } else {
            imageUrls.imageUrl = '/uploads/default.jpg'; // Fallback nếu không upload hình chính
        }
        if (req.files['imageUrl1']) imageUrls.imageUrl1 = `/uploads/${req.files['imageUrl1'][0].filename}`;
        if (req.files['imageUrl2']) imageUrls.imageUrl2 = `/uploads/${req.files['imageUrl2'][0].filename}`;
        if (req.files['imageUrl3']) imageUrls.imageUrl3 = `/uploads/${req.files['imageUrl3'][0].filename}`;
        if (req.files['illustrationUrl']) imageUrls.illustrationUrl = `/uploads/${req.files['illustrationUrl'][0].filename}`;

        const newProduct = new Product({
            name,
            price: Number(price),
            description,
            category,
            stock: Number(stock),
            origin,
            storage,
            weight,
            ...imageUrls, // Gán các đường dẫn hình ảnh
            sellerId: req.user.id,
        });

        await newProduct.save();
        res.status(201).json({ message: 'Thêm sản phẩm thành công!', product: newProduct });
    } catch (error) {
        console.error('Lỗi thêm sản phẩm:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// Lấy danh sách sản phẩm của seller
router.get('/my-products', authenticateToken, verifySeller, async (req, res) => {
    try {
        const products = await Product.find({ sellerId: req.user.id });
        res.json(products);
    } catch (error) {
        console.error('Lỗi lấy danh sách sản phẩm:', error);
        res.status(500).json({ message: 'Lỗi server', error });
    }
});

// Lấy tất cả sản phẩm (công khai)
router.get('/', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        console.error('Lỗi lấy danh sách sản phẩm:', error);
        res.status(500).json({ message: 'Lỗi server', error });
    }
});

// Lấy sản phẩm mới nhất (cho trang chủ)
router.get('/new', async (req, res) => {
    try {
        const products = await Product.find()
            .sort({ createdAt: -1 }) // Sắp xếp theo thời gian tạo, mới nhất trước
            .exec();
        res.json(products);
    } catch (error) {
        console.error('Lỗi lấy sản phẩm mới:', error);
        res.status(500).json({ message: 'Lỗi server', error });
    }
});

// Lấy sản phẩm nổi bật với phân trang
router.get('/featured', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        const products = await Product.find({ isFeatured: true })
            .sort({ createdAt: -1 }) // Sắp xếp theo thời gian tạo, mới nhất trước
            .skip(skip)
            .limit(limit)
            .exec();

        const total = await Product.countDocuments({ isFeatured: true }); // Tổng số sản phẩm nổi bật

        res.json({ products, total });
    } catch (error) {
        console.error('Lỗi khi lấy sản phẩm nổi bật:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// Lấy chi tiết sản phẩm theo ID
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
        }
        res.json(product);
    } catch (error) {
        console.error('Lỗi khi lấy chi tiết sản phẩm:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// Cập nhật sản phẩm (chỉ seller có thể cập nhật sản phẩm của họ)
router.put('/:id', authenticateToken, verifySeller, upload.fields([
    { name: 'imageUrl', maxCount: 1 },
    { name: 'imageUrl1', maxCount: 1 },
    { name: 'imageUrl2', maxCount: 1 },
    { name: 'imageUrl3', maxCount: 1 },
    { name: 'illustrationUrl', maxCount: 1 }
]), async (req, res) => {
    try {
        const product = await Product.findOne({
            _id: req.params.id,
            sellerId: req.user.id,
        });

        if (!product) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm hoặc không có quyền chỉnh sửa!' });
        }

        const updateData = { ...req.body };
        const imageFields = ['imageUrl', 'imageUrl1', 'imageUrl2', 'imageUrl3', 'illustrationUrl'];

        for (const field of imageFields) {
            if (req.files[field]) {
                // Xóa ảnh cũ nếu có (nếu không phải ảnh mặc định)
                if (product[field] && product[field] !== '/uploads/default.jpg') {
                    const oldImagePath = path.join(__dirname, '..', 'uploads', path.basename(product[field]));
                    try {
                        await fs.unlink(oldImagePath);
                        console.log(`Đã xóa ảnh cũ: ${oldImagePath}`);
                    } catch (err) {
                        console.error('Lỗi khi xóa ảnh cũ:', err);
                    }
                }
                updateData[field] = `/uploads/${req.files[field][0].filename}`;
            }
        }

        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.json({ message: 'Cập nhật sản phẩm thành công!', product: updatedProduct });
    } catch (error) {
        console.error('Lỗi cập nhật sản phẩm:', error);
        res.status(500).json({ message: 'Lỗi server', error });
    }
});

// Xóa sản phẩm và ảnh
router.delete('/:id', authenticateToken, verifySeller, async (req, res) => {
    try {
        const product = await Product.findOne({
            _id: req.params.id,
            sellerId: req.user.id,
        });

        if (!product) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm hoặc không có quyền xóa!' });
        }

        // Xóa tất cả các hình ảnh liên quan (nếu không phải ảnh mặc định)
        const imageFields = ['imageUrl', 'imageUrl1', 'imageUrl2', 'imageUrl3', 'illustrationUrl'];
        for (const field of imageFields) {
            if (product[field] && product[field] !== '/uploads/default.jpg') {
                const imagePath = path.join(__dirname, '..', 'uploads', path.basename(product[field]));
                try {
                    await fs.unlink(imagePath);
                    console.log(`Đã xóa ảnh: ${imagePath}`);
                } catch (err) {
                    console.error('Lỗi khi xóa ảnh:', err);
                }
            }
        }

        // Xóa sản phẩm khỏi database
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'Xóa sản phẩm thành công!' });
    } catch (error) {
        console.error('Lỗi xóa sản phẩm:', error);
        res.status(500).json({ message: 'Lỗi server', error });
    }
});

// API lấy tất cả sản phẩm
router.get("/products", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Chỉ admin mới có quyền truy cập!" });
        }
        const products = await Product.find();
        res.status(200).json({
            message: products.length ? "Danh sách sản phẩm" : "Không có sản phẩm nào!",
            data: products,
        });
    } catch (error) {
        console.error("Lỗi khi lấy sản phẩm:", error);
        res.status(500).json({ message: "Lỗi server!", error });
    }
});

module.exports = router;