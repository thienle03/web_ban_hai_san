const express = require("express");
const Order = require("../models/orderModel");
const Cart = require("../models/cartModel");
const authenticateToken = require("../middleware/authMiddleware");
const mongoose = require("mongoose");

const router = express.Router();

// Log xác nhận file đang được chạy
console.log("[ORDER ROUTER] FILE LOADED: orderRoutes.js tại", new Date().toISOString());

// Log tất cả yêu cầu vào router
router.use((req, res, next) => {
    console.log(`[ORDER ROUTER] Yêu cầu: ${req.method} ${req.originalUrl} tại ${new Date().toISOString()}`);
    next();
});

// 🔵 READ: Lấy tất cả đơn hàng (dành cho admin)
router.get("/order/all", authenticateToken, async (req, res) => {
    console.log("[GET /order/all] Route được gọi bởi user:", req.user);
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Chỉ admin mới có quyền truy cập!" });
        }

        const orders = await Order.find()
            .populate("userId", "name")
            .populate("items.productId", "name");

        console.log("[GET /order/all] Orders sau populate:", orders);

        const orderList = orders.map(order => {
            console.log("[GET /order/all] Đang xử lý order:", order._id);
            return {
                ...order._doc,
                userName: order.userId && order.userId.name ? order.userId.name : "Không xác định",
                items: order.items.map(item => {
                    console.log("[GET /order/all] Đang xử lý item:", item);
                    return {
                        productId: item.productId && item.productId._id ? item.productId._id : null,
                        productName: item.productId && item.productId.name ? item.productId.name : "Sản phẩm không tồn tại",
                        quantity: item.quantity || 0,
                        price: item.price || 0
                    };
                })
            };
        });

        res.status(200).json({
            message: orders.length ? "Danh sách đơn hàng" : "Không có đơn hàng nào!",
            data: orderList,
        });
    } catch (error) {
        console.error("[GET /order/all] Lỗi khi lấy đơn hàng:", error);
        res.status(500).json({ message: "Lỗi server!", error: error.message });
    }
});

// 🟢 CREATE: Tạo đơn hàng từ giỏ hàng
router.post("/", authenticateToken, async (req, res) => {
    console.log("[POST /] Route được gọi bởi user:", req.user);
    try {
        const { address, items, total, paymentMethod, customerName, phone, note } = req.body;
        const userId = req.user.id;

        console.log("[POST /] Request Body:", req.body);
        console.log("[POST /] User ID:", userId);

        if (!address || !paymentMethod || !customerName || !phone) {
            return res.status(400).json({ 
                message: "Lỗi server", 
                error: "Vui lòng cung cấp đầy đủ thông tin yêu cầu (address, paymentMethod, customerName, phone)" 
            });
        }

        const cart = await Cart.findOne({ userId }).populate("items.productId");
        console.log("[POST /] Cart found:", cart);
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: "Giỏ hàng trống!" });
        }

        if (!items || !Array.isArray(items) || items.length !== cart.items.length) {
            return res.status(400).json({ message: "Dữ liệu sản phẩm không hợp lệ!" });
        }

        let totalPrice = 0;
        cart.items.forEach(item => {
            totalPrice += item.productId.price * item.quantity;
        });

        console.log("[POST /] Calculated totalPrice:", totalPrice);
        if (total !== totalPrice) {
            return res.status(400).json({ message: "Tổng tiền không khớp!" });
        }

        const order = new Order({
            userId,
            items: items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price
            })),
            totalPrice: total,
            address,
            paymentMethod,
            customerName,
            phone,
            note,
            status: "pending"
        });

        console.log("[POST /] Order before save:", order);
        await order.save();
        console.log("[POST /] Order saved with ID:", order._id);
        await Cart.findOneAndDelete({ userId });

        res.status(201).json({ 
            message: "Đơn hàng đã được tạo!", 
            order: { _id: order._id, totalPrice: order.totalPrice } 
        });
    } catch (error) {
        console.error("[POST /] Lỗi khi tạo đơn hàng:", error);
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
});

// 🔵 READ: Lấy thông tin đơn hàng theo ID
router.get("/:id", authenticateToken, async (req, res) => {
    console.log("[GET /:id] Route được gọi với id:", req.params.id);
    try {
        const order = await Order.findById(req.params.id).populate("items.productId");
        if (!order) {
            return res.status(404).json({ message: "Không tìm thấy đơn hàng!" });
        }
        if (order.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Không có quyền truy cập đơn hàng này!" });
        }

        const orderDetails = {
            ...order._doc,
            items: order.items.map(item => ({
                productId: item.productId ? item.productId._id : null,
                productName: item.productId ? item.productId.name : "Sản phẩm không tồn tại",
                quantity: item.quantity,
                price: item.price
            }))
        };

        res.json(orderDetails);
    } catch (error) {
        console.error("[GET /:id] Lỗi khi lấy thông tin đơn hàng:", error);
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
});

// 🔴 READ: Lấy danh sách tất cả đơn hàng (dành cho người bán)
router.get("/", authenticateToken, async (req, res) => {
    console.log("[GET /] Route được gọi bởi user:", req.user);
    try {
        if (req.user.role !== "seller") {
            return res.status(403).json({ message: "Chỉ người bán mới có quyền truy cập!" });
        }

        const orders = await Order.find()
            .populate("items.productId")
            .sort({ createdAt: -1 });

        const orderList = orders.map(order => ({
            id: order._id,
            customer: order.customerName,
            product: order.items.map(item => (item.productId ? item.productId.name : "Sản phẩm không tồn tại")).join(", "),
            total: order.totalPrice.toLocaleString("vi-VN") + " VND",
            status: order.status === "pending" ? "Chờ xác nhận" : 
                    order.status === "shipping" ? "Đang giao hàng" : 
                    "Đã giao"
        }));

        res.json(orderList);
    } catch (error) {
        console.error("[GET /] Lỗi khi lấy danh sách đơn hàng:", error);
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
});

// 🔵 READ: Lấy đơn hàng theo userId với phân trang và tìm kiếm
router.get("/id", authenticateToken, async (req, res) => {
    console.log("[GET /id] Route được gọi bởi user:", req.user);
    try {
        const { search, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        console.log("[GET /id] Request query:", req.query);
        console.log("[GET /id] User ID from token:", req.user.id);
        console.log("[GET /id] User role from token:", req.user.role);

        if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
            return res.status(400).json({ 
                message: "Dữ liệu không hợp lệ", 
                error: "ID người dùng không hợp lệ" 
            });
        }

        let query = { userId: mongoose.Types.ObjectId(req.user.id) };
        if (search) {
            query.$or = [
                { _id: { $regex: search, $options: "i" } },
                { customerName: { $regex: search, $options: "i" } },
                { "items.productId": { $regex: search, $options: "i" } }
            ];
        }

        const orders = await Order.find(query)
            .populate("items.productId")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const totalOrders = await Order.countDocuments(query);

        const orderList = orders.map(order => ({
            id: order._id,
            customerName: order.customerName,
            address: order.address,
            phone: order.phone,
            paymentMethod: order.paymentMethod,
            items: order.items.map(item => ({
                name: item.productId ? item.productId.name : "Sản phẩm không tồn tại",
                quantity: item.quantity,
                price: item.price
            })),
            totalPrice: order.totalPrice,
            status: order.status,
            createdAt: order.createdAt,
            estimatedDeliveryDate: order.estimatedDeliveryDate,
            shippingCode: order.shippingCode,
            shippingTrackingUrl: order.shippingTrackingUrl
        }));

        res.json({
            data: orderList,
            total: totalOrders,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalOrders / limit)
        });
    } catch (error) {
        console.error("[GET /id] Lỗi khi lấy danh sách đơn hàng:", error);
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
});

// 🟠 DELETE: Hủy đơn hàng
router.delete("/:id", authenticateToken, async (req, res) => {
    console.log("[DELETE /:id] Route được gọi với id:", req.params.id);
    try {
        if (req.user.role !== "seller") {
            return res.status(403).json({ message: "Chỉ người bán mới có quyền hủy đơn!" });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: "Không tìm thấy đơn hàng!" });
        }

        if (order.status !== "pending") {
            return res.status(400).json({ message: "Không thể hủy đơn hàng đã xử lý!" });
        }

        await Order.findByIdAndDelete(req.params.id);
        res.json({ message: "Đơn hàng đã được hủy!" });
    } catch (error) {
        console.error("[DELETE /:id] Lỗi khi hủy đơn hàng:", error);
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
});

module.exports = router;