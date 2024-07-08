const passport = require("passport");
const userModel = require("../models/userModel");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
require("dotenv").config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOLGE_CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URI,
    },
    async (accessToken, refreshToken, profile, cb) => {
    //   console.log("Access Token: " + accessToken);
    //   console.log("Reffresh Token: " + refreshToken);
      let user = await userModel.findOne({ email: profile.emails[0].value });
      if (user) {
        cb(null, profile);
      } else {
        user = await userModel.create({
          name: profile.displayName,
          email: profile.emails[0].value,
          avatar: { url: profile.photos[0].value },
        });
        cb(null, profile);
      }
    }
  )
);
 
passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((user, cb) => {
  cb(null, user);
});
