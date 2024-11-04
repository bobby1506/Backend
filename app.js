const cors = require("cors");
const axios = require("axios");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const sha256 = require("sha256");
const fileUpload = require("express-fileupload");
const express = require("express");
const uniqid = require("uniqid");
const app = express();

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
app.get("/pay", async function (req, res) {
  const amount = +req.query.amount;
  let userId = "MUID123";
  let merchantTransactionId = uniqid();
  console.log(merchantTransactionId);

  let normalPayLoad = {
    merchantId: MERCHANT_ID,
    merchantTransactionId: merchantTransactionId,
    merchantUserId: userId,
    amount: amount * 100,
    redirectUrl:"https://www.greenglobalaggrovation.com",
    redirectMode: "POST",
    callbackUrl: `${APP_BE_URL}/payment/validate/${merchantTransactionId}`,
    paymentInstrument: {
      type: "PAY_PAGE",
    },
  };

  let bufferObj = Buffer.from(JSON.stringify(normalPayLoad), "utf8");
  let base64EncodedPayload = bufferObj.toString("base64");

  let string = base64EncodedPayload + "/pg/v1/pay" + SALT_KEY;
  let sha256_val = sha256(string);
  let xVerifyChecksum = sha256_val + "###" + SALT_INDEX;

  try {
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
    console.log(response.data);

    // Send the payment link to the frontend
    res.json({ paymentUrl: response.data.data.instrumentResponse.redirectInfo.url });
  } catch (error) {
    res.status(500).json({ error: "Payment initiation failed" });
  }
});

// Endpoint to validate payment status
app.post("/payment/validate/:merchantTransactionId", async function (req, res) {
  const { merchantTransactionId } = req.params;

  console.log("Received transaction ID:", merchantTransactionId);

  if (merchantTransactionId) {
    const statusUrl = `${PHONE_PE_HOST_URL}/pg/v1/status/${MERCHANT_ID}/` + merchantTransactionId;
    const string = `/pg/v1/status/${MERCHANT_ID}/` + merchantTransactionId + SALT_KEY;
    const sha256_val = sha256(string);
    const xVerifyChecksum = sha256_val + "###" + SALT_INDEX;

    console.log("Generated status URL:", statusUrl);
    console.log("Generated X-VERIFY checksum:", xVerifyChecksum);

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
        // res.redirect("https://www.greenglobalaggrovation.com");
      } else if (response.data && response.data.code === "PAYMENT_PENDING") {
        console.log("Payment is pending. Retrying will be necessary.");
        res.status(202).json({ status: "Payment pending, please retry later" });
      } else {
        console.log("Payment failed or other status received");
        res.status(400).json({ status: "Payment failed" });
      }
    } catch (error) {
      console.error("Error during payment status check:", error.message || error);
      res.status(500).json({ error: "Payment status check failed" });
    }
  } else {
    console.log("Invalid transaction ID received.");
    res.status(400).json({ error: "Invalid transaction ID" });
  }
});




app.get("*", (req, res, next) => {
  res.status(200).json({
    message: "Ok",
  });
});

app.use(errorMiddleware);

module.exports = app;