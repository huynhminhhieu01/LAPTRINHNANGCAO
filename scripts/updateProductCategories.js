const mongoose = require('mongoose');
const path = require('path');
const connectDB = require(path.join(__dirname, '../config/db'));

// 1. Định nghĩa schema cho Product
const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  image: String,
  category: mongoose.Schema.Types.Mixed, // Cho phép cả string và ObjectId
}, { collection: 'products' });

// 2. Đăng ký model Product ngay lập tức
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

// 3. Định nghĩa schema cho Category (phòng trường hợp chưa có)
const categorySchema = new mongoose.Schema({
  name: String,
  slug: { type: String, unique: true },
  description: String,
}, { collection: 'categories' });

// 4. Đăng ký model Category
const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);

// 5. Kết nối database và thực hiện migration
connectDB().then(async () => {
  try {
    console.log('🔄 Đang kết nối database...');
    
    // 6. Tạo bản đồ ánh xạ category
    console.log('🔍 Đang tải danh sách categories...');
    const categories = await Category.find({});
    const categoryMap = {};
    
    categories.forEach(cat => {
      // Ánh xạ theo slug
      categoryMap[cat.slug] = cat._id;
      
      // Ánh xạ theo tên không dấu
      const cleanName = cat.name.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, ' ');
      categoryMap[cleanName] = cat._id;
    });

    // 7. Ánh xạ đặc biệt cho các trường hợp cụ thể
    const specialMappings = {
      'smartwatch': 'smartwatches',
      'phone': 'phones',
      'điện thoại': 'phones',
      'dien thoai': 'phones',
      'laptop': 'laptops',
      'tablet': 'tablets',
      'phụ kiện': 'accessories',
      'phu kien': 'accessories'
    };

    // 8. Lấy các sản phẩm cần cập nhật
    console.log('🔎 Đang tìm sản phẩm cần cập nhật...');
    const products = await Product.find({ 
      $or: [
        { category: { $type: "string" } },
        { category: { $exists: false } }
      ]
    });
    console.log(`📊 Tổng sản phẩm cần xử lý: ${products.length}`);

    // 9. Cập nhật từng sản phẩm
    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;

    for (const [index, product] of products.entries()) {
      try {
        // Bỏ qua nếu không có category hoặc không phải string
        if (!product.category || typeof product.category !== 'string') {
          console.log(`⏩ [${index + 1}/${products.length}] Bỏ qua ${product._id}: Category không hợp lệ`);
          skipCount++;
          continue;
        }

        // Chuẩn hóa giá trị category
        let normalizedCategory = product.category
          .toString()
          .toLowerCase()
          .trim()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, ' ');

        // Áp dụng ánh xạ đặc biệt nếu có
        normalizedCategory = specialMappings[normalizedCategory] || normalizedCategory;

        // Tìm ObjectId tương ứng
        const categoryId = categoryMap[normalizedCategory];

        if (categoryId) {
          await Product.updateOne(
            { _id: product._id },
            { $set: { category: categoryId } }
          );
          console.log(`✅ [${index + 1}/${products.length}] Đã cập nhật ${product.name}: "${product.category}" -> ${normalizedCategory}`);
          successCount++;
        } else {
          console.log(`⚠️ [${index + 1}/${products.length}] Không tìm thấy danh mục cho "${product.category}" (chuẩn hóa: "${normalizedCategory}")`);
          failCount++;
        }
      } catch (err) {
        console.error(`❌ [${index + 1}/${products.length}] Lỗi khi xử lý ${product._id}:`, err.message);
        failCount++;
      }
    }

    // 10. Tổng kết kết quả
    console.log('\n🎉 Kết quả cập nhật:');
    console.log(`✅ Thành công: ${successCount}`);
    console.log(`⚠️ Không tìm thấy category: ${failCount}`);
    console.log(`⏩ Bỏ qua: ${skipCount}`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi tổng hợp:', err);
    process.exit(1);
  }
}).catch(err => {
  console.error('❌ Lỗi kết nối database:', err);
  process.exit(1);
});