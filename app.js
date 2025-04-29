// ======================
// 1. Các thư viện cần thiết
// ======================

require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const passport = require('passport');
const MongoDBStore = require('connect-mongodb-session')(session);
const flash = require('connect-flash');
const compression = require('compression');
const connectDB = require('./config/db');
const path = require('path');
const Cart = require('./util/cart'); // Đảm bảo Cart được impo


//import routes;



// 2. Khởi tạo ứng dụng

const app = express();
// Cấu hình view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// 3. Kết nối Database
connectDB();

// 4. Middleware cơ bản
app.use(compression());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Must come before session and csrf
app.use(logger('dev'));

// ======================
// 5. Cấu hình Session
// ======================
const sessionStore = new MongoDBStore({
  uri: process.env.MONGO_URI,
  collection: 'sessions',
  connectionOptions: {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
});

app.use(session({
  secret: process.env.SESSION_SECRET || 'hieu123123',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: { secure: false } 
  
}));




// ======================
// 6. Cấu hình Authentication
// ======================
app.use(flash());
require('./config/passport')(passport);
app.use(passport.initialize());
app.use(passport.session());

// ======================
// 7. Biến toàn cục cho views
// ======================
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.session = req.session;
  
  // Initialize cart safely
  if (!req.session.cart) {
    req.session.cart = new Cart({});
  } else {
    req.session.cart = new Cart(req.session.cart);
  }
  
  // Add CSRF token to locals
  
  
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});
app.use((req, res, next) => {
  console.log('Incoming request:', req.method, req.url);
  console.log('Session data:', req.session);
  next();
});

// ======================
// 8. Các routes chính
// ======================
const webRouter = require('./routes/web');
const authRouter = require('./routes/auth');
const adminRoutes = require('./routes/admin');
app.use('/', webRouter);
app.use('/', authRouter);
app.use('/admin', adminRoutes);

// ======================
// 9. Xử lý lỗi
// ======================
app.use((req, res, next) => {
  res.status(404).render('error', {
    title: '404 Not Found',
    message: 'Trang bạn tìm kiếm không tồn tại',
    cartProduct: req.session.cart ? req.session.cart.generateArray() : []  // Sử dụng generateArray nếu giỏ hàng tồn tại
  });
});
app.use((req, res, next) => {
  if (!req.session.cart) {
    req.session.cart = { items: {}, totalQty: 0, totalPrice: 0 };
  }
  next();
});
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);

  const cartProduct = (req.session && req.session.cart) 
    ? new Cart(req.session.cart).generateArray() 
    : [];

  res.status(500).render('error', {
    title: 'Lỗi Server',
    message: 'Đã xảy ra lỗi hệ thống',
    error: process.env.NODE_ENV === 'development' ? err : {},
    cartProduct: cartProduct
  });
});
// ======================
// 10. Khởi động server
// ======================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server đang chạy trên port ${PORT}`);
  console.log(`Mở trình duyệt và truy cập http://localhost:${PORT}`);
});