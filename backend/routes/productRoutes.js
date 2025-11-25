const express = require('express');
const Product = require('../models/productModel');
const Order = require("../models/orderModel");
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const authenticateToken = require('../middleware/authMiddleware');
const cloudinary = require('./cloudinaryConfig');

// Storage configuration for temporary upload (before uploading to Cloudinary)
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

// Thêm sản phẩm mới (chỉ dành cho seller) - Upload ảnh lên Cloudinary
router.post('/add', authenticateToken, verifySeller, upload.fields([
    { name: 'imageUrl', maxCount: 1 }, // Hình ảnh chính
    { name: 'imageUrl1', maxCount: 1 }, // Ảnh 1
    { name: 'imageUrl2', maxCount: 1 }, // Ảnh 2
    { name: 'imageUrl3', maxCount: 1 }, // Ảnh 3
    { name: 'illustrationUrl', maxCount: 1 } // Hình ảnh minh họa
]), async (req, res) => {
    try {
        const { name, price, description, category, stock, name_shop, address_shop, origin, storage, weight } = req.body;

        // Kiểm tra dữ liệu đầu vào
        if (!name || !price || !category || !stock|| !name_shop || !address_shop) {
            return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin sản phẩm!' });
        }
        if (isNaN(price) || isNaN(stock)) {
            return res.status(400).json({ message: 'Giá và số lượng phải là số!' });
        }

        // Upload ảnh lên Cloudinary và lấy URL
        const imageUrls = {};
        const imageFields = ['imageUrl', 'imageUrl1', 'imageUrl2', 'imageUrl3', 'illustrationUrl'];

        for (const field of imageFields) {
            if (req.files[field]) {
                const filePath = req.files[field][0].path;
                const result = await cloudinary.uploader.upload(filePath, {
                    folder: 'products', // Lưu vào thư mục 'products' trên Cloudinary
                    width: 200, // Tùy chọn resize (có thể điều chỉnh)
                    height: 200,
                    crop: 'fill' // Cắt ảnh để vừa khung
                });
                imageUrls[field] = result.secure_url; // Lưu URL từ Cloudinary

                // Xóa file tạm sau khi upload lên Cloudinary
                await fs.unlink(filePath).catch(err => console.error('Lỗi xóa file tạm:', err));
            }
        }

        // Nếu không có ảnh chính, dùng ảnh mặc định từ Cloudinary
        if (!imageUrls.imageUrl) {
            imageUrls.imageUrl = 'https://res.cloudinary.com/your_cloud_name/image/upload/v1234567890/default.jpg'; // Thay bằng URL ảnh mặc định trên Cloudinary
        }

        const newProduct = new Product({
            name,
            price: Number(price),
            description,
            category,
            stock: Number(stock),
            name_shop,
            address_shop,
            origin,
            storage,
            weight,
            ...imageUrls, // Gán các đường dẫn hình ảnh từ Cloudinary
            sellerId: req.user.id,
        });

        await newProduct.save();
        console.log('Sản phẩm mới được thêm:', newProduct);
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
        console.log('Sản phẩm mới trả về:', products);
        res.json(products);
    } catch (error) {
        console.error('Lỗi lấy sản phẩm mới:', error);
        res.status(500).json({ message: 'Lỗi server', error });
    }
});

// Lấy sản phẩm nổi bật (dựa vào số lần xuất hiện trong đơn hàng)
router.get("/featured", async (req, res) => {
    try {
        const productCounts = await Order.aggregate([
            { $unwind: "$items" },  // Giải nén danh sách sản phẩm trong đơn hàng
            {
                $group: {
                    _id: "$items.productId",  // Gom nhóm theo `productId`
                    totalSold: { $sum: "$items.quantity" } // Tính tổng số lượng đã bán
                }
            },
            { $sort: { totalSold: -1 } }, // Sắp xếp theo số lượng đã bán giảm dần
            { $limit: 15 } // Lấy tối đa 15 sản phẩm nổi bật
        ]);

        const productIds = productCounts.map(p => p._id);
        const featuredProducts = await Product.find({ _id: { $in: productIds } });

        const productsWithSales = featuredProducts.map(product => {
            const salesData = productCounts.find(p => p._id.equals(product._id));
            return {
                _id: product._id,
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrl,
                category: product.category || "all",
                name_shop: product.name_shop || "Không có thông tin",
                address_shop: product.address_shop || "Không có thông tin",
                totalSold: salesData ? salesData.totalSold : 0
            };
        });

        res.json({ products: productsWithSales });
    } catch (error) {
        console.error("Lỗi khi lấy sản phẩm nổi bật:", error);
        res.status(500).json({ message: "Lỗi server khi lấy sản phẩm nổi bật" });
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
                const filePath = req.files[field][0].path;
                const result = await cloudinary.uploader.upload(filePath, {
                    folder: 'products',
                    width: 200,
                    height: 200,
                    crop: 'fill'
                });
                updateData[field] = result.secure_url;

                // Xóa file tạm sau khi upload lên Cloudinary
                await fs.unlink(filePath).catch(err => console.error('Lỗi xóa file tạm:', err));

                // Xóa ảnh cũ trên Cloudinary (nếu tồn tại và không phải ảnh mặc định)
                if (product[field] && !product[field].includes('default.jpg')) {
                    const publicId = product[field].split('/').slice(-2).join('/').split('.')[0];
                    await cloudinary.uploader.destroy(publicId).catch(err => console.error('Lỗi xóa ảnh cũ trên Cloudinary:', err));
                }
            }
        }

        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.json({ message: 'Cập nhật sản phẩm thành công!', product: updatedProduct });
    } catch (error) {
        console.error('Lỗi cập nhật sản phẩm:', error);
        res.status(500).json({ message: 'Lỗi server', error });
    }
});
// API tìm kiếm sản phẩm
router.get('/search', async (req, res) => {
    try {
        const { query } = req.query;
        
        if (!query) {
            return res.status(400).json({ message: 'Vui lòng nhập từ khóa tìm kiếm' });
        }

        // Tìm kiếm không phân biệt hoa thường theo tên hoặc mô tả sản phẩm
        const products = await Product.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } }
            ]
        });

        res.status(200).json(products);
    } catch (error) {
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

        // Xóa tất cả các hình ảnh liên quan trên Cloudinary
        const imageFields = ['imageUrl', 'imageUrl1', 'imageUrl2', 'imageUrl3', 'illustrationUrl'];
        for (const field of imageFields) {
            if (product[field] && !product[field].includes('default.jpg')) {
                const publicId = product[field].split('/').slice(-2).join('/').split('.')[0];
                await cloudinary.uploader.destroy(publicId).catch(err => console.error('Lỗi xóa ảnh trên Cloudinary:', err));
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