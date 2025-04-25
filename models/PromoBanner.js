const mongoose = require('mongoose');

const promoBannerSchema = new mongoose.Schema({
  image: { type: String, required: true },
  name: { type: String, required: true },
  active: { type: Boolean, default: true }, // Trạng thái hoạt động của banner
}, { timestamps: true });

const PromoBanner = mongoose.model('PromoBanner', promoBannerSchema);

module.exports = PromoBanner;