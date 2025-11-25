const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    const authHeader = req.header("Authorization");
    console.log("Header nhận được:", authHeader); // ✅ In header ra console

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Token không hợp lệ hoặc thiếu!" });
    }

    const token = authHeader.split(" ")[1];//lay token sau baerer
    console.log("Token nhận được:", token); // ✅ Kiểm tra token đã cắt đúng chưa

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        console.log("Decoded user:", decoded); // ✅ In thông tin user sau khi decode
        next();
    } catch (error) {
        console.error("JWT Verify Error:", error.message); // ✅ In lỗi ra console
        res.status(403).json({ message: "Token không hợp lệ hoặc đã hết hạn!" });
    }
};
module.exports = authMiddleware;
