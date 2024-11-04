const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  shippingInfo: {
    address: { type: String },
    country: { type: String },
    state: { type: String },
    city: { type: String },
    phoneNo: { type: String },
    pincode: { type: String }
  },
  orderItems: [
    {
      name: { type: String },
      price: { type: Number },
      quantity: { type: Number },
      image: { type: String },
      product: {
        type: mongoose.Schema.ObjectId,
        ref: 'Product' // Assuming you have a Product model
      }
    }
  ],
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User' // Assuming you have a User model
  },
  itemsPrice: { type: Number },
  taxPrice: { type: Number },
  shippingPrice: { type: Number },
  totalPrice: { type: Number },
  paidAt: { type: Date, default: Date.now },
  orderStatus: { type: String, default: 'Processing' },
  paymentStatus: { 
    type: String, 
    enum: ['Success', 'Failed', 'Pending'], 
    default: 'Pending' 
  } // New field for payment status
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
