const express = require('express');
const router = express.Router();
var passport = require("passport");
const adminController = require('../controllers/adminController');
const { isAdmin } = require('../middleware/auth');
const ProductCategory = require('../models/Category');
const Product = require('../models/product');
const Order = require('../models/order');
const User = require('../models/user');
const randomstring = require('randomstring');
const Cart = require('../models/cart');

// Thêm multer và cấu hình upload file
const multer = require('multer');
const path = require('path');

// Cấu hình lưu trữ file
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, path.join(__dirname, '../public/uploads/products'));
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Khởi tạo middleware upload
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
  fileFilter: function(req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Chỉ chấp nhận file ảnh (jpeg, jpg, png, gif)'));
  }
});

// Dashboard
router.get('/dashboard', isAdmin, adminController.dashboard);

// Quản lý sản phẩm
router.get('/products', isAdmin, adminController.manageProducts);

// Quản lý đơn hàng
router.get('/orders', isAdmin, adminController.manageOrders);

// Cập nhật trạng thái đơn hàng
router.post('/admin/orders/:id/update-status', isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!order) {
      req.flash('error_msg', 'Đơn hàng không tồn tại');
      return res.redirect('/admin/orders');
    }
    
    req.flash('success_msg', 'Cập nhật trạng thái đơn hàng thành công');
    res.redirect(`/admin/orders/${order._id}`);
  } catch (err) {
    console.error('Lỗi khi cập nhật đơn hàng:', err);
    req.flash('error_msg', 'Lỗi khi cập nhật đơn hàng');
    res.redirect('/admin/orders');
  }
});

// Quản lý người dùng
router.get('/users', isAdmin, adminController.manageUsers);
router.get('/users/delete/:id', isAdmin, async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findByIdAndDelete(userId); // Xóa người dùng khỏi cơ sở dữ liệu

    if (!user) {
      req.flash('error_msg', 'Không tìm thấy người dùng');
      return res.redirect('/admin/users');
    }

    req.flash('success_msg', 'Người dùng đã được xóa thành công');
    res.redirect('/admin/users');
  } catch (err) {
    console.error('Lỗi khi xóa người dùng:', err);
    req.flash('error_msg', 'Đã xảy ra lỗi khi xóa người dùng');
    res.redirect('/admin/users');
  }
});
// Route POST để xử lý form thêm người dùng
router.get("/users/create", isAdmin, (req, res) => {
  res.render("admin/create-user", { title: "Thêm người dùng" });
});
router.post('/users/create', isAdmin, async (req, res) => {
  const { fullName, username, email, password, role } = req.body; // Lấy dữ liệu từ form

  try {
    // Kiểm tra nếu email hoặc username đã tồn tại
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      req.flash('error_msg', 'Username hoặc email đã được sử dụng.');
      return res.redirect('/admin/users/create'); // Quay lại trang tạo người dùng
    }

    // Tạo người dùng mới
    const newUser = new User({
      fullName,
      username,
      email,
      password,
      role,
      isVerified: false, // Chưa xác minh
      verify_token: randomstring.generate({ length: 10 }) // Tạo token xác minh
    });

    // Lưu người dùng vào cơ sở dữ liệu
    await newUser.save();

    req.flash('success_msg', 'Người dùng đã được thêm thành công.');
    res.redirect('/admin/users'); // Quay lại trang quản lý người dùng

  } catch (err) {
    console.error('Lỗi khi thêm người dùng:', err);
    req.flash('error_msg', 'Đã xảy ra lỗi khi thêm người dùng');
    res.redirect('/admin/users/create'); // Quay lại trang tạo người dùng
  }
});
// Route cho việc tạo sản phẩm
router.get('/products/create', isAdmin, async (req, res) => {
  try {
    const categories = await ProductCategory.find({});
    res.render('admin/createProduct', { 
      formData: {},
      categories: categories,       
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách danh mục:', error);
    res.status(500).render('error', { message: 'Đã xảy ra lỗi khi tải trang' });
  }
});

// Route POST cho việc tạo sản phẩm
router.post('/products/create', 
  isAdmin, 
  upload.single('image'), 
  async (req, res) => {
    try {
      if (!req.file) {
        throw new Error('Vui lòng tải lên hình ảnh');
      }

      // Đảm bảo file đã được lưu
      const imagePath = path.join('/uploads/products', req.file.filename);

      // Tạo sản phẩm với đường dẫn ảnh
      const product = await Product.create({
        name: req.body.name,
        price: req.body.price,
        image: imagePath,
        category: req.body.category, // Đảm bảo đã có category trong form
        quantity: req.body.quantity,
        status: req.body.status || 'pending' // Gán giá trị mặc định cho status
      });

      res.redirect('/admin/products');
    } catch (error) {
      const categories = await ProductCategory.find({});
      res.render('admin/createProduct', {
        formData: req.body,
        categories,
        errorMessage: error.message
      });
    }
  }
);

// Route GET để tạo người dùng




module.exports = router;
