const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const productSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    index: true
  },
    price: {
        type: Number,
        required: true,
        min: [0, 'Giá không thể nhỏ hơn 0']
    },
    discountedPrice: {  // Giá sản phẩm khi có giảm giá
        type: Number,
        validate: {
            validator: function(value) {
                return value <= this.price;  // Giá giảm không thể cao hơn giá gốc
            },
            message: 'Giá giảm không thể cao hơn giá gốc'
        }
    },
    image: {
        type: String,
        required: true
    },
    category: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Category', // Tham chiếu đến model Category
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
  if (this.isModified('name') || !this.slug) {
    const baseSlug = slugify(this.name, {
      lower: true,
      strict: true,
      locale: 'vi',       // hỗ trợ tiếng Việt
      remove: /[*+~.()'"!:@]/g
    });
    
    // Xử lý trùng slug
    this.constructor.find({ slug: new RegExp(`^${baseSlug}`, 'i') })
      .then((products) => {
        if (products.length > 0) {
          this.slug = `${baseSlug}-${products.length + 1}`;
        } else {
          this.slug = baseSlug;
        }
        next();
      })
      .catch(next);
  } else {
    next();
  }
});
module.exports = mongoose.model('Product', productSchema);