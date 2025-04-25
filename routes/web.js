var express = require("express");
var router = express.Router();
const productController = require("../controllers/product"); 
const Product = require("../models/product");
const Cart = require("../models/cart"); // Make sure to import Cart if you're using it



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
    totalPrice: cart.totalPrice 
  });
});

module.exports = router;