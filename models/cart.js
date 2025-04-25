const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }
    }],
    totalPrice: { type: Number, default: 0 },
});

// Thêm phương thức generateArray vào schema
cartSchema.methods.generateArray = function () {
    return this.items.map(item => {
        return {
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
        };
    });
};

module.exports = mongoose.model('Cart', cartSchema);
