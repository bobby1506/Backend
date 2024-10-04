const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncError");


//phonepay order controller

// Controller function to create a new order
exports.createOrder = async (req, res, next) => {
  // console.log("hello");
  try {
    const { shippingInfo, orderItems, user, itemsPrice, taxPrice, shippingPrice, totalPrice } = req.body;

  
    console.log('Request Body:', req.body);

    // Validate input data
    if (!shippingInfo || !orderItems || !user || !itemsPrice || !taxPrice || !shippingPrice || !totalPrice) {
      console.log('Missing required fields for order creation.');
      return res.status(400).json({
        success: false,
        message: 'Please provide all necessary fields to create an order.'
      });
    }

   
    if (orderItems.length === 0) {
      console.log('No order items found.');
      return res.status(400).json({
        success: false,
        message: 'No order items found.'
      });
    }

 
    console.log('Creating order with the following details:');
    console.log('Shipping Info:', shippingInfo);
    console.log('Order Items:', orderItems);
    console.log('User:', user);
    console.log('Items Price:', itemsPrice);
    console.log('Tax Price:', taxPrice);
    console.log('Shipping Price:', shippingPrice);
    console.log('Total Price:', totalPrice);

    // Create a new order in the database
    const neworder = await Order({
      shippingInfo,
      orderItems,
      user,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      paidAt: Date.now(), 
      // orderStatus: 'Processing' 
    });

    const orders= await neworder.save();
    // Log the created order details
    // console.log('Order created successfully:', order);

    // Return success response with created order details
    return res.status(200).json({
      success: true,
      message: 'Order created successfully.',
      placeOrders:orders,
    });

    } catch (error) {
      
    console.error('Error creating order:', error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error occurred while creating the order.',
      error: error.message
    });
   
  }
};

// exports.placeOrder = catchAsyncErrors(async (req, res, next) => {
//   const {
//     shippingInfo,
//     orderItems,
//     paymentInfo,
//     itemsPrice,
//     taxPrice,
//     shippingPrice,
//     totalPrice,
//   } = req.body;

//   const order = await Order.create({
//     shippingInfo,
//     orderItems,
//     paymentInfo,
//     itemsPrice,
//     taxPrice,
//     shippingPrice,
//     totalPrice,
//     paidAt: Date.now(),
//     user: req.user,
//   });

//   res.status(201).json({
//     success: true,
//     order:"hello",
//   });
// });


//find order
// API to find an order by ID and show details
exports.getOrderDetails = catchAsyncErrors(async (req, res, next) => {
  const { orderId } = req.params;

  // Check if orderId is provided
  if (!orderId) {
    return res.status(400).json({ message: "Order ID is required" });
  }

  try {
    // Find the order by ID in the database
    const order = await Order.findById(orderId).populate('user', 'name email'); // Populate user if needed

    // If order is not found, send an error response
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Send the order details as a response
    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order details",
    });
  }
});

// Create new Order
exports.newOrder = catchAsyncErrors(async (req, res, next) => {
  const {
    shippingInfo,
    orderItems,
    paymentInfo,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  } = req.body;

  const order = await Order.create({
    shippingInfo,
    orderItems,
    paymentInfo,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paidAt: Date.now(),
    user: req.user._id,
  });

  res.status(201).json({
    success: true,
    order,
  });
});

// get Single Order
exports.getSingleOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email"
  );

  if (!order) {
    return next(new ErrorHandler("Order not found with this Id", 404));
  }

  res.status(200).json({
    success: true,
    order,
  });
});

// get logged in user  Orders
exports.myOrders = catchAsyncErrors(async (req, res, next) => {
  const orders = await Order.find({ user: req.user._id });

  res.status(200).json({
    success: true,
    orders,
  });
});

// get all Orders -- Admin
exports.getAllOrders = catchAsyncErrors(async (req, res, next) => {
  const orders = await Order.find();

  let totalAmount = 0;

  orders.forEach((order) => {
    totalAmount += order.totalPrice;
  });

  res.status(200).json({
    success: true,
    totalAmount,
    orders,
  });
});

// update Order Status -- Admin
exports.updateOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorHandler("Order not found with this Id", 404));
  }

  if (order.orderStatus === "Delivered") {
    return next(new ErrorHandler("You have already delivered this order", 400));
  }

  if (req.body.status === "Shipped") {
    order.orderItems.forEach(async (o) => {
      await updateStock(o.product, o.quantity);
    });
  }
  order.orderStatus = req.body.status;

  if (req.body.status === "Delivered") {
    order.deliveredAt = Date.now();
  }

  await order.save({ validateBeforeSave: false });
  res.status(200).json({
    success: true,
  });
});

async function updateStock(id, quantity) {
  const product = await Product.findById(id);

  product.Stock -= quantity;

  await product.save({ validateBeforeSave: false });
}

// delete Order -- Admin
exports.deleteOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorHandler("Order not found with this Id", 404));
  }

  await order.remove();

  res.status(200).json({
    success: true,
  });
});
