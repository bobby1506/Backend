const express = require("express");
const app=express();
const cors = require('cors');


// const dotenv=require("dotenv");
const cookieParser=require("cookie-parser");
const bodyParser = require("body-parser");
const fileUpload= require("express-fileupload");
const errorMiddleware= require("./middleware/error");
// const path = require("path");
//config
if(process.env.NODE_ENV!="PRODUCTION"){
    require("dotenv").config({path:"./config/config.env"})
}
app.use(cors({
  credentials: true,
  origin: ['https://greenglobalaggrovation2.netlify.app', 'http://localhost:3000', 'https://greenglobalaggrovationfrontend.onrender.com']
}));
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.urlencoded({extended: true}));
app.use(fileUpload());

//route imports
const product= require("./routes/productRoute");
const user =require("./routes/userRoute");
const order =require("./routes/orderRoute");
const payment =require("./routes/striperoute");
const contact=require("./routes/contactRoute");

// const payment2=require("./routes/payment2Route");
// const cart =require("./routes/cartRoute");

app.use("/api/v1", product);
app.use("/api/v1", user);
app.use("/api/v1", order);
// app.use("/api/v1", payment);
app.use("/api/v1", contact);
app.use("/api/v1", payment);
// app.use("/api/v1", cart);
//middlewares for errors

// app.use(express.static(path.join(__dirname, "../frontend/build")));

// app.get("*", (req, res) => {
//   res.sendFile(path.resolve(__dirname, "../frontend/build/index.html"));
// });
// app.get("/api/v1/getkey", (req, res) =>
//   res.status(200).json({ key: process.env.RAZORPAY_API_KEY })
// );

app.get('*',(req,res,next)=>{
    res.status(200).json({
      message:'bad request'
    })
  })
app.use(errorMiddleware);

module.exports=app;