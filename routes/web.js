const express = require("express");
const router = express.Router();

const {
  getProductList,
    getIndexProducts,
    getProductDetail,
    getCart,
    addToCart,
    modifyCart,
    getDeleteCart,
    getDeleteItem,
    addOrder,
    postAddOrder,
    getAccount
} = require("../controllers/product");

// ======================
// SẢN PHẨM
// ======================
router.get("/", getIndexProducts);
router.get('/products/:param', getProductDetail);
router.get('/products', getProductList);
// ======================
// GIỎ HÀNG
// ======================
router.get("/cart", getCart);
router.post('/add-to-cart', addToCart);
router.get("/modify-cart", modifyCart);
router.get("/delete-item/:id", getDeleteItem);
router.get("/delete-cart", getDeleteCart);

// ======================
// ĐƠN HÀNG
// ======================
router.get("/checkout", addOrder);
router.post("/checkout", postAddOrder);

// ======================
// TÀI KHOẢN NGƯỜI DÙNG
// ======================
router.get("/account", getAccount);

module.exports = router;
