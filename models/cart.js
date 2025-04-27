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

// Phương thức để thêm sản phẩm vào giỏ hàng
cartSchema.methods.add = function(item, id, qty) {
  const itemQty = qty ? Number(qty) : 1;
  let storeItem = this.items[id];

  if (!storeItem) {
    storeItem = this.items[id] = { 
      item: item, 
      qty: 0, 
      price: 0, 
      images: item.images?.[0] || '' 
    };
  }

  storeItem.qty += itemQty;
  storeItem.price = storeItem.item.price * storeItem.qty;
  this.totalPrice += storeItem.item.price * itemQty;
};

// Phương thức để lấy giỏ hàng dưới dạng mảng
cartSchema.methods.generateArray = function() {
  return Object.values(this.items);
};

module.exports = mongoose.model('Cart', cartSchema);
