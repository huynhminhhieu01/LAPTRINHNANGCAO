var express = require("express");
var router = express.Router();
const productController = require("../controllers/product"); 
const Product = require("../models/product");
const Cart = require("../models/cart");

// Product routes
router.get("/", productController.getIndexProducts); 
router.get("/product/:productId", productController.getProduct); 
router.get("/search", productController.getSearch); 
router.get("/shopping_cart", productController.getCart); 
router.get("/add-to-cart/:productId", productController.addToCart);
router.get("/modify-cart", productController.modifyCart);
router.get("/add-order", productController.addOrder);
router.post("/add-order", productController.postAddOrder);
router.get("/delete-cart", productController.getDeleteCart); 
router.get("/delete-item/:productId", productController.getDeleteItem); 
router.get("/merge-cart", productController.mergeCart);
router.get('/get/products', productController.getAllProducts);
router.get('/get/:productId', productController.getProductById);
router.post('/add/products', productController.addProduct);
router.put('/put/:productId', productController.updateProduct);
router.delete('/delete/:productId', productController.deleteProduct);

// Product listing routes
router.get("/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.render("product/list", { products });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Category-specific products
router.get("/products/:category", async (req, res) => {
  try {
    const category = req.params.category;
    const products = await Product.find({ category });
    res.render("product/list", { products });
  } catch (err) {
    console.error("Error fetching products by category:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Shopping cart
router.get("/cart", (req, res) => {
  const cart = req.session.cart || { items: {}, totalItems: 0, totalPrice: 0 };
  const cartInstance = new Cart(cart);
  res.render("cart", { 
    cart: cartInstance.generateArray(), 
    totalPrice: cartInstance.totalPrice 
  });
});

// Account route (Xem thông tin user)
router.get('/account', (req, res) => {
  try {
    if (!req.session.cart) {
      return res.render('account', { products: [], totalPrice: 0 });
    }
    const cart = new Cart(req.session.cart);
    const products = cart.generateArray();

    res.render('account', { products, totalPrice: cart.totalPrice });
  } catch (err) {
    console.error("Error rendering account:", err);
    res.status(500).send("Internal Server Error");
  }
});
router.get("/cart", async (req, res) => {
  const cart = req.session.cart || { items: {}, totalItems: 0, totalPrice: 0 };
  const cartInstance = new Cart(cart);

  // Nếu productId là ObjectID của sản phẩm, sử dụng populate để lấy thông tin sản phẩm
  const cartItems = cartInstance.generateArray();
  const productIds = cartItems.map(item => item.productId); // Lấy tất cả productId

  try {
    // Lấy sản phẩm từ DB theo productId
    const products = await Product.find({ '_id': { $in: productIds } });

    // Đảm bảo mỗi item trong cart có đầy đủ thông tin sản phẩm
    cartItems.forEach(item => {
      const product = products.find(p => p._id.toString() === item.productId.toString());
      item.product = product; // Gán đầy đủ thông tin sản phẩm vào item
    });

    res.render("cart", { 
      cart: cartItems, 
      totalPrice: cartInstance.totalPrice 
    });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Route để hiển thị chi tiết sản phẩm
router.get("/product/:productId", async (req, res) => {
  try {
    // Tìm sản phẩm trong cơ sở dữ liệu theo ID
    const product = await Product.findById(req.params.productId);
    
    if (!product) {
      return res.status(404).render("product/notfound", { message: "Sản phẩm không tồn tại." });
    }

    res.render("product/detail", { product });
  } catch (err) {
    console.error("Error fetching product:", err);
    res.status(500).send("Lỗi khi lấy thông tin sản phẩm");
  }
});
module.exports = router;
