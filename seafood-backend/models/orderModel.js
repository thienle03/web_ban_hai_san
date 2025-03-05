const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }
    }],
    totalPrice: { type: Number, required: true },
    address: { type: String, required: true },
    paymentMethod: { type: String, required: true, enum: ['cod', 'bank'] },
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    note: { type: String },
    status: { type: String, default: 'pending', enum: ['pending', 'completed', 'cancelled'] },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);