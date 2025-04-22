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

        // Tìm giỏ hàng của người dùng
        let cart = await Cart.findOne({ userId });

        if (!cart) {
            // Nếu chưa có giỏ hàng, tạo mới
            cart = new Cart({
                userId,
                items: [],
                totalPrice: 0,
            });
        }

        // Kiểm tra sản phẩm đã có trong giỏ hàng chưa
        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

        if (itemIndex > -1) {
            // Nếu sản phẩm đã có, cập nhật số lượng và giá
            cart.items[itemIndex].quantity += quantity;
            cart.items[itemIndex].price = product.price * cart.items[itemIndex].quantity;
        } else {
            // Nếu sản phẩm chưa có, thêm mới
            cart.items.push({
                productId,
                quantity,
                price: product.price * quantity,
            });
        }

        // Cập nhật tổng giá trị giỏ hàng
        cart.totalPrice = cart.items.reduce((total, item) => total + item.price, 0);

        // Lưu giỏ hàng
        await cart.save();

        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi thêm vào giỏ hàng', error: error.message });
    }
};

module.exports = {
    addToCart,
};