const Product = require("../models/product");
const PromoBanner = require("../models/PromoBanner");
const Cart = require("../models/cart");
const mongoose = require('mongoose');      
// Trang chủ
const getIndexProducts = async (req, res) => {
  try {
    const featuredProducts = await Product.find({ isFeatured: true });

    const news = [
      { title: "Chip AI mới ra mắt", image: "/images/news1.jpg" },
      { title: "Điện thoại gập 2025", image: "/images/news2.jpg" },
      { title: "Laptop siêu mỏng", image: "/images/news3.jpg" },
    ];

    const brands = [
      { name: "Apple", logo: "/images/brands/apple.png" },
      { name: "Samsung", logo: "/images/brands/samsung.png" },
      { name: "Asus", logo: "/images/brands/asus.png" },
      { name: "Dell", logo: "/images/brands/dell.png" },
      { name: "HP", logo: "/images/brands/hp.png" },
      { name: "Lenovo", logo: "/images/brands/lenovo.png" },
    ];

    const newProductBanner = await Product.findOne({ isNew: true });
    const promoBanner = await PromoBanner.findOne({ active: true });
    res.render("index", {
      title: "Trang chủ",
      featuredProducts,
      user: req.user || null,
      session: req.session,
      news,
      brands,
      newProductBanner,
      promoBanner,
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Internal Server Error' });
  }
};
const getProductList = async (req, res) => {
    try {
      const products = await Product.find(); // Lấy tất cả sản phẩm
  
      res.render("product/list", {
        products  // Chỉ truyền danh sách sản phẩm vào view
      });
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { message: 'Internal Server Error' });
    }
  };
// Chi tiết sản phẩm// Controller lấy chi tiết sản phẩm
const getProductDetail = async (req, res) => {
  try {
    const param = req.params.param;  // Tham số truyền vào (productId)
    
    if (mongoose.isValidObjectId(param)) {
      const product = await Product.findById(param);
      if (!product) {
        return res.status(404).render('error', { message: 'Sản phẩm không tồn tại' });
      }

      const relatedProducts = await Product.find({
        category: product.category,
        _id: { $ne: product._id }
      }).limit(4);

      res.render("product/detail", {
        title: product.name,
        product,
        relatedProducts
      });
    } else {
      // Nếu param là tên danh mục, tìm các sản phẩm trong danh mục đó
      const products = await Product.find({ category: param });
      res.render("product/list", {
        title: `Danh mục: ${param}`,
        products,
        category: param
      });
    }
  } catch (error) {
    console.error('Lỗi khi lấy sản phẩm:', error);
    res.status(500).render('error', { message: 'Đã xảy ra lỗi khi tải sản phẩm' });
  }
};

// Giỏ hàng


const getCart = async (req, res) => {
  const sessionCart = req.session.cart || {};  // Giỏ hàng từ session
  const items = [];  // Danh sách các sản phẩm trong giỏ
  let totalPrice = 0;  // Tổng giá trị của giỏ hàng

  // Duyệt qua các sản phẩm trong giỏ hàng
  for (const productId of Object.keys(sessionCart.items || {})) {
      const qty = sessionCart.items[productId].qty;

      try {
          // Truy vấn sản phẩm từ MongoDB
          const product = await Product.findById(productId);
          if (!product) continue;  // Nếu không tìm thấy sản phẩm

          const price = product.price * qty;
          totalPrice += price;

          // Pushing correct structure to items
          items.push({ product, qty, price });
      } catch (err) {
          console.error("Lỗi khi load product trong giỏ:", err);
      }
  }

  // Truyền items và totalPrice vào view
  res.render("shopping_cart", {
      title: "Giỏ hàng",
      items,  // Truyền biến items vào view
      totalPrice  // Truyền tổng giá trị vào view
  });
};

// Thêm vào giỏ hàng
const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    // Ensure user is logged in
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Vui lòng đăng nhập' 
      });
    }

    // Fetch the product by ID
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Sản phẩm không tồn tại' 
      });
    }

    // Initialize the cart if it doesn't exist in session
    if (!req.session.cart) {
      req.session.cart = {
        items: {},
        totalQty: 0,
        totalPrice: 0,
        generateArray: function() {
          return Object.values(this.items);
        }
      };
    }

    const cart = req.session.cart;
    const qty = parseInt(quantity) || 1;

    // Add or update the product in the cart
    if (cart.items[productId]) {
      cart.items[productId].qty += qty;
    } else {
      cart.items[productId] = {
        product: product,
        qty: qty
      };
    }

    // Update totals
    cart.totalQty += qty;
    cart.totalPrice += product.price * qty;

    res.json({ 
      success: true, 
      cart: cart 
    });
  } catch (error) {
    console.error('Lỗi khi thêm vào giỏ hàng:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server' 
    });
  }
};
// Sửa giỏ hàng
const modifyCart = (req, res) => {
  const { productId, action, qty } = req.query;
  let cart = req.session.cart ? new Cart(req.session.cart) : new Cart({});
  if (action === 'add') cart.increment(productId);
  else if (action === 'remove') cart.remove(productId);
  else if (action === 'update') cart.update(productId, parseInt(qty, 10));
  req.session.cart = cart;
  res.redirect('/cart');
};

// Xóa giỏ hàng
const getDeleteCart = (req, res) => {
  req.session.cart = {};
  res.redirect('/cart');
};

// Xóa một item
const getDeleteItem = (req, res) => {
  const productId = req.params.id;
  let cart = req.session.cart || {};
  if (cart.items[productId]) {
    cart.totalQty -= cart.items[productId].qty;
    cart.totalPrice -= cart.items[productId].price;
    delete cart.items[productId];
  }
  req.session.cart = cart;
  res.redirect("/cart");
};

// Đặt hàng
const addOrder = (req, res) => {
  const cart = req.session.cart ? new Cart(req.session.cart) : null;
  if (!cart || cart.isEmpty()) return res.redirect('/cart');
  res.render('add-order', { cart: cart.generateArray(), totalPrice: cart.totalPrice });
};

const postAddOrder = (req, res) => {
  const cart = req.session.cart ? new Cart(req.session.cart) : null;
  const { address, phoneNumber } = req.body;
  if (!cart || cart.isEmpty()) return res.redirect('/cart');
  // TODO: Lưu đơn hàng vào DB nếu cần
  req.session.cart = {};
  res.render('order-success', { address, phoneNumber });
};

// Quản lý tài khoản
const getAccount = (req, res) => {
  const cart = req.session.cart ? new Cart(req.session.cart) : null;
  res.render('account', { user: req.user, cart: cart ? cart.generateArray() : [], totalPrice: cart ? cart.totalPrice : 0 });
};

// ===== API CRUD =====
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addProduct = async (req, res) => {
  try {
    const newP = new Product(req.body);
    await newP.save();
    res.status(201).json(newP);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const del = await Product.findByIdAndDelete(req.params.id);
    if (!del) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    res.json({ message: 'Xóa thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getIndexProducts,
    getProductList,
  getProductDetail,
  getCart,
  addToCart,
  modifyCart,
  getDeleteCart,
  getDeleteItem,
  addOrder,
  postAddOrder,
  getAccount,
  getAllProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct
};
