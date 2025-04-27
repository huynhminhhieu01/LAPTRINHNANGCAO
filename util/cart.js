// util/cart.js
module.exports = function Cart(oldCart = {}) {
    this.items = oldCart.items || {};
    this.totalQty = oldCart.totalQty || 0;
    this.totalPrice = oldCart.totalPrice || 0;
  
    this.add = function(item, id, qty) {
        const itemQty = qty || 1;
        let storeItem = this.items[id];
        
        if (!storeItem) {
            storeItem = this.items[id] = { 
                item: item, 
                qty: 0, 
                price: 0, 
                images: item.images?.[0] || '' 
            };
        }
        
        storeItem.qty += itemQty;
        storeItem.price = storeItem.item.price * storeItem.qty;
        this.totalQty += itemQty;
        this.totalPrice += storeItem.item.price * itemQty; 
    };

    this.changeQty = function(item, id, qty) {
        const newQty = qty || 1;
        let storeItem = this.items[id];
        
        if (!storeItem) {
            this.add(item, id, qty);
            return;
        }

        const oldQty = storeItem.qty;
        storeItem.qty = newQty;
        storeItem.price = storeItem.item.price * newQty;
        
        this.totalQty += newQty - oldQty;
        this.totalPrice += storeItem.item.price * (newQty - oldQty);
    };

    this.deleteItem = function(id) {
        const storeItem = this.items[id];
        if (!storeItem) return;

        this.totalQty -= storeItem.qty;
        this.totalPrice -= storeItem.price;
        delete this.items[id];
    };

    this.generateArray = function() {
        return Object.values(this.items);
    };
};
