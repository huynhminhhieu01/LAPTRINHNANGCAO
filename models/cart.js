class Cart {
  constructor(oldCart) {
    this.items = oldCart.items || {};
    this.totalItems = oldCart.totalItems || 0;
    this.totalPrice = oldCart.totalPrice || 0;
  }

  add(item, id) {
    let storedItem = this.items[id];
    if (!storedItem) {
      storedItem = this.items[id] = { item: item, quantity: 0, price: 0 };
    }
    storedItem.quantity++;
    storedItem.price = storedItem.item.price * storedItem.quantity;
    this.totalItems++;
    this.totalPrice += storedItem.item.price;
  }

  generateArray() {
    return Object.values(this.items);
  }
}

module.exports = Cart;