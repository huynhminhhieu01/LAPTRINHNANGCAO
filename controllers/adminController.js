const Product = require('../models/product'); 
const Order = require('../models/order');
const User = require('../models/user');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const Category = require('../models/Category'); 
const fs = require('fs');

const dashboard = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments();

    // Render view với các thông tin tổng quan
    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      totalProducts,
      totalOrders,
      totalUsers,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi khi tải dữ liệu dashboard');
  }
};
const manageProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Lấy số trang từ query, mặc định là 1
    const limit = 10; // Giới hạn số sản phẩm mỗi trang
    const skip = (page - 1) * limit; // Tính số sản phẩm cần bỏ qua dựa trên trang hiện tại

    // Lấy tổng số sản phẩm trong cơ sở dữ liệu
    const totalProducts = await Product.countDocuments();
    
    // Lấy danh sách sản phẩm với phân trang và populate thông tin category
    const products = await Product.find()
      .skip(skip) // Bỏ qua số lượng sản phẩm đã hiển thị trước đó
      .limit(limit) // Giới hạn số sản phẩm mỗi trang
      .populate('category'); // Populates thông tin của category

    // Tính toán tổng số trang
    const totalPages = Math.ceil(totalProducts / limit);

    // Render view và truyền các dữ liệu cần thiết
    res.render('admin/manageProducts', {
      products,
      currentPage: page, 
      totalPages: totalPages
    });
  } catch (err) {
    console.error('Lỗi khi lấy danh sách sản phẩm:', err);
    res.status(500).send('Lỗi khi lấy danh sách sản phẩm');
  }
};

// Tạo sản phẩm mới
const createProduct = async (req, res) => {
  try {
    // Lấy danh sách danh mục từ database
    const categories = await Category.find(); // Lấy danh mục từ MongoDB

    // Nếu có lỗi khi lấy danh mục
    if (!categories || categories.length === 0) {
      return res.status(400).render('admin/createProduct', {
        error: 'Không có danh mục nào',
        formData: req.body,  // Giữ lại dữ liệu đã nhập vào form
        categories: [] // Truyền danh mục rỗng nếu không có danh mục nào
      });
    }

    // Render view và truyền vào các dữ liệu cần thiết
    res.render('admin/createProduct', {
      categories: categories,  // Truyền danh mục vào view
      formData: req.body // Truyền formData (dữ liệu đã nhập nếu có lỗi)
    });
  } catch (err) {
    console.error('Lỗi khi lấy danh mục:', err);
    res.status(500).render('admin/createProduct', {
      error: 'Đã xảy ra lỗi khi lấy danh mục',
      categories: [], // Truyền danh mục rỗng nếu có lỗi
      formData: req.body
    });
  }
};

const showCreateProductForm = async (req, res) => {
  try {
    const categories = await ProductCategory.find({});
    res.render('admin/createProduct', { 
      formData: {},
      categories
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { message: 'Lỗi server' });
  }
};
// Chỉnh sửa sản phẩm
const editProduct = async (req, res) => {
  const { name, price, description } = req.body;
  const image = req.file ? req.file.path : ''; // Nếu có hình ảnh thì lưu đường dẫn hình ảnh

  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).send('Sản phẩm không tồn tại');
    }

    // Cập nhật thông tin sản phẩm
    product.name = name;
    product.price = price;
    product.description = description;
    if (image) {
      product.image = image; // Cập nhật hình ảnh nếu có
    }

    await product.save();
    res.redirect('/admin/products');  // Quay lại trang quản lý sản phẩm
  } catch (err) {
    console.error(err);
    res.status(500).render('admin/editProduct', { 
      error: 'Lỗi khi cập nhật sản phẩm',
      product: req.body // Giữ lại dữ liệu đã nhập
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      req.flash('error', 'Sản phẩm không tồn tại');
      return res.redirect('/admin/products');
    }

    // Xóa file ảnh nếu có
    if (product.image && fs.existsSync(product.image)) {
      fs.unlinkSync(product.image);
    }

    await Product.deleteOne({ _id: req.params.id });
    req.flash('success', 'Xóa sản phẩm thành công');
    res.redirect('/admin/products');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Lỗi khi xóa sản phẩm');
    res.redirect('/admin/products');
  }
};


const manageOrders = async (req, res) => {
  try {
    // Truy vấn tất cả các đơn hàng và populate thông tin người dùng
    const orders = await Order.find()
      .populate({
        path: 'user',
        select: 'fullName email', // Chỉ lấy các trường cần thiết
        options: { lean: true } // Tối ưu hiệu suất
      })
      .sort({ createdAt: -1 }) // Sắp xếp theo ngày tạo giảm dần
      .lean(); // Chuyển sang plain object để tối ưu hiệu suất

    // Xử lý dữ liệu trước khi gửi đến view
    const processedOrders = orders.map(order => ({
      ...order,
      // Đảm bảo có trường createdAt, nếu không sẽ dùng ngày hiện tại
      createdAt: order.createdAt || new Date(),
      // Định dạng trước ngày tháng để tránh lỗi trong view
      formattedDate: (order.createdAt || new Date()).toLocaleDateString('vi-VN'),
      // Định dạng giá tiền
      formattedTotal: order.totalPrice?.toLocaleString('vi-VN') + 'đ' || '0đ',
      // Xử lý trường hợp user không tồn tại
      user: order.user || { fullName: 'Khách vãng lai', email: 'N/A' }
    }));

    // Gửi dữ liệu đã xử lý vào view
    res.render('admin/manageOrders', { 
      title: 'Quản lý đơn hàng',
      orders: processedOrders,
      currentPage: 'orders' // Có thể dùng để highlight menu active
    });
  } catch (err) {
    console.error('Lỗi khi tải đơn hàng:', err);
    req.flash('error_msg', 'Đã xảy ra lỗi khi tải danh sách đơn hàng');
    res.redirect('/admin/dashboard');
  }
};


const manageUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Lấy số trang từ URL, mặc định là 1
    const limit = 10; // Số item mỗi trang
    const skip = (page - 1) * limit;

    const totalUsers = await User.countDocuments();
    const totalPages = Math.ceil(totalUsers / limit);

    const users = await User.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.render('admin/manageUsers', {
      users,
      currentPage: page, // Thêm dòng này
      totalPages,       // Và dòng này
      totalUsers       // Có thể thêm nếu cần
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi khi tải danh sách người dùng');
  }
};
//
module.exports = {
  dashboard,
  manageProducts,
  createProduct,
  showCreateProductForm,
  editProduct,
  deleteProduct,
  manageOrders,
  manageUsers
};