const instance = require("../razorpayInstance.js");
const catchAsyncError = require("../middleware/catchAsyncError");
const crypto= require("crypto");
const { Payment }=require("../models/paymentModel.js");

exports.checkout = async (req, res) => {
  const options = {
    amount: Math.round(req.body.amount * 100), // Convert amount to paise
    currency: "INR",
  };

  try {
    const order = await instance.orders.create(options);

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "An error occurred while creating the order.",
    });
  }
};


exports.paymentVerification = catchAsyncError(async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
    .update(body.toString())
    .digest("hex");

  const isAuthentic = expectedSignature === razorpay_signature;

  if (isAuthentic) {
    // Database comes here


    res.status(200).json({ success: true });
  } else {
    res.status(400).json({
      success: false,
    });
  }
});
