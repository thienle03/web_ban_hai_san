const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { 
        type: String, 
        minlength:6,
        maxlength:20,
        required: true 
    },
    email: { 
        type: String, 
        required: true,
        minlength:10,
        maxlength:50, 
        unique: true 
    },
    password: { 
        type: String, 
        minlength:6,
        required: true 
    },
    phone: {
         type: String
    },
    address: { 
        type: String 
    },
    avatar: { 
        type: String, 
        default: "/uploads/default-avatar.png" // Ảnh mặc định nếu người dùng chưa tải lên
    },
    role: { 
        type: String, 
        enum: ["user", "seller","admin"], 
        required: true 
    }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
