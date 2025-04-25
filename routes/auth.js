const express = require('express');
const router = express.Router();
var passport = require("passport");
const authController = require('../controllers/authController');
const User = require('../controllers/user');

// Trang đăng nhập
router.get('/login', authController.renderLoginPage);
router.post('/login', authController.handleLogin);

// Đăng xuất
router.get('/logout', authController.handleLogout);

// Trang đăng ký
router.get('/register', authController.renderSignUpPage);
router.post('/register', authController.handleSignUp);

// Xác thực email
router.get('/verify-email', authController.renderVerifyEmailPage);
router.post('/verify-email', authController.handleVerifyEmail);

//xem thong tin tài khoản



module.exports = router;
