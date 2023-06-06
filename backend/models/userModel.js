const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    require: [true, "Please Enter Your Name"],
    maxLength: [30, "Name cannot exceed 30 characters"],
    minLength: [4, "Name should have more than 5 characters"],
  },
  email: {
    type: String,
    require: [true, "Please enter your Email"],
    unique: true,
    validate: [validator.isEmail, "Please enter a avalid email"],
  },
  password: {
    type: String,
    required: [true, "Please enter your Password"],
    minlength: [8, "Password should be greater that 8 characters"],
    select: false,
  },
  avatar: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  role: {
    type: String,
    default: "user",
  },

  resetPasswordToken: String,
  resetPasswordExpire: Date,
});

userSchema.pre("save", async function (next) {
  //save karne se phele password ko convert kardo
  if (!this.isModified("password")) {
    next();
  }

  this.password = await bcrypt.hash(this.password, 10);
});

//JWT TOKEN
userSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

//compare Password
userSchema.methods.comparePassword = async function (password) {
  //function ka use isliye kyuki ham log this ka use karna chahte hai
  return await bcrypt.compare(password, this.password);
};

//generating password reset token
userSchema.methods.getResetPasswordToken = function () {
  //generating token
  const resetToken = crypto.randomBytes(20).toString("hex");

  //hashing and adding resetPsswordToken to userSchema
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

    this.resetPasswordExpire=Date.now() + 15*60*1000;

    return resetToken;
};

module.exports = mongoose.model("User", userSchema);
