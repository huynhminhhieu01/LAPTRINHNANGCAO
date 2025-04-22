const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);
const Schema = mongoose.Schema;

const orderSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },
  cart: { type: Object, required: true },
  address: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: false,
    default: Date.now
  },
  phoneNumber: {
    type: Number,
    required: true
  },
  orderNumber: {
    type: Number, // Ensure the field is of type Number
    unique: true // Ensure uniqueness for the auto-increment field
  }
});

// Apply the auto-increment plugin
orderSchema.plugin(AutoIncrement, { inc_field: "orderNumber" });

module.exports = mongoose.model("Order", orderSchema);
