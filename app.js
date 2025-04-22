const path = require('path');
require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const passport = require('passport');
const MongoDBStore = require('connect-mongodb-session')(session);
const flash = require('connect-flash');
const compression = require('compression');


const app = express();

// Kết nối MongoDB trước khi các phần khác
const connectDB = require('./config/db');
connectDB();

// Khởi tạo view engine, logger, và các middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(compression());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(logger('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cấu hình session và passport sau khi kết nối DB
app.use(cookieParser());
app.use(flash());
app.use( session({
        secret: 'notsecret',
        saveUninitialized: true,
        resave: false,
        store: new MongoDBStore({ uri: process.env.MONGO_URI, collection: 'sessions' }),
        cookie: { maxAge: 180 * 60 * 1000 } // 3 giờ
    })
);

app.use((req, res, next) => {
    var cart = new Cart(req.session.cart ? req.session.cart : {});
    req.session.cart = cart;
    res.locals.session = req.session;
    next();
});

// Khởi tạo Passport sau khi session
app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
    res.locals.user = req.user || null; // đảm bảo luôn có biến user
    next();
  });

// Import models và các router
const Cart = require('./util/cart'); 
const Product = require('./models/product');
const shopRouter = require('./routes/web');
const authRouter = require('./routes/auth');


// Sử dụng các router
app.use('/', shopRouter);
app.use('/auth', authRouter);

// Cấu hình passport
require('./config/passport')(passport);

// Xử lý lỗi và trả về trang lỗi
app.use(function (err, req, res, next) {
    console.log('🔥 Error:', err); //
    var cartProduct;
    if (!req.session.cart) {
        cartProduct = null;
    } else {
        var cart = new Cart(req.session.cart);
        cartProduct = cart.generateArray();
    }
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render('error', { cartProduct: cartProduct });
});

// Khởi động server
app.listen(process.env.PORT || 3000, () => {
    console.log(`Server is running on http://localhost:${process.env.PORT || 3000}`);
});
