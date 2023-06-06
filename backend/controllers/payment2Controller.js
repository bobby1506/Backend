// const instance =require("../server.js");

// const catchAsyncError = require("../middleware/catchAsyncError");

// exports.checkout= catchAsyncError(async (req,res, next)=>{
  

//     const options={
//         amount:50000,
//         currency:"INR",
//     };
//     const order=await instance.orders.create(options);
//     console.log(order);
//     res.status(200).json({
//         success:true,
//     })
// });