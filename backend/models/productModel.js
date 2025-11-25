const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: String,
    category: { type: String, required: true },
    stock: { type: Number, required: true },
    imageUrl: { type: String, default: '/uploads/default.jpg' }, // Hình ảnh chính
    imageUrl1: String, // Ảnh 1 (thumbnail)
    imageUrl2: String, // Ảnh 2 (thumbnail)
    imageUrl3: String, // Ảnh 3 (thumbnail)
    illustrationUrl: String, // Hình ảnh minh họa
    origin: String, // Xuất xứ
    name_shop:String,
    address_shop:String,
    storage: String, // Cách bảo quản
    weight: String, // Trọng lượng
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isFeatured: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);