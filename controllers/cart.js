const Cart = require('../models/cart');
const Product = require('../models/product');

// Thêm sản phẩm vào giỏ hàng
const addToCart = async (req, res) => {
    const { userId, productId, quantity } = req.body;

    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
        }

        // Kiểm tra giỏ hàng trong session
        let cart = req.session.cart;

        if (!cart) {
            cart = new Cart({
                userId,
                items: [],
                totalPrice: 0,
            });
            req.session.cart = cart; // Lưu giỏ hàng vào session
        }

        // Kiểm tra sản phẩm đã có trong giỏ hàng chưa
        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

        if (itemIndex > -1) {
            cart.items[itemIndex].quantity += quantity;
            cart.items[itemIndex].price = product.price * cart.items[itemIndex].quantity;
        } else {
            cart.items.push({
                productId,
                quantity,
                price: product.price * quantity,
            });
        }

        // Cập nhật tổng giá trị giỏ hàng
        cart.totalPrice = cart.items.reduce((total, item) => total + item.price, 0);

        // Lưu giỏ hàng vào session
        req.session.cart = cart;

        // Trả về giỏ hàng cập nhật
        res.status(200).json(cart);

    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi thêm vào giỏ hàng', error: error.message });
    }
};

module.exports = {
    addToCart,
};
