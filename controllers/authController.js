const passport = require('passport');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const randomstring = require('randomstring');
const User = require('../models/user');
const Cart = require('../util/cart');

// Xử lý render trang đăng nhập
const renderLoginPage = (req, res) => {
  const cartProduct = req.session.cart ? new Cart(req.session.cart).generateArray() : [];
  
  res.render('login', {
    title: 'Đăng nhập',
    message: req.flash('error')[0],
    user: req.user,
    cartProduct: cartProduct
  });
};

// Xử lý đăng nhập
const handleLogin = (req, res, next) => {
  passport.authenticate('local-signin', {
    successReturnToOrRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
  })(req, res, next);
};

// Đăng xuất
const handleLogout = (req, res, next) => {
  req.session.cart = null;

  if (req.isAuthenticated()) {
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return next(err);
      }
      res.redirect('/');
    });
  } else {
    res.redirect('/');
  }
};

// Xử lý render trang đăng ký
const renderSignUpPage = (req, res) => {
  const cartProduct = req.session.cart ? new Cart(req.session.cart).generateArray() : [];
  
  res.render('register', {
    title: 'Đăng ký',
    message: req.flash('error')[0],
    user: req.user,
    cartProduct: cartProduct
  });
};

const handleSignUp = async (req, res, next) => {
  const { fullName, username, email, password } = req.body;
  console.log('Dữ liệu nhận được từ form:', req.body);

  try {
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      console.log('User đã tồn tại:', existingUser);
      req.flash('error', 'Username hoặc email đã được sử dụng');
      return res.redirect('/register');
    }

    const newUser = new User({
      fullName,
      username,
      email,
      password,
      isVerified: false,
      verify_token: randomstring.generate({ length: 10 })
    });

    await newUser.save();
    console.log('User mới đã được lưu:', newUser);

    req.login(newUser, (err) => {
      if (err) {
        console.error('Lỗi đăng nhập sau đăng ký:', err);
        return next(err);
      }
      return res.redirect('/verify-email');
    });

  } catch (err) {
    console.error('Lỗi khi đăng ký:', err);
    req.flash('error', 'Đã xảy ra lỗi khi đăng ký');
    res.redirect('/register');
  }
};

// Render trang xác thực email
const renderVerifyEmailPage = async (req, res) => {
  if (!req.user) return res.redirect('/login');

  res.render('verify-email', {
    title: 'Xác thực email',
    message: req.flash('error')[0],
    user: req.user,
    cartProduct: req.session.cart ? new Cart(req.session.cart).generateArray() : []
  });
};

// Xử lý xác thực email
const handleVerifyEmail = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      req.flash('error', 'User không tồn tại');
      return res.redirect('/verify-email');
    }

    if (req.body.token === user.verify_token) {
      user.isVerified = true;
      user.verify_token = undefined;
      await user.save();
      return res.redirect('/');
    }

    req.flash('error', 'Mã xác thực không hợp lệ');
    res.redirect('/verify-email');
  } catch (err) {
    console.error('Verify email error:', err);
    res.redirect('/verify-email');
  }
};

module.exports = {
  renderLoginPage,
  handleLogin,
  handleLogout,
  renderSignUpPage,
  handleSignUp,
  renderVerifyEmailPage,
  handleVerifyEmail
};
