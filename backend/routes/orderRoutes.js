const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/orderModel");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

// Middleware log yêu cầu
router.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
    next();
});

// Lấy danh sách đơn hàng theo userId
router.get("/user/:userId", authenticateToken, async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.params.userId })
            .populate("items.productId");
        if (!orders.length) return res.status(404).json({ message: "No orders found" });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Thêm sản phẩm vào giỏ hàng (chặn nhiều shop)
router.post("/add", authenticateToken, async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const userId = req.user.id;

        if (!productId || quantity <= 0) return res.status(400).json({ message: "Invalid data" });

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: "Product not found" });
        if (!product.sellerId) return res.status(500).json({ message: "Missing seller info" });

        let cart = await Cart.findOne({ userId }) || new Cart({ userId, items: [] });
        const sellerIds = new Set(cart.items.map(item => item.sellerId.toString()));

        if (sellerIds.size > 0 && !sellerIds.has(product.sellerId.toString())) {
            return res.status(400).json({ message: "Only one shop per order allowed" });
        }

        const item = cart.items.find(i => i.productId.toString() === productId);
        if (item) item.quantity += quantity;
        else cart.items.push({ productId, quantity, sellerId: product.sellerId });

        await cart.save();
        res.json({ message: "Added to cart", cart });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

//API /list: Khi lấy đơn hàng của user, truy vấn Product để lấy name_shop và address_shop.
router.get('/list', authenticateToken, async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user.id }).lean();

        for (let order of orders) {
            for (let item of order.items) {
                const product = await Product.findById(item.productId);
                if (product) {
                    item.name_shop = product.name_shop;
                    item.address_shop = product.address_shop;
                } else {
                    item.name = "Sản phẩm đã bị xóa";
                    item.name_shop = "Không xác định";
                    item.address_shop = "Không xác định";
                }
            }
        }

        res.json(orders);
    } catch (error) {
        console.error('Lỗi lấy đơn hàng:', error);
        res.status(500).json({ message: 'Lỗi server', error });
    }
});

//API /create: Tạo đơn hàng nhưng không lưu name_shop và address_shop trong Order.
router.post('/create', authenticateToken, async (req, res) => {
    try {
        const { items } = req.body;
        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'Không có sản phẩm nào trong đơn hàng' });
        }

        let orderItems = [];

        for (let item of items) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(404).json({ message: `Sản phẩm với ID ${item.productId} không tồn tại` });
            }

            orderItems.push({
                productId: product._id,
                name: product.name,
                price: product.price,
                quantity: item.quantity
            });
        }

        const newOrder = new Order({
            userId: req.user.id,
            items: orderItems,
            status: 'Chờ xác nhận',
            totalAmount: orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
        });

        await newOrder.save();
        res.status(201).json({ message: 'Tạo đơn hàng thành công', order: newOrder });
    } catch (error) {
        console.error('Lỗi tạo đơn hàng:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

router.get("/all", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Bạn không có quyền truy cập API này!" });
        }

        let orders = await Order.find({})
            .populate({
                path: "items.productId",
                select: "name name_shop address_shop"
            })
            .sort({ createdAt: -1 });

        orders = orders.map(order => ({
            id: order._id,
            customer: order.customerName || "Không có thông tin",
            product: order.items
                .map(item => item.productId?.name || "Sản phẩm đã bị xóa")
                .join(", "),
            shopName: order.items
                .map(item => item.productId?.name_shop || "Chưa xác định")
                .join(", "),
            shopAddress: order.items
                .map(item => item.productId?.address_shop || "Chưa xác định")
                .join(", "),
            total: order.totalPrice ? order.totalPrice.toLocaleString("vi-VN") + " VND" : "0 VND",
            status: order.status === "pending" ? "Chờ xác nhận" :
                    order.status === "shipping" ? "Đang giao hàng" : "Đã giao",
            createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : "Không có ngày tạo"
        }));

        res.json({ orders });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách đơn hàng:", error);
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
});

// Route lấy đơn hàng theo ID - CẦN ĐỂ SAU `/all`
router.get("/:id", authenticateToken, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate("items.productId", "name");

        if (!order) {
            return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
        }

        res.json(order);
    } catch (error) {
        console.error("Lỗi khi lấy đơn hàng:", error);
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
});

// Tạo đơn hàng từ giỏ hàng
router.post("/", authenticateToken, async (req, res) => {
    try {
        const { address, items, totalPrice, paymentMethod, customerName, phone } = req.body;
        const userId = req.user.id;

        if (!address || !paymentMethod || !customerName || !phone || !items?.length) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const cart = await Cart.findOne({ userId }).populate("items.productId");
        if (!cart?.items.length) return res.status(400).json({ message: "Cart is empty" });

        const calculatedTotal = cart.items.reduce((sum, item) => sum + item.productId.price * item.quantity, 0);
        if (totalPrice !== calculatedTotal) return res.status(400).json({ message: "Total mismatch" });

        const order = new Order({ userId, items, totalPrice, address, paymentMethod, customerName, phone, status: "pending" });
        await order.save();
        await Cart.findOneAndUpdate({ userId }, { $set: { items: [] } });

        res.status(201).json({ message: "Order created", order: { _id: order._id, totalPrice } });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// 🔴 API: Lấy danh sách đơn hàng của người bán
router.get("/", authenticateToken, async (req, res) => {
    try {
        // Kiểm tra quyền seller
        if (req.user.role !== "seller") {
            return res.status(403).json({ message: "Bạn không có quyền truy cập API này!" });
        }

        // Lấy tất cả đơn hàng có chứa sản phẩm của seller đang đăng nhập
        let orders = await Order.find({})
            .populate({
                path: "items.productId",
                select: "name sellerId price",
                strictPopulate: false, // Tránh lỗi nếu productId bị xóa
            })
            .sort({ createdAt: -1 })
            .lean(); // Chuyển về object JS để dễ xử lý

        // Lọc ra chỉ các đơn hàng có chứa sản phẩm thuộc seller hiện tại
        orders = orders
            .map(order => {
                // Lọc ra các sản phẩm thuộc seller hiện tại
                const sellerItems = order.items
                    .filter(item => item.productId && item.productId.sellerId.toString() === req.user.id)
                    .map(item => ({
                        name: item.productId ? item.productId.name : "Sản phẩm đã bị xóa hoặc hết hàng",
                        quantity: item.quantity,
                        price: item.price,
                    }));

                // Nếu đơn hàng không có sản phẩm nào của seller này, bỏ qua đơn hàng đó
                if (sellerItems.length === 0) return null;

                return {
                    id: order._id,
                    customer: order.customerName || "Không có thông tin",
                    products: sellerItems,
                    total: order.totalPrice ? order.totalPrice.toLocaleString("vi-VN") + " VND" : "0 VND",
                    status:
                        order.status === "pending"
                            ? "Chờ xác nhận"
                            : order.status === "shipping"
                            ? "Đang giao hàng"
                            : "Đã giao",
                    createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : "Không có ngày tạo"
                };
            })
            .filter(order => order !== null); // Xóa các đơn hàng không có sản phẩm của seller

        res.json({ orders });
    } catch (error) {
        console.error("❌ Lỗi khi lấy danh sách đơn hàng:", error);
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
});

// Lấy danh sách đơn hàng của seller
router.get("/seller", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== "seller") return res.status(403).json({ message: "Seller only" });

        const orders = await Order.find()
            .populate("items.productId", "name sellerId price")
            .lean();

        const orderList = orders
            .map(order => {
                const sellerItems = order.items
                    .filter(item => item.productId?.sellerId.toString() === req.user.id)
                    .map(item => ({
                        name: item.productId?.name || "Deleted",
                        quantity: item.quantity,
                        price: item.price
                    }));
                return sellerItems.length ? {
                    id: order._id,
                    customer: order.customerName || "Unknown",
                    products: sellerItems,
                    total: order.totalPrice?.toLocaleString("vi-VN") + " VND" || "0 VND",
                    status: order.status === "pending" ? "Chờ xác nhận" : order.status === "shipping" ? "Đang giao" : "Đã giao"
                } : null;
            })
            .filter(Boolean);

        res.json({ orders: orderList });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Cập nhật trạng thái đơn hàng (seller)
router.put("/:id", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== "seller") return res.status(403).json({ message: "Seller only" });
        const { status } = req.body;
        if (!["pending", "shipping", "completed"].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });

        order.status = status;
        await order.save();
        res.json({ message: "Status updated", order });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// 🔎 READ: Tìm kiếm đơn hàng của người dùng
router.get("/search", authenticateToken, async (req, res) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        let query = { userId: req.user.id };
        if (search) {
            query.$or = [
                { _id: { $regex: search, $options: "i" } },
                { customerName: { $regex: search, $options: "i" } },
                { "items.productId.name": { $regex: search, $options: "i" } }
            ];
        }

        const orders = await Order.find(query).populate("items.productId").sort({ createdAt: -1 }).skip(skip).limit(limit);
        const totalOrders = await Order.countDocuments(query);

        res.json({
            data: orders,
            total: totalOrders,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalOrders / limit)
        });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
});

// Hủy đơn hàng (seller)
router.delete("/:id", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== "seller") return res.status(403).json({ message: "Seller only" });
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });
        if (order.status !== "pending") return res.status(400).json({ message: "Cannot cancel processed order" });

        await Order.findByIdAndDelete(req.params.id);
        res.json({ message: "Order canceled" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// 🟠 DELETE: Hủy đơn hàng (Admin)
router.delete("/admin/cancel-order/:id", authenticateToken, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng!" });

        await Order.findByIdAndDelete(req.params.id);
        res.json({ message: "Đơn hàng đã được hủy thành công!" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
});


//hàm xử lý tạo đơn hàng
router.post("/", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { items, totalPrice, customerName, address, phone, note, paymentMethod } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: "Giỏ hàng trống!" });
        }

        const newOrder = new Order({
            userId,
            items,
            totalPrice,
            customerName,
            address,
            phone,
            note,
            paymentMethod
        });

        await newOrder.save();

        // 🛒 Làm trống giỏ hàng sau khi đặt hàng thay vì xóa hoàn toàn
        await Cart.findOneAndUpdate(
            { userId }, 
            { $set: { items: [] } } // ✅ Chỉ xóa sản phẩm, giữ giỏ hàng
        );

        res.status(201).json({ message: "Đơn hàng đã được tạo!", order: newOrder });
    } catch (error) {
        console.error("Lỗi khi tạo đơn hàng:", error);
        res.status(500).json({ message: "Lỗi server!" });
    }
});

// 🔄 UPDATE: Cập nhật trạng thái đơn hàng
router.put("/:id", authenticateToken, async (req, res) => {
    try {
        const { status } = req.body;
        if (!["pending", "shipping", "completed"].includes(status)) {
            return res.status(400).json({ message: "Trạng thái không hợp lệ!" });
        }

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng!" });

        if (req.user.role !== "seller") {
            return res.status(403).json({ message: "Chỉ người bán mới có quyền cập nhật!" });
        }

        order.status = status;
        await order.save();

        res.json({ message: "Cập nhật trạng thái thành công!", order });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
});

module.exports = router;