const express = require("express");
const router = express.Router();
const productController = require("../controllers/product");
const Product = require("../models/product");
const { isAuthenticated, isAdmin } = require("../middleware/auth"); // Import đầy đủ middleware
const Order = require("../models/order");
// ======================
// SẢN PHẨM (Public)
// ======================
router.get("/", productController.getIndexProducts);
router.get('/products', productController.getProductList);
router.get('/products/detail/:slugOrId', productController.getProductDetail);
router.get('/categories/:slug', productController.getProductsByCategory);

// ======================
// GIỎ HÀNG
// ======================
router.get("/cart", isAuthenticated, productController.getCart);
router.post('/add-to-cart', async (req, res) => {
  const { productId, quantity } = req.body;

  try {
    // Validate input
    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Thông tin không hợp lệ' 
      });
    }

    // Tìm sản phẩm trong database
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Sản phẩm không tồn tại' 
      });
    }

    // Khởi tạo giỏ hàng nếu chưa có
    if (!req.session.cart) {
      req.session.cart = {
        items: {},
        totalQty: 0,
        totalPrice: 0
      };
    }

    const cart = req.session.cart;

    // Thêm/cập nhật sản phẩm vào giỏ hàng
    if (cart.items[productId]) {
      cart.items[productId].qty += quantity;
    } else {
      cart.items[productId] = {
        product: {
          _id: product._id,
          name: product.name,
          price: product.price,
          image: product.image
        },
        qty: quantity,
        price: product.price
      };
    }

    // Tính toán lại tổng giỏ hàng
    cart.totalQty = Object.values(cart.items).reduce((total, item) => total + item.qty, 0);
    cart.totalPrice = Object.values(cart.items).reduce(
      (total, item) => total + (item.price * item.qty), 0
    );

    // Lưu session
    req.session.save(err => {
      if (err) {
        console.error('Lỗi khi lưu session:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Lỗi hệ thống' 
        });
      }
      
      res.json({
        success: true,
        message: 'Đã thêm sản phẩm vào giỏ hàng',
        cartTotalQty: cart.totalQty
      });
    });

  } catch (error) {
    console.error('Lỗi khi xử lý giỏ hàng:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi hệ thống' 
    });
  }
});
router.get("/modify-cart", isAuthenticated, productController.modifyCart);
router.get("/delete-item/:id", isAuthenticated, productController.getDeleteItem);
router.get("/delete-cart", isAuthenticated, productController.getDeleteCart);

// ======================
// ĐƠN HÀNG
// ======================
router.get('/checkout', isAuthenticated, productController.getCheckout);
router.post('/checkout', isAuthenticated, productController.postCheckout);
router.get('/order-success/:id', isAuthenticated, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);  // Tìm đơn hàng theo ID
    if (!order) {
      req.flash('error_msg', 'Không tìm thấy đơn hàng');
      return res.redirect('/');
    }

    // Render trang order-success.ejs với thông tin đơn hàng
    res.render('order-success', {
      order: order  // Truyền thông tin đơn hàng vào view
    });

  } catch (err) {
    console.error('Lỗi khi tải đơn hàng:', err);
    req.flash('error_msg', 'Lỗi khi tải thông tin đơn hàng');
    res.redirect('/');
  }
});

// ======================
// ADMIN (Riêng admin)
// ======================
router.get('/dashboard', isAdmin, (req, res) => { // Chỉ admin
  res.render('dashboard', { 
    title: 'Dashboard',
    user: req.user 
  });
});

// ======================
// TÀI KHOẢN
// ======================
router.get('/account', 
  isAuthenticated,   
  productController.getAccount
);


module.exports = router;