const ErrorHandler = require("../utils/errorhandler");
require("dotenv").config();

//passport auth config
function ensurAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect(process.env.CLIENT_HOME);
}
module.exports.isAuthenticatedUser = ensurAuthenticated;

exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          `Role:${req.user.role} is not allowed to access this resource`,
          403 //403 refuse to access
        )
      );
    }
    next();
  };
};

//hamne jwt token use kiya hai jo bhi loging hoga uske liye if vo login nahi hoga then uska token bhi nahi milegaa
