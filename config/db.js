// db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/ShopCongNghe', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Đã kết nối MongoDB');
  } catch (err) {
    console.error('❌ Lỗi kết nối MongoDB:', err);
    process.exit(1);
  }
};

module.exports = connectDB;