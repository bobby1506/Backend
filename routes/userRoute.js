// const { registerUser, loginUser, logout, forgotPassword, resetPassword, getUserDetails,updatePassword, updateProfile, getAllUser, getSingleUser, updateUserRole, deleteUser } = require("../controllers/userController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const express = require("express");
const router = express.Router();
const passport = require("passport");
const userModel = require("../models/userModel");
require("dotenv").config();

router.get(
  "/login",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: true,
  })
);
router.get("/login/success", async (req, res) => {
  const user = await userModel.findOne({ email: req.user?.emails[0].value });
  if (user) {
    res.status(200).json({
      success: true,
      messsage: "Log in successfully",
      user,
    });
  } else {
    res.status(401).json({
      success: false,
      message: "Not logged in",
    });
  }
});

router.get("/login/failed", (req, res) => {
  res.status(401).json({
    success: false,
    message: "Login failed",
  });
});

router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect(process.env.CLIENT_HOME);
  });
});

router.get(
  "/callback",
  passport.authenticate("google", {
    session: true,
    successRedirect: process.env.CLIENT_HOME,
    failureRedirect: "",
  })
);
// router.route("/me").get(isAuthenticatedUser, getUserDetails);
// router.route("/me/update").put(isAuthenticatedUser, updateProfile);
// router
//   .route("/admin/users")
//   .get(isAuthenticatedUser, authorizeRoles("admin"), getAllUser);
// router
//   .route("/admin/user/:id")
//   .get(isAuthenticatedUser, authorizeRoles("admin"), getSingleUser)
//   .put(isAuthenticatedUser, authorizeRoles("admin"), updateUserRole)
//   .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteUser);

module.exports = router;
