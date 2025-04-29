const mongoose = require('mongoose');
const Product = require("../models/product");
const Category = require("../models/Category"); // Thêm dòng này
const PromoBanner = require("../models/PromoBanner");
const Order = require('../models/order');
const Cart = require("../models/cart");
const User = require("../models/user");

// Trang chủ
const getIndexProducts = async (req, res) => {
  try {
    const featuredProducts = await Product.find({ isFeatured: true }).populate('category');

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

    const newProductBanner = await Product.findOne({ isNew: true }).populate('category');
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

// Danh sách sản phẩm
const getProductList = async (req, res) => {
  try {
    const products = await Product.find().populate('category');
    res.render("product/list", {
      products
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Internal Server Error' });
  }
};
const getProductsByCategory = async (req, res) => {
  try {
    const { slug } = req.params;
    console.log('Đang tìm danh mục với tham số:', slug);

    // 1. Kiểm tra và chuẩn hóa tham số đầu vào
    const isObjectId = mongoose.Types.ObjectId.isValid(slug);
    let category;

    // 2. Tìm kiếm danh mục
    if (isObjectId) {
      // Trường hợp 1: Tham số là ObjectId
      category = await Category.findById(slug).lean();
      
      // Nếu tìm thấy bằng ID, chuyển hướng sang URL slug để thân thiện SEO
      if (category) {
        return res.redirect(301, `/categories/${category.slug}`);
      }
    } else {
      // Trường hợp 2: Tham số là slug
      category = await Category.findOne({ 
        slug: slug.toLowerCase() 
      }).lean();
    }

    // 3. Xử lý khi không tìm thấy danh mục
    if (!category) {
      console.error(`Không tìm thấy danh mục với tham số: ${slug}`);
      return res.status(404).render('error', {
        title: 'Không tìm thấy',
        message: 'Danh mục không tồn tại hoặc đã bị xóa',
        user: req.user || null
      });
    }

    console.log(`Đã tìm thấy danh mục: ${category.name} (${category._id})`);

    // 4. Lấy danh sách sản phẩm với phân trang
    const page = parseInt(req.query.page) || 1;
    const limit = 12; // Số sản phẩm mỗi trang
    const skip = (page - 1) * limit;

    const [products, totalProducts] = await Promise.all([
      Product.find({ category: category._id })
        .select('name price image slug discountPrice stock')
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      
      Product.countDocuments({ category: category._id })
    ]);

    const totalPages = Math.ceil(totalProducts / limit);

    console.log(`Tìm thấy ${products.length}/${totalProducts} sản phẩm`);

    // 5. Render kết quả
    res.render('product/category', {
      title: category.name,
      currentCategory: category,
      products,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      previousPage: page - 1,
      user: req.user || null,
      query: req.query.q || '' // Giữ lại tham số tìm kiếm nếu có
    });

  } catch (err) {
    console.error('Lỗi hệ thống:', err);
    res.status(500).render('error', {
      title: 'Lỗi server',
      message: 'Đã xảy ra lỗi khi tải danh mục sản phẩm',
      user: req.user || null
    });
  }
};
// Chi tiết sản phẩm
const getProductDetail = async (req, res) => {
  try {
    const { slugOrId } = req.params;
    
    // Kiểm tra xem tham số là ObjectId hợp lệ hay không
    const isObjectId = mongoose.Types.ObjectId.isValid(slugOrId);
    
    let product;
    
    if (isObjectId) {
      // Tìm bằng ID nếu là ObjectId hợp lệ
      product = await Product.findById(slugOrId)
        .populate('category', 'name slug')
        .lean();
    } else {
      // Tìm bằng slug nếu không phải ObjectId
      product = await Product.findOne({ slug: slugOrId.toLowerCase() })
        .populate('category', 'name slug')
        .lean();
    }

    if (!product) {
      return res.status(404).render('error', {
        title: 'Không tìm thấy',
        message: 'Sản phẩm không tồn tại hoặc đã bị xóa',
        user: req.user || null
      });
    }

    // Nếu truy cập bằng slug nhưng URL chứa ID, chuyển hướng sang URL thân thiện SEO
    if (isObjectId && product.slug) {
      return res.redirect(301, `/products/detail/${product.slug}`);
    }

    // Lấy sản phẩm liên quan (cùng danh mục)
    const relatedProducts = await Product.find({
      category: product.category._id,
      _id: { $ne: product._id }
    })
    .limit(4)
    .select('name price image slug')
    .lean();

    res.render('product/detail', {
      title: product.name,
      product,
      relatedProducts,
      user: req.user || null,
      canonicalUrl: `/products/detail/${product.slug || product._id}`
    });

  } catch (err) {
    console.error('Lỗi chi tiết sản phẩm:', err);
    res.status(500).render('error', {
      title: 'Lỗi hệ thống',
      message: 'Đã xảy ra lỗi khi tải chi tiết sản phẩm',
      user: req.user || null
    });
  }
};
// Giỏ hàng
const getCart = async (req, res) => {
  const sessionCart = req.session.cart || {};
  const items = [];
  let totalPrice = 0;

  for (const productId of Object.keys(sessionCart.items || {})) {
    const qty = sessionCart.items[productId].qty;

    try {
      const product = await Product.findById(productId).populate('category');
      if (!product) continue;

      const price = product.price * qty;
      totalPrice += price;

      items.push({ 
        product, 
        qty, 
        price,
        totalItemPrice: price.toLocaleString('vi-VN') 
      });
    } catch (err) {
      console.error("Lỗi khi load product trong giỏ:", err);
    }
  }

  res.render("shopping_cart", {
    title: "Giỏ hàng",
    items,
    totalPrice: totalPrice.toLocaleString('vi-VN'),
    user: req.user || null
  });
};

// Thêm vào giỏ hàng
 const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    
    // 1. Kiểm tra ID sản phẩm
    if (!productId) {
      req.flash('error_msg', 'Thiếu thông tin sản phẩm');
      return res.redirect('back');
    }

    // 2. Tìm sản phẩm
    const product = await Product.findById(productId);
    if (!product) {
      req.flash('error_msg', 'Sản phẩm không tồn tại');
      return res.redirect('back');
    }

    // 3. Khởi tạo giỏ hàng nếu chưa có
    if (!req.session.cart) {
      req.session.cart = { items: {}, totalQty: 0, totalPrice: 0 };
    }

    const cart = req.session.cart;

    // 4. Thêm/cập nhật sản phẩm
    if (cart.items[productId]) {
      cart.items[productId].qty += parseInt(quantity);
    } else {
      cart.items[productId] = {
        product: { 
          _id: product._id,
          name: product.name,
          price: product.price,
          image: product.image
        },
        qty: parseInt(quantity)
      };
    }

    // 5. Cập nhật tổng
    cart.totalQty += parseInt(quantity);
    cart.totalPrice += product.price * parseInt(quantity);

    req.flash('success_msg', `Đã thêm ${product.name} vào giỏ hàng`);
    return res.redirect('back');

  } catch (err) {
    console.error('Lỗi khi thêm vào giỏ:', err);
    req.flash('error_msg', 'Lỗi khi thêm vào giỏ hàng');
    return res.redirect('back');
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
const addOrder = async (req, res) => {
  try {
    const cart = req.session.cart ? new Cart(req.session.cart) : null;
    if (!cart || cart.isEmpty()) return res.redirect('/cart');
    
    // Tạo đơn hàng mới trong cơ sở dữ liệu
    const order = new Order({
      user: req.user._id,
      items: cart.generateArray(),
      totalPrice: cart.totalPrice,
      shippingAddress: req.body.address,
      phoneNumber: req.body.phoneNumber,
      status: 'pending',
      createdAt: new Date()
    });

    await order.save(); // Lưu đơn hàng vào DB

    // Xóa giỏ hàng sau khi thanh toán thành công
    req.session.cart = null;

    // Chuyển hướng đến trang xác nhận đơn hàng
    res.render('order-success', { 
      order: order, 
      user: req.user || null 
    });
  } catch (err) {
    console.error('Lỗi khi xử lý đơn hàng:', err);
    res.status(500).render('error', { message: 'Lỗi server' });
  }
};
const postAddOrder = async (req, res) => {
  try {
    const cart = req.session.cart ? new Cart(req.session.cart) : null;
    const { address, phoneNumber } = req.body;

    if (!cart || cart.isEmpty()) return res.redirect('/cart');
    
    const order = new Order({
      user: req.user._id,
      items: cart.generateArray(),
      totalPrice: cart.totalPrice,
      shippingAddress: address,
      phoneNumber: phoneNumber,
      status: 'pending'
    });

    await order.save(); // Lưu đơn hàng vào DB

    req.session.cart = {}; // Xóa giỏ hàng

    res.render('order-success', { 
      order: order,
      user: req.user || null 
    });
  } catch (err) {
    console.error('Lỗi khi xử lý đơn hàng:', err);
    res.status(500).render('error', { message: 'Lỗi server' });
  }
};


// Quản lý tài khoản
const getAccount = async (req, res) => {
  try {
    // Kiểm tra xem người dùng đã đăng nhập chưa
    if (!req.user) {
      req.flash('error_msg', 'Vui lòng đăng nhập để xem tài khoản.');
      return res.redirect('/login'); // Chuyển hướng người dùng nếu chưa đăng nhập
    }

    // Truy xuất thông tin người dùng từ cơ sở dữ liệu
    const user = req.user;

    // Lấy đơn hàng của người dùng
    const orders = await Order.find({ user: user._id }); // Truy vấn đơn hàng của người dùng

    // Render trang tài khoản với thông tin người dùng và đơn hàng
    res.render('account', {
      title: 'Thông tin tài khoản',
      user: user,
      orders: orders // Truyền đơn hàng vào view
    });

  } catch (err) {
    console.error('Lỗi khi tải trang tài khoản:', err);
    req.flash('error_msg', 'Lỗi khi tải thông tin tài khoản');
    res.redirect('/'); // Chuyển hướng về trang chủ nếu có lỗi
  }
};
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().populate('category');
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category');
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addProduct = async (req, res) => {
  try {
    // Validate category exists
    if (req.body.category) {
      const category = await Category.findById(req.body.category);
      if (!category) {
        return res.status(400).json({ error: 'Danh mục không tồn tại' });
      }
    }

    const newP = new Product(req.body);
    await newP.save();
    res.status(201).json(newP);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    // Validate category exists if provided
    if (req.body.category) {
      const category = await Category.findById(req.body.category);
      if (!category) {
        return res.status(400).json({ error: 'Danh mục không tồn tại' });
      }
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    ).populate('category');
    
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
const getCheckout = async (req, res) => {
  try {
    // Lấy giỏ hàng từ session
    const cart = req.session.cart || { items: {}, totalPrice: 0 };

    // Kiểm tra giỏ hàng trống
    if (Object.keys(cart.items).length === 0) {
      req.flash('error_msg', 'Giỏ hàng trống');
      return res.redirect('/cart');
    }

    // Kiểm tra lại giỏ hàng nếu có giá trị hợp lệ (optional but ensures data integrity)
    if (cart.totalPrice <= 0) {
      req.flash('error_msg', 'Giỏ hàng không có sản phẩm hợp lệ');
      return res.redirect('/cart');
    }

    // Render trang checkout với cart và KHÔNG truyền order
    res.render('checkout', {
      title: 'Thanh toán',
      cart: cart,
      user: req.user || null
      // Không truyền order ở đây vì đây là trang nhập thông tin
    });

  } catch (err) {
    console.error('Lỗi khi tải trang thanh toán:', err);
    req.flash('error_msg', 'Lỗi khi tải trang thanh toán');
    res.redirect('/cart');
  }
};

// Xử lý đặt hàng
const postCheckout = async (req, res) => {
  const { fullName, phone, address, paymentMethod } = req.body;
  const cart = req.session.cart || { items: {} };

  try {
    if (Object.keys(cart.items).length === 0) {
      req.flash('error_msg', 'Giỏ hàng trống');
      return res.redirect('/cart');
    }

    // Tạo đơn hàng mới
    const order = new Order({
      user: req.user._id,
      items: Object.values(cart.items),
      totalPrice: cart.totalPrice,
      shippingInfo: { fullName, phone, address },
      paymentMethod: paymentMethod,
      status: 'pending' // Trạng thái mặc định
    });

    // Tạo `orderNumber` nếu chưa có
    if (!order.orderNumber) {
      order.orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }

    // Lưu đơn hàng vào cơ sở dữ liệu
    const savedOrder = await order.save();

    // Xóa giỏ hàng trong session
    req.session.cart = { items: {}, totalPrice: 0 };

    // Chuyển hướng đến trang thành công
    res.redirect(`/order-success/${savedOrder._id}`);

  } catch (err) {
    console.error('Lỗi khi xử lý đơn hàng:', err);
    req.flash('error_msg', 'Lỗi khi xử lý đơn hàng');
    res.redirect('/checkout');
  }
};

const orderSuccess = async (req, res) => {
  try {
    const orderId = req.params.id; // Lấy ID đơn hàng từ tham số URL
    console.log('ID đơn hàng nhận được:', orderId);

    // Kiểm tra xem ID có hợp lệ không
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      req.flash('error_msg', 'ID đơn hàng không hợp lệ');
      return res.redirect('/'); // Chuyển hướng về trang chủ nếu ID không hợp lệ
    }

    // Tìm đơn hàng trong cơ sở dữ liệu theo ID
    const order = await Order.findById(orderId);
    console.log('Đơn hàng từ database:', order);

    // Kiểm tra nếu đơn hàng không tồn tại
    if (!order) {
      req.flash('error_msg', 'Không tìm thấy đơn hàng');
      return res.redirect('/user/orders'); // Quay lại trang đơn hàng của người dùng nếu không tìm thấy đơn hàng
    }

    // Render trang thành công với thông tin đơn hàng và người dùng
    res.render('order-success', {
      title: 'Đặt hàng thành công',
      order: order,
      user: req.user // Thông tin người dùng từ session
    });

  } catch (err) {
    console.error('Lỗi khi tải trang thành công:', err);
    req.flash('error_msg', 'Lỗi khi tải thông tin đơn hàng');
    res.redirect('/user/orders'); // Nếu có lỗi, quay lại trang đơn hàng của người dùng
  }
};
module.exports = {
  getIndexProducts,
  getProductList,
  getProductDetail,
  getProductsByCategory,
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
  , getCheckout,
  postCheckout,
  orderSuccess  
};