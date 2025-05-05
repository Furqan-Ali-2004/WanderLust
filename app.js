if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const localStrategy = require("passport-local");
const User = require("./models/user.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

const dbUrl = process.env.ATLASDB_URL;

main()
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error(err);
  });

async function main() {
  await mongoose.connect(dbUrl);
}

app.set("view engine", "ejs"); // to set the view engine
app.set("views", path.join(__dirname, "views")); // to set the views directory
app.use(express.static(path.join(__dirname, "public"))); // to serve static files
app.use(express.urlencoded({ extended: true })); // to parse the form data
app.use(methodOverride("_method")); // to use put and delete requests
app.engine("ejs", ejsMate); // to use ejs-mate

const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
    secret: process.env.SECRET,
  },
  touchAfter: 24 * 3600,
});

store.on("error", function (e) {
  console.log("ERROR in MONGO SESSION STORE", e);
});

const sessionOptions = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true, // to prevent client-side JavaScript from accessing the cookie
  },
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize()); // to initialize passport
app.use(passport.session()); // to use passport session
passport.use(new localStrategy(User.authenticate())); // to use local strategy for authentication

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user; // to set the current user
  next();
});

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

// 404 ROUTE
app.all("*", (req, res, next) => {
  next(new ExpressError("Page not found", 404));
});

app.use((err, req, res, next) => {
  let { message = "Something went wrong!", statusCode = 500 } = err;
  res.status(statusCode).render("./listings/error.ejs", { message });
});

app.listen(8080, () => {
  console.log("Server is running on port 8080");
});
