// importing modules

const axios = require("axios");
const sha256 = require("sha256");
const uniqid = require("uniqid");
const Order = require("../models/orderModel");
const catchAsyncError = require("../middleware/catchAsyncError");


//testing credentials
const PHONE_PE_HOST_URL= process.env.PHONE_PE_HOST_URL;
const MERCHANT_ID=process.env.MERCHANT_ID;
const SALT_INDEX=process.env.SALT_INDEX;
const SALT_KEY=process.env.SALT_KEY;
const APP_BE_URL = process.env.APP_BE_URL; // our application


exports.initiatePayment = catchAsyncError(async function (req, res, next) {
  try {
    console.log("hello");
    const { orderId, userId } = req.params;
    // console.log(orderId, userId);

    if (!orderId || !userId) {
      return res.status(400).json({ message: "Order ID and User ID are required" });
    }

    // Generate unique transaction ID
    const merchantTransactionId = uniqid();

    // Fetch order details
    const order = await Order.findById(orderId);
    // console.log({ order });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Prepare payload for PhonePe API
    const normalPayLoad = {
      merchantId: MERCHANT_ID,
      merchantTransactionId: merchantTransactionId,
      merchantUserId: userId,
      amount: order.totalPrice * 100, // Price in paise
      redirectUrl: `${APP_BE_URL}/payment/validate/${merchantTransactionId}`, // Redirect URL post-payment
      redirectMode: "REDIRECT",
      mobileNumber: order.shippingInfo.phoneNo, // Mobile number from order
      paymentInstrument: { type: "PAY_PAGE" },
    };

    // Encode the payload
    let bufferObj = Buffer.from(JSON.stringify(normalPayLoad), "utf8");
    let base64EncodedPayload = bufferObj.toString("base64");

    // Create the hash for X-VERIFY header
    let stringToHash = base64EncodedPayload + '/pg/v1/pay' + SALT_KEY;
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

    // Check if we got the redirect URL in the response
    if (!paymentResponse.data?.data?.instrumentResponse?.redirectInfo?.url) {
      return res.status(500).json({ message: "Failed to retrieve redirect URL from payment provider" });
    }

    // Redirect the user to the payment page
    // console.log(paymentResponse);
    res.json({message:"gooo"});
    // res.redirect(paymentResponse.data.data.instrumentResponse.redirectInfo.url);

  } catch (error) {
    // Handle any error in the try block
    console.error("Error initiating payment:", error);
    res.status(500).json({ message: "Payment initiation failed", error: error.message });
  }
});




// // Endpoint to initiate a payment
// exports.initiatePayment = catchAsyncError(async function (req, res, next) {
//   try {
//     // Extracting orderId and userId from the request
//     const { orderId, userId } = req.body;
//     console.log(orderId, userId);
    
//     // If orderId or userId is missing, return an error
//     if (!orderId || !userId) {
//       return res.status(400).json({ message: "Order ID and User ID are required" });
//     }

//     // Generate a unique merchant transaction ID for each transaction
//     const merchantTransactionId = uniqid();


//       // Example: Retrieve the order details based on the orderId
//   const order = await Order.findById(orderId);

//   if (!order) {
//     return res.status(404).json({ success: false, message: "Order not found" });
//   }

//     // Payload for PhonePe API
//     const normalPayLoad = {
//       merchantId: MERCHANT_ID, //* PHONEPE_MERCHANT_ID . Unique for each account (private)
//       merchantTransactionId: merchantTransactionId,
//       merchantUserId: userId,
//       amount: order.totalPrice * 100,  // This is just an example; you should calculate the actual amount (in paise)
//       redirectUrl: `${APP_BE_URL}/payment/validate/${merchantTransactionId}`, // Redirect URL after payment completion
//       redirectMode: 'REDIRECT',
//       mobileNumber: order.shippingInfo.phoneNo, // Replace with actual mobile number from user data
//       paymentInstrument: {
//         type: "PAY_PAGE",
//       },
//     };

//     // Make base64 encoded payload
//     const bufferObj = Buffer.from(JSON.stringify(normalPayLoad), "utf8");
//     const base64EncodedPayload = bufferObj.toString("base64");

//     // X-VERIFY => SHA256(base64EncodedPayload + "/pg/v1/pay" + SALT_KEY) + ### + SALT_INDEX
//     const stringToHash = base64EncodedPayload + '/pg/v1/pay' + SALT_KEY;
//     const sha256_val = sha256(stringToHash);
//     const xVerifyChecksum = sha256_val + "###" + SALT_INDEX;

//     // Make API call to PhonePe
//     const paymentResponse = await axios.post(
//       `${PHONE_PE_HOST_URL}/pg/v1/pay`,
//       {
//         request: base64EncodedPayload,
//       },
//       {
//         headers: {
//           "Content-Type": "application/json",
//           "X-VERIFY": xVerifyChecksum,
//           accept: "application/json",
//         },
//       }
//     );

//     // Redirect to the payment page (PhonePe redirect URL)
//     res.redirect(paymentResponse.data.data.instrumentResponse.redirectInfo.url);
//   } catch (error) {
//     console.error("Error initiating payment:", error);
//     res.status(500).json({ message: "Payment initiation failed", error });
//   }
// });


// endpoint to check the status of payment
exports.validatePayment = catchAsyncError( async function (req, res) {
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
          // redirect to FE payment success status page
          console.log("completed");
          res.send(response.data);
        } else {
          // redirect to FE payment failure / pending status page
          console.log("failed");
        }
      })
      .catch(function (error) {
        // redirect to FE payment failure / pending status page
        res.send(error);
      });
  } else {
    res.send("Sorry!! Error");
  }
});
