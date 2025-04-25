const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    discountedPrice: {  // Giá sản phẩm khi có giảm giá
        type: Number
    },
    image: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    discounted: {  // Trường để xác định sản phẩm giảm giá
        type: Boolean,
        default: false
    },
    bestSeller: {  // Trường để xác định sản phẩm best seller
        type: Boolean,
        default: false
    },
    newArrival: {  // Trường để xác định sản phẩm mới nhập
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    productNumber: {
        type: Number, // Số sản phẩm (auto-increment)
        unique: true
    }
});

// Apply the auto-increment plugin to the custom field
productSchema.plugin(AutoIncrement, { inc_field: 'productNumber' });

// Cập nhật trường updatedAt mỗi khi sản phẩm được cập nhật
productSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Product', productSchema);
