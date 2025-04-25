const User = require('../models/user');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator'); 

module.exports = function(passport) {
  // Serialize/Deserialize
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Local Sign-In Strategy (Đăng nhập)
  passport.use('local-signin', new LocalStrategy(
    {
      usernameField: 'username',
      passwordField: 'password',
      passReqToCallback: true // Để truy cập flash messages
    },
    async (req, username, password, done) => {
      try {
        // 1. Tìm user
        const user = await User.findOne({ username }).select('+password')
        
        if (!user) {
          return done(null, false, { 
            message: 'Sai tên đăng nhập hoặc mật khẩu.' 
          });
        }

        // 2. Kiểm tra tài khoản bị khóa
        if (user.isLock) {
          return done(null, false, { 
            message: 'Tài khoản đã bị khoá.' 
          });
        }

        // 3. Xác thực mật khẩu
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
          return done(null, false, { 
            message: 'Sai tên đăng nhập hoặc mật khẩu.' 
          });
        }

        // 4. Đăng nhập thành công
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  ));

  // Local Sign-Up Strategy (Đăng ký)
  passport.use('local-signup', new LocalStrategy(
    {
      usernameField: 'username',
      passwordField: 'password',
      passReqToCallback: true
    },
    async (req, username, password, done) => {
      try {
        // 1. Validation cơ bản
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          const messages = errors.array().map(e => e.msg);
          return done(null, false, { message: messages.join(' ') });
        }

        // 2. Kiểm tra username tồn tại
        const existingUser = await User.findOne({ username });
        if (existingUser) {
          return done(null, false, { 
            message: 'Tên đăng nhập đã tồn tại!' 
          });
        }

        // 3. Kiểm tra email hợp lệ và tồn tại
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(req.body.email)) {
          return done(null, false, { 
            message: 'Địa chỉ email không hợp lệ!' 
          });
        }

        const existingEmail = await User.findOne({ email: req.body.email });
        if (existingEmail) {
          return done(null, false, { 
            message: 'Email đã được sử dụng!' 
          });
        }

        // 4. Kiểm tra mật khẩu
        if (password.length < 6) {
          return done(null, false, { 
            message: 'Mật khẩu phải có ít nhất 6 ký tự!' 
          });
        }

        if (password !== req.body.password2) {
          return done(null, false, { 
            message: 'Mật khẩu xác nhận không khớp!' 
          });
        }

        // 5. Hash mật khẩu và tạo user
        const hashedPassword = await bcrypt.hash(password, 12);
        
        const newUser = new User({
          username,
          password: hashedPassword,
          email: req.body.email,
          fullName: req.body.fullName,
          isAuthenticated: false // Chưa xác thực email`
        });

        await newUser.save();
        return done(null, newUser);

      } catch (err) {
        return done(err);
      }
    }
  ));
};