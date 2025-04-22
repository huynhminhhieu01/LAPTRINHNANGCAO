const mongoose = require("mongoose");
const Product = require("../models/product");
const urlConnect = "mongodb://localhost:27017/ShopCongNghe?readPreference=primary&appname=MongoDB%20Compass&ssl=false";

// Connect to database
mongoose.connect(urlConnect, { useNewUrlParser: true }, err => {
  if (err) throw err;
  console.log("Connect successfully!!");
  
  var product = new Product({
    name: "Laptop Dell XPS 13",
    description: "Laptop Dell XPS 13 với thiết kế mỏng nhẹ, hiệu năng mạnh mẽ.",
    price: 24990000,
    image: "https://example.com/image.jpg",
    category: "Laptop"
    
  });

  product.save(function(err) {
    if (err) throw err;
    console.log("Product successfully saved.");
  });
});
