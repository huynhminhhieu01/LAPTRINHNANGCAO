const mongoose = require("mongoose");
const comment = require("../models/comment");
const urlConnect ="mongodb://localhost:27017/ShopCongNghe?readPreference=primary&appname=MongoDB%20Compass&ssl=false";
//Connect to db
mongoose.connect(urlConnect, { useNewUrlParser: true }, err => {
  if (err) throw err;
  console.log("Connect successfully!!");

  var newComment = new comment({
    productId: "1234567890",
    userId: "0987654321",
    content: "Sản phẩm rất tốt, tôi rất hài lòng!",
    rating: 5,
    createdAt: new Date(),
    updatedAt: new Date()

  });

  newComment.save(function(err) {
    if (err) throw err;
    console.log("Comment successfully saved.");
  });
});
