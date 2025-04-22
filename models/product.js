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
    image: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
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
        type: Number, // Use a custom field for auto-increment
        unique: true
    }
});

// Apply the auto-increment plugin to the custom field
productSchema.plugin(AutoIncrement, { inc_field: 'productNumber' });

module.exports = mongoose.model('Product', productSchema);