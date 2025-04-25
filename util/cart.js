module.exports = function Cart(oldCart = {}) {
    // Khởi tạo dữ liệu
    this.items = oldCart.items || {};
    this.totalQty = oldCart.totalQty || 0;
    this.totalPrice = oldCart.totalPrice || 0;
  
    // Thêm phương thức
    this.generateArray = function() {
      return Object.values(this.items);
    };

    this.add = function(item, id, qty) {
        const itemQty = qty ? Number(qty) : 1;
        let storeItem = this.items[id];
        
        if (!storeItem) {
            storeItem = this.items[id] = { 
                item: item, 
                qty: 0, 
                price: 0, 
                images: item.images?.[0] || '' 
            };
            this.numItems++;
        }
        
        storeItem.qty += itemQty;
        storeItem.price = storeItem.item.price * storeItem.qty;
        this.totalQty += itemQty;
        this.totalPrice += storeItem.item.price * itemQty; // Fix: Tính lại tổng tiền
    };

    this.changeQty = function(item, id, qty) {
        const newQty = qty ? Number(qty) : 1;
        let storeItem = this.items[id];
        
        if (!storeItem) {
            this.add(item, id, qty);
            return;
        }

        const oldQty = storeItem.qty;
        storeItem.qty = newQty;
        storeItem.price = storeItem.item.price * newQty;
        
        this.totalQty += newQty - oldQty;
        this.totalPrice += storeItem.item.price * (newQty - oldQty); // Fix: Tính chênh lệch
    };

    this.deleteItem = function(id) {
        const storeItem = this.items[id];
        if (!storeItem) return;

        this.totalQty -= storeItem.qty;
        this.totalPrice -= storeItem.price;
        this.numItems--;
        delete this.items[id];
    };

    this.generateArray = function() {
        return Object.values(this.items); // Sử dụng Object.values thay vì for...in
    };
};