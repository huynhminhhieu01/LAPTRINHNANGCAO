const Cart = require('../models/cart');
const Product = require('../models/product');

// Thêm sản phẩm vào giỏ hàng
const addToCart = async (req, res) => {
    const { userId, productId, quantity } = req.body;

    try {
        // Lấy thông tin sản phẩm
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
        }

        // Tìm giỏ hàng của người dùng trong session
        let cart = req.session.cart;

        if (!cart) {
            // Nếu giỏ hàng chưa tồn tại, tạo mới giỏ hàng
            cart = new Cart({
                userId,
                items: [],
                totalPrice: 0,
            });
            req.session.cart = cart;  // Lưu giỏ hàng vào session
        }

        // Kiểm tra sản phẩm đã có trong giỏ hàng chưa
        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

        if (itemIndex > -1) {
            // Nếu sản phẩm đã có, cập nhật số lượng và giá
            cart.items[itemIndex].quantity += quantity;
            cart.items[itemIndex].price = product.price * cart.items[itemIndex].quantity;
        } else {
            // Nếu sản phẩm chưa có, thêm mới vào giỏ
            cart.items.push({
                productId,
                quantity,
                price: product.price * quantity,
            });
        }

        // Cập nhật tổng giá trị giỏ hàng
        cart.totalPrice = cart.items.reduce((total, item) => total + item.price, 0);

        // Lưu giỏ hàng trong session
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