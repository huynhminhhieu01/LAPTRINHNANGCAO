const express = require('express');
const router = express.Router();
const Product = require('../models/product');

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
  
      res.render('index', {
        title: 'Trang chủ',
        featuredProducts,
        news,
        brands
      });
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { message: 'Internal Server Error' });
    }
  };

// Chi tiết sản phẩm
const getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.productId);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.render('product-detail', { product });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// TODO: Định nghĩa các hàm sau cho đúng
const getSearch = (req, res) => {
    const searchQuery = req.query.q || ''; // Lấy từ khóa tìm kiếm từ query string
    Product.find({ name: new RegExp(searchQuery, 'i') }) // Tìm kiếm sản phẩm theo tên
        .then(products => {
            res.render('search-results', { products, searchQuery });
        })
        .catch(err => {
            res.status(500).json({ message: err.message });
        });
};
const getCart = (req, res) => {
    const cart = req.session.cart ? req.session.cart : {}; // Lấy giỏ hàng từ session
    res.render('shopping_cart', { cart }); // Render trang giỏ hàng với dữ liệu giỏ hàng
};
const addToCart = (req, res) => {
    const productId = req.params.productId; // Lấy ID sản phẩm từ URL
    const cart = req.session.cart ? req.session.cart : {}; // Lấy giỏ hàng từ session
    if (!cart[productId]) {
        cart[productId] = { qty: 0 }; // Nếu sản phẩm chưa có trong giỏ hàng, khởi tạo số lượng là 0
    }
    cart[productId].qty++; // Tăng số lượng sản phẩm trong giỏ hàng
    req.session.cart = cart; // Cập nhật giỏ hàng trong session
    res.redirect('/shopping_cart'); // Chuyển hướng về trang giỏ hàng
};
const modifyCart = (req, res) => {
    const productId = req.query.productId; // Lấy ID sản phẩm từ query string
    const action = req.query.action; // Lấy hành động từ query string (thêm, giảm, xóa)
    const cart = req.session.cart ? req.session.cart : {}; // Lấy giỏ hàng từ session

    if (action === 'add') {
        if (!cart[productId]) {
            cart[productId] = { qty: 0 }; // Nếu sản phẩm chưa có trong giỏ hàng, khởi tạo số lượng là 0
        }
        cart[productId].qty++; // Tăng số lượng sản phẩm trong giỏ hàng
    } else if (action === 'remove') {
        if (cart[productId]) {
            delete cart[productId]; // Xóa sản phẩm khỏi giỏ hàng
        }
    } else if (action === 'update') {
        const newQty = parseInt(req.query.qty); // Lấy số lượng mới từ query string
        if (cart[productId]) {
            cart[productId].qty = newQty; // Cập nhật số lượng sản phẩm trong giỏ hàng
        }
    }

    req.session.cart = cart; // Cập nhật giỏ hàng trong session
    res.redirect('/shopping_cart'); // Chuyển hướng về trang giỏ hàng
};
const addOrder = (req, res) => {
    const cart = req.session.cart ? req.session.cart : {}; // Lấy giỏ hàng từ session
    if (Object.keys(cart).length === 0) {
        return res.redirect('/shopping_cart'); // Nếu giỏ hàng rỗng, chuyển hướng về trang giỏ hàng
    }
    res.render('add-order', { cart }); // Render trang thêm đơn hàng với dữ liệu giỏ hàng
};
const postAddOrder = (req, res) => {
    const cart = req.session.cart ? req.session.cart : {};
    const address = req.body.address;
    const phoneNumber = req.body.phoneNumber;

    if (Object.keys(cart).length === 0) {
        return res.redirect('/shopping_cart');
    }

    // Ở đây bạn có thể lưu đơn hàng vào database, hoặc tạm in ra console
    console.log("Order received:", {
        address,
        phoneNumber,
        cart
    });

    // Sau khi xử lý xong đơn hàng, xóa giỏ hàng
    req.session.cart = {};

    // Phản hồi cho client
    res.render('order-success', {
        address,
        phoneNumber
    });
};
const getDeleteCart = (req, res) => {
    req.session.cart = {}; // Xóa giỏ hàng trong session
    res.redirect('/shopping_cart'); // Chuyển hướng về trang giỏ hàng
};
const getDeleteItem = (req, res) => {
    const productId = req.params.productId; // Lấy ID sản phẩm từ URL
    const cart = req.session.cart ? req.session.cart : {}; // Lấy giỏ hàng từ session
    if (cart[productId]) {
        delete cart[productId]; // Xóa sản phẩm khỏi giỏ hàng
    }
    req.session.cart = cart; // Cập nhật giỏ hàng trong session
    res.redirect('/shopping_cart'); // Chuyển hướng về trang giỏ hàng
};
const mergeCart = (req, res) => {
    const sessionCart = req.session.cart ? req.session.cart : {}; // Lấy giỏ hàng từ session
    const cookieCart = req.cookies.cart ? JSON.parse(req.cookies.cart) : {}; // Lấy giỏ hàng từ cookie

    // Gộp giỏ hàng từ session và cookie
    for (const productId in cookieCart) {
        if (sessionCart[productId]) {
            sessionCart[productId].qty += cookieCart[productId].qty; // Cộng dồn số lượng sản phẩm
        } else {
            sessionCart[productId] = cookieCart[productId]; // Thêm sản phẩm mới vào giỏ hàng
        }
    }

    req.session.cart = sessionCart; // Cập nhật giỏ hàng trong session
    res.clearCookie('cart'); // Xóa cookie giỏ hàng
    res.redirect('/shopping_cart'); // Chuyển hướng về trang giỏ hàng
};

const addProduct = (req, res) => {
    const { name, description, price, image, category } = req.body;

    // Kiểm tra xem dữ liệu có hợp lệ không
    if (!name || !description || !price || !image || !category) {
        return res.status(400).send('Missing required fields');
    }

    const newProduct = new Product({ name, description, price, image, category });

    newProduct.save()
        .then(() => {
            console.log("Product added:", newProduct);
            res.status(201).send('Product added successfully');
        })
        .catch((err) => {
            console.error("Error adding product:", err);
            res.status(500).send('Error adding product: ' + err.message);
        });
};
const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find();  // Lấy tất cả sản phẩm từ MongoDB
        res.json(products);  // Trả về dữ liệu sản phẩm dưới dạng JSON
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Lấy chi tiết sản phẩm theo ID
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.productId); // Tìm sản phẩm theo ID
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);  // Trả về thông tin sản phẩm
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Cập nhật thông tin sản phẩm
const updateProduct = async (req, res) => {
    const { productId } = req.params;
    const { name, description, price, image, category } = req.body;

    try {
        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            { name, description, price, image, category },
            { new: true } // Trả về sản phẩm đã cập nhật
        );
        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(updatedProduct);  // Trả về sản phẩm sau khi cập nhật
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
// Xóa sản phẩm theo ID
const deleteProduct = async (req, res) => {
    const { productId } = req.params;

    try {
        const deletedProduct = await Product.findByIdAndDelete(productId); // Xóa sản phẩm
        if (!deletedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json({ message: 'Product deleted successfully' }); // Trả về thông báo xóa thành công
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getIndexProducts,
    getProduct,
    getSearch,
    getCart,
    addToCart,
    modifyCart,
    addOrder,
    postAddOrder,
    getDeleteCart,
    getDeleteItem,
    mergeCart,
    addProduct,
    updateProduct,
    getAllProducts,
    getProductById,
    deleteProduct
};