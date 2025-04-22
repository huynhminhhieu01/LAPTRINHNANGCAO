var express = require("express");
var router = express.Router();
const productController = require("../controllers/product"); 
const Product = require("../models/product"); // Import the Product model

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

// Route to display all products
router.get("/products", async (req, res) => {
  try {
    const products = await Product.find(); // Fetch all products from the database
    res.render("product/list", { products }); // Pass products to the view
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Route to display products by category
router.get("/products/:category", async (req, res) => {
  try {
    const category = req.params.category; // Get the category from the URL
    const products = await Product.find({ category }); // Fetch products matching the category
    res.render("product/list", { products }); // Pass products to the view
  } catch (err) {
    console.error("Error fetching products by category:", err);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
