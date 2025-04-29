const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  items: [{
    product: { 
      _id: { type: mongoose.Schema.Types.ObjectId, required: true },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      image: { type: String }
    },
    qty: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  totalPrice: { 
    type: Number, 
    required: true 
  },
  shippingInfo: {
    fullName: { 
      type: String, 
      required: true 
    },
    phone: { 
      type: String, 
      required: true 
    },
    address: { 
      type: String, 
      required: true 
    }
  },
  paymentMethod: { 
    type: String, 
    required: true 
  },
  orderNumber: { 
    type: String, 
    required: true, 
    unique: true // Đảm bảo orderNumber là duy nhất
  },
  status: { 
    type: String, 
    default: 'pending', 
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] 
  }
}, { timestamps: true });

// Pre-save hook để tự động tạo orderNumber duy nhất
orderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    // Tạo giá trị duy nhất cho orderNumber (ORD-<timestamp>-<random_number>)
    this.orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
