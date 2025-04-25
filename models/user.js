const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); // Thêm crypto để tạo token

const userSchema = new mongoose.Schema({
  fullName: { 
    type: String, 
    required: [true, 'Họ và tên là bắt buộc'],
    trim: true,
    maxlength: [50, 'Họ và tên không được vượt quá 50 ký tự']
  },
  username: {
    type: String,
    required: [true, 'Tên đăng nhập là bắt buộc'],
    unique: true,             // 👈 Đảm bảo username là duy nhất
    trim: true,
    minlength: [3, 'Tên đăng nhập phải có ít nhất 3 ký tự'],
    maxlength: [20, 'Tên đăng nhập không được vượt quá 20 ký tự'],
    match: [/^[a-zA-Z0-9]+$/, 'Tên đăng nhập chỉ được chứa chữ cái và số'],
    index: true               // 👈 Tăng hiệu suất tìm kiếm
  },
  email: {
    type: String,
    required: [true, 'Email là bắt buộc'],
    unique: true,             // 👈 Đảm bảo email là duy nhất
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Vui lòng nhập email hợp lệ']
  },
  password: {
    type: String,
    required: [true, 'Mật khẩu là bắt buộc'],
    minlength: [8, 'Mật khẩu phải có ít nhất 8 ký tự'],
    select: false // Không trả về password khi query
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verify_token: {
    type: String // Thêm trường verify_token để lưu token xác thực
  },
  passwordChangedAt: Date, // Theo dõi khi user đổi mật khẩu
  passwordResetToken: String,
  passwordResetExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true // Không thể thay đổi
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true, // Tự động thêm createdAt và updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Middleware hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12); // Độ phức tạp cao hơn
    this.password = await bcrypt.hash(this.password, salt);
    
    if (!this.isNew) {
      this.passwordChangedAt = Date.now() - 1000; // Trừ 1s để đảm bảo token được tạo trước
    }
    next();
  } catch (err) {
    next(err);
  }
});

// Phương thức so sánh password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Kiểm tra nếu user đổi mật khẩu sau khi token được cấp
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Tạo token reset password
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 phút
  
  return resetToken;
};

module.exports = mongoose.model('User', userSchema);
