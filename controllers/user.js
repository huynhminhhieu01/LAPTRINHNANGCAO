const Users = require("../models/user");
const Cart = require("../models/cart");
const Order = require("../models/order");

exports.getAccount = (req, res, next) => {
  var cartProduct;
  if (!req.session.cart) {
    cartProduct = null;
  } else {
    var cart = new Cart(req.session.cart);
    cartProduct = cart.generateArray();
  }
  const messageSucc = req.flash("success")[0];
  const messageError = req.flash("error")[0];
  Order.find({ user: req.user }).then(order => {
    res.render("account", {
      title: "Thông tin tài khoản",
      user: req.user,
      cartProduct: cartProduct,
      order: order,
      messageSucc: messageSucc,
      messageError:messageError
    });
  });
};

exports.getAccountChange = (req, res, next) => {
  var cartProduct;
  if (!req.session.cart) {
    cartProduct = null;
  } else {
    var cart = new Cart(req.session.cart);
    cartProduct = cart.generateArray();
  }
  res.render("account-change-info", {
    title: "Thay đổi thông tin tài khoản",
    user: req.user,
    cartProduct: cartProduct
  });
};

exports.postAccountChange = async (req, res, next) => {
  try {
    // Cập nhật thông tin người dùng
    req.user.fullName = req.body.fullName;
    req.user.email = req.body.email;
    req.user.address = req.body.address;
    req.user.phoneNumber = req.body.phoneNumber;

    // Lưu thay đổi
    await req.user.save();

    // Thông báo thành công
    req.flash('success', 'Thông tin tài khoản đã được cập nhật thành công.');

    res.redirect("/account");
  } catch (err) {
    req.flash('error', 'Có lỗi xảy ra, vui lòng thử lại.');
    res.redirect("/account-change-info");
  }
};
