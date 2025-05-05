const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const passport = require("passport");
const User = require("../models/user.js");
const { saveRedirectUrl } = require("../middleware.js");

const userController = require("../controllers/users.js");

// This route will show all users and create a new user
router
  .route("/signup")
  .get(userController.renderSignupForm)
  .post(wrapAsync(userController.signup));

// This route will show the login form and handle login requests
router
  .route("/login")
  .get(userController.renderLoginForm)
  .post(
    saveRedirectUrl,
    passport.authenticate("local", {
      failureRedirect: "/login",
      failureFlash: true,
    }),
    // This Line is for the redirect after login
    userController.login
  );

// Route to handle user logout
router.get("/logout", userController.logout);

module.exports = router;
