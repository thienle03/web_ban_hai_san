const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors());
app.use("/uploads", express.static("uploads")); // Phục vụ file tĩnh từ thư mục uploads

// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("🟢 MongoDB Connected"))
  .catch(err => console.log("🔴 MongoDB Error:", err));

// Gắn các tuyến đường
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes); // Endpoint giỏ hàng là /api/cart
app.use("/api/order", orderRoutes);

// Route kiểm tra server
app.get("/", (req, res) => {
    res.send("🚀 Seafood Backend is running!");
});

// Khởi động server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));