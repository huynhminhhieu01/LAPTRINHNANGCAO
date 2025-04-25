const mongoose = require('mongoose');

const connectDB = async () => {
    mongoose.connect('mongodb://localhost:27017/ShopCongNghe')
    .then(() => {
      console.log('MongoDB Connected successfully!');
    })
    .catch((error) => {
      console.error('MongoDB connection error:', error);
    });
}

module.exports = connectDB;