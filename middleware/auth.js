const ErrorHandler = require("../utils/errorhandler");
const catchAsyncError = require("./catchAsyncError");
const jwt= require("jsonwebtoken");
const User= require("../models/userModel");

exports.isAuthenticatedUser=catchAsyncError(async (req, res, next)=>{
    const {token}= req.cookies;
    
     if(!token){
        // console.log('COOKIE NOT FOUND 😒😒😒😒😒😒')
        return next(new ErrorHandler("Please login to access this resource", 401));
     }

     const decodedData= jwt.verify(token, process.env.JWT_SECRET);
    //  console.log('💣💣💣💣💣', decodedData.id);
    req.user= await User.findById(decodedData.id);

    next();
});

exports.authorizeRoles=(...roles)=>{
    return (req, res, next)=>{
       if(!roles.includes(req.user.role)){
      return next(  new ErrorHandler
        (
            `Role:${req.user.role} is not allowed to access this resource`, 403  //403 refuse to access
        ));
       }  
       next();

    };
};



//hamne jwt token use kiya hai jo bhi loging hoga uske liye if vo login nahi hoga then uska token bhi nahi milegaa