const User = require("../models/userModel");
const ErrorHandler = require("../utils/errorhandler");
const catchAsyncError = require("../middleware/catchAsyncError");
const sendToken = require("../utils/jwtToken");
const sendEmail=require("../utils/sendEmail.js");
const cloudinary= require("cloudinary");
const isAuthenticated = require("../middleware/auth");
//Register a USER
exports.registerUser = catchAsyncError(async (req, res, next) => {

  const myCloud= await cloudinary.v2.uploader.upload(req.body.avatar,{
    folder:"avatars",
    width: 150,
    crop: "scale",
  });
  const { name, email, password } = req.body;

  const user = await User.create({
    name,
    email,
    password,
    avatar: {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    },
  });

  sendToken(user, 201, res);
});

//LOGIN USER

exports.loginUser = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  // checking if user has given password and email both

  if (!email || !password) {
    return next(new ErrorHandler("Please Enter Email & Password", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  sendToken(user, 200, res);
});

exports.logout = catchAsyncError(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged Out",
  });
});

//forget password function
exports.forgotPassword = catchAsyncError(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Get ResetPassword Token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  const resetPasswordUrl = `${req.protocol}://${req.get(
    "host"
  )}/password/reset/${resetToken}`;

  const message = `Your password reset token is :- \n\n ${resetPasswordUrl} \n\nIf you have not requested this email then, please ignore it.`;

  try {
    await sendEmail({
      email: user.email,
      subject: `Ecommerce Password Recovery`,
      message,
    });

    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorHandler(error.message, 500));
  }
});


//RESET password
exports.resetPassword = catchAsyncError(async (req, res, next) => {
  // creating token hash
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new ErrorHandler(
        "Reset Password Token is invalid or has been expired",
        400
      )
    );
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler("Password does not password", 400));
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  sendToken(user, 200, res);
});

//Get user detail

// exports.getUserDetails=catchAsyncError(async (req, res, next)=>{

//   const user=await User.findById(req.user.id);

//   res.status(200).json({
//     success:true,
//     user,
    
//   });
// });
// Import necessary modules and models

exports.getUserDetails = catchAsyncError(async (req, res, next) => {
  // Check if the user is authenticated (you should have middleware for this)
  // if (!req.isAuthenticated()) {
  //   return res.status(401).json({ success: false, message: "Unauthorized" });
  // }

  try {
    if (!req.user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }


    const {user} = req;
    // console.log('😂😂😂😂', JSON.stringify(user, null, 2));

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});


//UPDATE user password

exports.updatePassword=catchAsyncError(async (req, res, next)=>{

  const user=await User.findById(req.user.id).select("+password");

  
  const isPasswordMatched = user.comparePassword(req.body.oldPassword);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Old password is incorrect", 400));
  }

  if(req.body.newPassword!=req.body.confirmPassword){
    return next(new ErrorHandler("Password does not match", 400));
  }
user.password=req.body.newPassword;

await user.save();

sendToken(user,200,res);

});

//UPDATE user profile

exports.updateProfile=catchAsyncError(async (req, res, next)=>{

const newUserData={
  name:req.body.name,
  email:req.body.email,
}
if(req.body.avatar!==""){
  const user = await User.findById(req.user.id);
  const imageId=user.avatar.public_id;
  await cloudinary.v2.uploader.destroy(imageId);

  
  const myCloud= await cloudinary.v2.uploader.upload(req.body.avatar,{
    folder:"avatars",
    width: 150,
    crop: "scale",
  });


newUserData.avatar={
  public_id: myCloud.public_id,
  url: myCloud.secure_url,
}
}

const user=await User.findByIdAndUpdate(req.user.id, newUserData,{
  new:true,
  runValidators:true,
  useFindAndModify:false,
});

res.status(200).json({
  success:true,

})

});

//get all user(admin)

exports.getAllUser=catchAsyncError(async (req,res,next)=>{
  const users=await User.find();

  
res.status(200).json({
  success:true,
  users,
})

})

//get single user(admin)
exports.getSingleUser=catchAsyncError(async (req,res,next)=>{
  const user=await User.findById(req.params.id);

  if(!user){
    return next(new ErrorHandler(`User does not exit with Id: ${req.params.id}`))
  }
res.status(200).json({
  success:true,
  user,
});

});

//UPDATE user role--admin

exports.updateRole=catchAsyncError(async (req, res, next)=>{

  const newUserData={
    name:req.body.name,
    email:req.body.email,
    role:req.body.role,
  }
  
  const user=await User.findByIdAndUpdate(req.params.id, newUserData,{
    new:true,
    runValidators:true,
    useFindAndModify:false,
  });
  
  res.status(200).json({
    success:true,
  });
  
  });


exports.updateUserRole=catchAsyncError(async (req, res, next)=>{

  const newUserData={
    name:req.body.name,
    email:req.body.email,
    role:req.body.role,
  }
  
  const user=await User.findByIdAndUpdate(req.params.id, newUserData,{
    new:true,
    runValidators:true,
    useFindAndModify:false,
  });
  
  res.status(200).json({
    success:true,
  });
  
  });

  //dlete user-admin
  exports.deleteUser=catchAsyncError(async (req, res, next)=>{

   const user=await User.findById(req.params.id);

if(!user){
  return next(new ErrorHandler(`User does not exist with id: ${req.params.id}`));
}

await user.remove();
    
    res.status(200).json({
      success:true,
      message:"User deleted successfully",
    });
    
    });