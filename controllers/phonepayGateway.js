const axios = require("axios");
const sha256 = require("sha256");
const uniqid = require("uniqid");
const Order = require("../models/orderModel");
const catchAsyncError = require("../middleware/catchAsyncError");

const PHONE_PE_HOST_URL = process.env.PHONE_PE_HOST_URL;
const MERCHANT_ID = process.env.MERCHANT_ID;
const SALT_INDEX = process.env.SALT_INDEX;
const SALT_KEY = process.env.SALT_KEY;
const APP_BE_URL = process.env.APP_BE_URL;

exports.initiatePayment = catchAsyncError(async function (req, res, next) {
  try {
    console.log("hello");
    const { orderId, userId } = req.params;

    if (!orderId || !userId) {
      return res
        .status(400)
        .json({ message: "Order ID and User ID are required" });
    }

    const merchantTransactionId = uniqid();

    const order = await Order.findById(orderId);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const normalPayLoad = {
      merchantId: MERCHANT_ID,
      merchantTransactionId: merchantTransactionId,
      merchantUserId: userId,
      amount: order.totalPrice * 100,
      redirectUrl: `${APP_BE_URL}/payment/validate/${merchantTransactionId}`, // Redirect URL post-payment
      redirectMode: "POST",
      mobileNumber: order.shippingInfo.phoneNo,
      paymentInstrument: { type: "PAY_PAGE" },
    };

    let bufferObj = Buffer.from(JSON.stringify(normalPayLoad), "utf8");
    let base64EncodedPayload = bufferObj.toString("base64");

    // Create the hash for X-VERIFY header
    let stringToHash = base64EncodedPayload + "/pg/v1/pay" + SALT_KEY;
    let sha256_val = sha256(stringToHash);
    let xVerifyChecksum = sha256_val + "###" + SALT_INDEX;

    // Make the API request to PhonePe
    const paymentResponse = await axios.post(
      `${PHONE_PE_HOST_URL}/pg/v1/pay`,
      { request: base64EncodedPayload },
      {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": xVerifyChecksum,
          accept: "application/json",
        },
      }
    );

    if (!paymentResponse.data?.data?.instrumentResponse?.redirectInfo?.url) {
      return res
        .status(500)
        .json({
          message: "Failed to retrieve redirect URL from payment provider",
        });
    }

    // Redirect the user to the payment page
    // console.log(paymentResponse);
    // res.json({message:paymentResponse.data.data});
    res.redirect(paymentResponse.data.data.instrumentResponse.redirectInfo.url);
  } catch (error) {
    // Handle any error in the try block
    console.error("Error initiating payment:", error);
    res
      .status(500)
      .json({ message: "Payment initiation failed", error: error.message });
  }
});

// endpoint to check the status of payment
exports.validatePayment = catchAsyncError(async function (req, res) {
  const { merchantTransactionId } = req.params;
  // check the status of the payment using merchantTransactionId
  if (merchantTransactionId) {
    let statusUrl =
      `${PHONE_PE_HOST_URL}/pg/v1/status/${MERCHANT_ID}/` +
      merchantTransactionId;

    // generate X-VERIFY
    let string =
      `/pg/v1/status/${MERCHANT_ID}/` + merchantTransactionId + SALT_KEY;
    let sha256_val = sha256(string);
    let xVerifyChecksum = sha256_val + "###" + SALT_INDEX;

    axios
      .get(statusUrl, {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": xVerifyChecksum,
          "X-MERCHANT-ID": merchantTransactionId,
          accept: "application/json",
        },
      })
      .then(function (response) {
        console.log("response->", response.data);
        if (response.data && response.data.code === "PAYMENT_SUCCESS") {
          console.log("completed");
          res.send(response.data);
        } else {
          console.log("failed");
        }
      })
      .catch(function (error) {
        res.send(error);
      });
  } else {
    res.send("Sorry!! Error");
  }
});
