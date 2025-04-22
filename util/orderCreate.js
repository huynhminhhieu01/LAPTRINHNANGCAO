const mongoose = require("mongoose");
const Order = require("../models/order");
const urlConnect = "mongodb://localhost:27017/ShopCongNghe?readPreference=primary&appname=MongoDB%20Compass&ssl=false";
//Connect to db
mongoose.connect(urlConnect, { useNewUrlParser: true }, err => {
  if (err) throw err;
  console.log("Connect successfully!!");

  var order = new Order({});

  order.save(function(err) {
    if (err) throw err;
    console.log("Comment successfully saved.");
  });
});
