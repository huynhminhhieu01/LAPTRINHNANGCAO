const Users = require("../models/user");
const Cart = require("../models/cart");

const getAccount = async (req, res) => {
  try {
    // Kiểm tra xem người dùng đã đăng nhập chưa
    if (!req.user) {
      req.flash('error_msg', 'Vui lòng đăng nhập để xem tài khoản.');
      return res.redirect('/login'); // Chuyển hướng người dùng nếu chưa đăng nhập
    }

    // Truy xuất thông tin người dùng từ cơ sở dữ liệu
    const user = req.user;

    // Nếu cần, lấy thêm thông tin từ cơ sở dữ liệu (ví dụ: đơn hàng, lịch sử mua hàng...)
    // const orders = await Order.find({ user: user._id });

    // Render trang tài khoản với thông tin người dùng
    res.render('account', {
      title: 'Thông tin tài khoản',
      user: user,
      // orders: orders // Nếu cần hiển thị thông tin đơn hàng
    });
  } catch (err) {
    console.error('Lỗi khi tải trang tài khoản:', err);
    req.flash('error_msg', 'Lỗi khi tải thông tin tài khoản');
    res.redirect('/'); // Chuyển hướng về trang chủ nếu có lỗi
  }
};
const getAccountChange = (req, res, next) => {
  try {
    // Lấy thông tin giỏ hàng từ session nếu có
    let cartProduct = null;
    if (req.session.cart) {
      const cart = new Cart(req.session.cart);
      cartProduct = cart.generateArray(); // Lấy danh sách sản phẩm trong giỏ hàng
    }

    // Render trang thay đổi thông tin tài khoản với thông tin người dùng và giỏ hàng (nếu có)
    res.render("account-change-info", {
      title: "Thay đổi thông tin tài khoản",
      user: req.user, // Truyền thông tin người dùng vào view
      cartProduct: cartProduct // Truyền thông tin giỏ hàng vào view (nếu có)
    });
  } catch (err) {
    console.error('Lỗi khi tải trang thay đổi thông tin tài khoản:', err);
    req.flash('error_msg', 'Lỗi khi tải trang thay đổi thông tin');
    res.redirect('/'); // Chuyển hướng về trang chủ nếu có lỗi
  }
};

const postAccountChange = async (req, res, next) => {
  try {
    // Kiểm tra xem người dùng đã đăng nhập chưa
    if (!req.user) {
      req.flash('error_msg', 'Vui lòng đăng nhập để thay đổi thông tin tài khoản.');
      return res.redirect('/login'); // Chuyển hướng nếu người dùng chưa đăng nhập
    }

    // Cập nhật thông tin người dùng từ form
    const { fullName, email, address, phoneNumber } = req.body;
    req.user.fullName = fullName;
    req.user.email = email;
    req.user.address = address;
    req.user.phoneNumber = phoneNumber;

    // Lưu thông tin người dùng sau khi cập nhật
    await req.user.save();

    // Thông báo thành công và chuyển hướng đến trang tài khoản
    req.flash('success', 'Thông tin tài khoản đã được cập nhật thành công.');
    res.redirect("/account");
  } catch (err) {
    // Xử lý lỗi khi cập nhật thông tin người dùng
    console.error('Lỗi khi cập nhật thông tin tài khoản:', err);
    req.flash('error_msg', 'Có lỗi xảy ra, vui lòng thử lại.');
    res.redirect("/account-change-info"); // Quay lại trang thay đổi thông tin
  }
};

module.exports = {
  getAccount,
  getAccountChange,
  postAccountChange
};