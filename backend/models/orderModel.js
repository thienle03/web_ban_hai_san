const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{ 
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }
    }],
    
    totalPrice: { type: Number, required: true },
    customerName: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    note: { type: String },
    paymentMethod: { type: String, required: true },
    status: {
        type: String,
        enum: ['pending', 'shipping', 'completed'],
        default: 'pending'  
    },

    createdAt: { type: Date, default: Date.now } // Thêm ngày tạo đơn hàng
});

module.exports = mongoose.model('Order', OrderSchema);
