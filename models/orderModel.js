// const mongoose = require("mongoose");

// const orderSchema = new mongoose.Schema({
  
//   shippingInfo: {
//     address: {
//       type: String,
//       ,
//     },
//     city: {
//       type: String,
//       ,
//     },

//     state: {
//       type: String,
//       ,
//     },

//     country: {
//       type: String,
//       ,
//     },
//     pinCode: {
//       type: Number,
//       ,
//     },
//     phoneNo: {
//       type: Number,
//       ,
//     },
//   },
//   orderItems: [
//     {
//       name: {
//         type: String,
//         ,
//       },
//       price: {
//         type: Number,
//         ,
//       },
//       quantity: {
//         type: Number,
//         ,
//       },
//       image: {
//         type: String,
//         ,
//       },
//       product: {
//         type: mongoose.Schema.ObjectId,
//         ref: "Product",
//         ,
//       },
//     },
//   ],
//   user: {
//     type: mongoose.Schema.ObjectId,
//     ref: "User",
//     ,
//   },
//   paymentInfo: {
//     id: {
//       type: String,
//       ,
//     },
//     status: {
//       type: String,
//       ,
//     },
//   },
//   paidAt: {
//     type: Date,
//     ,
//   },
//   itemsPrice: {
//     type: Number,
//     ,
//     default: 0,
//   },
//   taxPrice: {
//     type: Number,
//     ,
//     default: 0,
//   },
//   shippingPrice: {
//     type: Number,
//     ,
//     default: 0,
//   },
//   totalPrice: {
//     type: Number,
//     ,
//     default: 0,
//   },
//   orderStatus: {
//     type: String,
//     ,
//     default: "Processing",
//   },
//   deliveredAt: Date,
//   createdAt: {
//     type: Date,
//     default: Date.now,
//   },
// });

// module.exports = mongoose.model("Order", orderSchema);

const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  shippingInfo: {
    address: { type: String  },
    country: {type: String },
    state: { type: String  },
    city: { type: String  },
    phoneNo: { type: String  },
    pincode: { type: String  }
  },
  orderItems: [
    {
      name: { type: String  },
      price: { type: Number  },
      quantity: { type: Number  },
      image: { type: String  },
      product: {
        type: mongoose.Schema.ObjectId,
        ref: 'Product', // Assuming you have a Product model
        // 
      }
    }
  ],
  user: {
    type: mongoose.Schema.ObjectId, 
    ref: 'User', // Assuming you have a User model
    // 
  },
  itemsPrice: { type: Number },
  taxPrice: { type: Number  },
  shippingPrice: { type: Number  },
  totalPrice: { type: Number  },
  paidAt: { type: Date, default: Date.now },
  orderStatus: { type: String, default: 'Processing' },
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
