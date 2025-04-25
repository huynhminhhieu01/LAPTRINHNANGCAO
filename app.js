// ======================
// 1. Các thư viện cần thiết
// ======================
const path = require('path');
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
const Cart = require('./util/cart'); // Đảm bảo Cart được import

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
app.use(cookieParser());
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
  cookie: {
    maxAge: 180 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
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
  req.session.cart = req.session.cart || new (require('./util/cart'))({});
  // Đã loại bỏ csrfToken
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

// ======================
// 8. Các routes chính
// ======================
const webRouter = require('./routes/web');
const authRouter = require('./routes/auth');
app.use('/', webRouter);
app.use('/', authRouter);

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

app.use((err, req, res, next) => {
  console.error(' Error:', err.stack);


  const cartProduct = req.session.cart ? new Cart(req.session.cart).generateArray() : null;

  res.status(500).render('error', {
    title: 'Lỗi Server',
    message: 'Đã xảy ra lỗi hệ thống',
    error: process.env.NODE_ENV === 'development' ? err : {},
    cartProduct: cartProduct  // Hiển thị giỏ hàng trong trang lỗi nếu có
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
