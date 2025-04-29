const mongoose = require('mongoose');
const User = require('./models/user');  // Đảm bảo đường dẫn đúng tới mô hình User
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb://localhost:27017/ShopCongNghe', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    // Kiểm tra xem admin đã tồn tại chưa
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin đã tồn tại!');
      mongoose.disconnect();
      return;
    }

    // Tạo tài khoản admin mới
    const admin = new User({
      fullName: 'Admin User',
      username: 'admin123',
      email: 'admin@example.com',
      password: 'adminpassword', // Mật khẩu sẽ được mã hóa
      role: 'admin'
    });

    // Lưu tài khoản admin vào cơ sở dữ liệu
    await admin.save();
    console.log('Admin đã được tạo thành công!');
    mongoose.disconnect();
  })
  .catch(err => console.log(err));
