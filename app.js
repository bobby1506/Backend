const cors = require("cors");
const axios = require("axios");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const sha256 = require("sha256");
const fileUpload = require("express-fileupload");
const express = require("express");
const uniqid = require("uniqid");
const app = express();
const Order = require("./models/orderModel");

const errorMiddleware = require("./middleware/error");
const product = require("./routes/productRoute");
const user = require("./routes/userRoute");
const order = require("./routes/orderRoute");

const PHONE_PE_HOST_URL = process.env.PHONE_PE_HOST_URL;
const MERCHANT_ID = process.env.MERCHANT_ID;
const SALT_INDEX = process.env.SALT_INDEX;
const SALT_KEY = process.env.SALT_KEY;
const APP_BE_URL = process.env.APP_BE_URL;
// const phonepayPayment = require("./routes/phonepayRoute");

const contact = require("./routes/contactRoute");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("passport");
const { isAuthenticatedUser } = require("./middleware/auth");
require("dotenv").config();
require("./utils/passport");

app.set("trust proxy", 1);

//initial config
app.use(express.json());
app.use(cookieParser());
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);

//session config
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV !== "development",
      sameSite: process.env.NODE_ENV === "development" ? "lax" : "none",
      // domain: process.env.NODE_ENV === "development" ? "localhost" : "gga",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
    store: MongoStore.create({
      mongoUrl: process.env.DB_URI,
      ttl: 7 * 24 * 60 * 60,
    }),
  })
);

//passport-js config
app.use(passport.initialize());
app.use(passport.session());

//cors config
app.use(
  cors({
    credentials: true,
    origin: [
      "https://mercury.phonepe.com/transact",
      "https://mercury.phonepe.com/transact/",
      "http://localhost:3000",
      "https://backend-amber-alpha-12.vercel.app/api/v1",
      "http://localhost:5173",
      "https://greenglobalaggrovationfrontend.onrender.com",
      "https://greenglobalaggrovation-8129.onrender.com",
      "https://greenglobalaggrovation.com",
      "https://www.greenglobalaggrovation.com",
      "https://www.greenglobalaggrovation.com/",
      "https://mercury-t2.phonepe.com",
      "https://api.phonepe.com/apis/hermes/",
      "https://api.phonepe.com/apis/hermes",
      "https://mercury.phonepe.com",
    ],
  })
);

//route imports
app.use("/api/v1", product);
app.use("/api/v1", user);
app.use("/api/v1", order);
// app.use("/api/v1", payment);
app.use("/api/v1", contact);
// app.use("", phonepayPayment);
// Endpoint to initiate payment and send the link to frontend
app.post("/pay/:orderId", isAuthenticatedUser, async function (req, res) {
  const { orderId } = req.params;

  try {
    // Fetch the order details using the provided order ID
    const order = await Order.findById(orderId).populate('user'); // Assuming 'user' is populated to get user info
    console.log(order);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const amount = order.totalPrice; // Use the total price from the order
    const userId = order.user._id; // Get user ID from the populated user field
    const merchantTransactionId = uniqid();
    
    console.log("Merchant Transaction ID:", merchantTransactionId);

    const normalPayLoad = {
      merchantId: MERCHANT_ID,
      merchantTransactionId: merchantTransactionId,
      merchantUserId: userId.toString(), // Ensure it's a string
      amount: amount * 100, // Convert to paise
      redirectUrl: `https://www.greenglobalaggrovation.com/paymentSuccess/${orderId}`,
      redirectMode: "POST",
      callbackUrl: `${APP_BE_URL}/payment/validate/${merchantTransactionId}/${orderId}`,
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    const bufferObj = Buffer.from(JSON.stringify(normalPayLoad), "utf8");
    const base64EncodedPayload = bufferObj.toString("base64");

    const string = base64EncodedPayload + "/pg/v1/pay" + SALT_KEY;
    const sha256_val = sha256(string);
    const xVerifyChecksum = sha256_val + "###" + SALT_INDEX;

    const response = await axios.post(
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

    console.log("Payment initiation response:", response.data);

    // Send the payment link to the frontend
    res.json({ paymentUrl: response.data.data.instrumentResponse.redirectInfo.url });
    
  } catch (error) {
    console.error("Payment initiation error:", error.message || error);
    res.status(500).json({ error: "Payment initiation failed" });
  }
});


app.post("/payment/validate/:merchantTransactionId/:orderId", async function (req, res) {
  const { merchantTransactionId, orderId } = req.params;

  console.log("Received transaction ID:", merchantTransactionId);
  console.log("Received order ID:", orderId);

  if (!merchantTransactionId || !orderId) {
    console.log("Invalid transaction ID or order ID received.");
    return res.status(400).json({ error: "Invalid transaction ID or order ID" });
  }

  // Fetch the order to validate its existence and retrieve the necessary information
  const order = await Order.findById(orderId);
  if (!order) {
    console.log("Order not found for the given order ID:", orderId);
    return res.status(404).json({ error: "Order not found" });
  }

  const statusUrl = `${PHONE_PE_HOST_URL}/pg/v1/status/${MERCHANT_ID}/` + merchantTransactionId;
  const string = `/pg/v1/status/${MERCHANT_ID}/` + merchantTransactionId + SALT_KEY;
  const sha256_val = sha256(string);
  const xVerifyChecksum = sha256_val + "###" + SALT_INDEX;

  console.log("Generated status URL:", statusUrl);
  console.log("Generated X-VERIFY checksum:", xVerifyChecksum);

  // Retry intervals (in ms)
  const retryIntervals = [
    20000, 25000, // First check between 20-25 seconds
    3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, // Every 3 seconds for 30 seconds
    6000, 6000, 6000, 6000, 6000, 6000, 6000, 6000, 6000, 6000, // Every 6 seconds for 60 seconds
    10000, 10000, 10000, 10000, 10000, 10000, // Every 10 seconds for 60 seconds
    30000, 30000, // Every 30 seconds for 60 seconds
    60000, 60000, 60000, 60000, 60000, 60000, 60000, 60000, 60000, 60000, 60000, 60000 // Every 1 minute until timeout
  ];

  async function checkPaymentStatus(retryIndex = 0) {
    try {
      const response = await axios.get(statusUrl, {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": xVerifyChecksum,
          "X-MERCHANT-ID": MERCHANT_ID
        }
      });

      console.log("Response from PhonePe:", response.data);

      if (response.data && response.data.code === "PAYMENT_SUCCESS") {
        console.log("Payment was successful");

        // Update the payment_status in the order
        order.payment_status = "Success"; // Assuming you have a payment_status field in your order schema
        await order.save(); // Save the updated order

        console.log("Order payment status updated:", order);
        // return res.redirect("https://www.greenglobalaggrovation.com");
      } else if (response.data && response.data.code === "PAYMENT_FAILED") {
        console.log("Payment failed");
        order.payment_status = "Failed";
        return res.status(400).json({ status: "Payment failed" });
      } else if (response.data && response.data.code === "PAYMENT_PENDING") {
        console.log("Payment is pending. Retrying...");
        
        if (retryIndex < retryIntervals.length) {
          setTimeout(() => checkPaymentStatus(retryIndex + 1), retryIntervals[retryIndex]);
        } else {
          console.log("Payment status check timed out.");
          order.payment_status = "Pending";
          return res.status(408).json({ error: "Payment status check timed out" });
        }
      } else {
        console.log("Unexpected status received");
        return res.status(400).json({ status: "Unexpected status received" });
      }
    } catch (error) {
      console.error("Error during payment status check:", error.message || error);
      return res.status(500).json({ error: "Payment status check failed" });
    }
  }

  // Start the first status check
  checkPaymentStatus();
});




app.get("*", (req, res, next) => {
  res.status(200).json({
    message: "Ok",
  });
});

app.use(errorMiddleware);

module.exports = app;