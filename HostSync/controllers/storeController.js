const Home = require("../models/home");

const mongoose = require("mongoose");
const user = require("../models/user");

exports.getIndex = (req, res, next) => {
  console.log("session value is ", req.session);
  Home.find().then((registeredHomes, fields) => {
    console.log(registeredHomes);
    res.render("store/index", {
      registeredHomes: registeredHomes,
      pageTitle: "HostSync Home",
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
    });
  });
};

exports.getHomes = (req, res, next) => {
  Home.find().then((registeredHomes) => {
    console.log(registeredHomes);
    res.render("store/home-list", {
      registeredHomes: registeredHomes,
      pageTitle: "HostSync Home",
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
    });
  });
};

exports.getfavouriteList = async (req, res, next) => {
  //  console.log(req.session);
  // current user id find
  const userId = req.session.user._id;

  console.log("user id is ", userId);

  // populate current user all favourities
  const current_user = await user.findById(userId).populate("favourites");

  console.log("User  is -----", current_user);

  // now render all the favoulite of current user

  res.render("store/favourite-list", {
    FavouriteHomes: current_user.favourites,
    pageTitle: "my favourities",
    isLoggedIn: req.isLoggedIn,
    user: req.session.user,
  });
};

exports.getHomeDetails = (req, res, next) => {
  const homeId = req.params.homeId;

  // resolve the promise
  Home.findById(homeId).then((home) => {
    if (!home) {
      console.log("home not found");
      res.redirect("/homes");
    } else {
      console.log("home found", home);

      res.render("store/home-detail", {
        home: home, // rendering with that home details
        pageTitle: "Home detail",
        isLoggedIn: req.isLoggedIn,
        user: req.session.user,
      });
    }
  });
};

// add postAddFavourities

exports.postAddToFavourite = async (req, res, next) => {
  const homeId = req.body.id;

  const userId = req.session.user._id;

  const current_user = await user.findById(userId);

  // now add it into the current_user favourite list

  if (!current_user.favourites.includes(homeId)) {
    current_user.favourites.push(homeId);
    await current_user.save();
  }

  res.redirect("/favourite-list");
};

exports.postRemoveFromFavourite = async (req, res, next) => {
  const homeId = req.params.homeId;
  const userId = req.session.user._id;

  const current_user = await user.findById(userId);

  if (current_user.favourites.includes(homeId)) {
    current_user.favourites = current_user.favourites.filter(
      (fav) => fav.toString() !== homeId.toString()
    );

    await current_user.save();
  }

  res.redirect("/favourite-list");
};

// add the searchHome function

exports.searchHomes = async (req, res, next) => {
  const location = req.query.location || ""; // get the location from the url

  const minPrice = parseInt(req.query.minPrice) || 0; // get the min proce from the url , if not given then bydefault take 0

  const maxPrice = parseInt(req.query.maxPrice) || Number.MAX_VALUE; // get the max value from the url , if not given then bydefault take the maxmimum int value

  const minRating = parseFloat(req.query.minRating) || 0; // get the min Rating from th url, if not given by default take 0

  const sortOption = req.query.sort; // for sorting (ex- newest , cheapest,price low to high, price high to low)  . Extracts the user's dropdown choice like "newest", "cheapest", etc

  let sortQuery = {}; //  Default: no sort if user didn't select anything

  if (sortOption === "newest") {
    sortQuery = { _id: -1 };
    // Sorts by newest — in MongoDB, newer documents have larger _id
  } else if (sortOption === "priceLowToHigh") {
    sortQuery = { price: 1 };
  } else if (sortOption === "priceHighToLow") {
    sortQuery = { price: -1 };
  } else if (sortOption === "ratingHighToLow") {
    sortQuery = { rating: -1 };
  }

  // Build the query object by using these given value
  //✔ We're building a dynamic MongoDB query that says:
  // "Show homes whose location includes this, price is between min–max, and rating is above X"

  const query = {
    location: { $regex: location, $options: "i" },

    price: { $gte: minPrice, $lte: maxPrice },

    rating: { $gte: minRating },
  };

  try {
    // const homes=await Home.find({
    //    location:{$regex: location, $options:"i"},
    // })

    // const homes = await Home.find(query);
    const homes = await Home.find(query).sort(sortQuery); // these apply filter on both query and sortQuery

    // now render this homes in the home list

    res.render("store/home-list", {
      registeredHomes: homes,
      pageTitle: `Search Results for ${location}`,
      isLoggedIn: req.isLoggedIn,
      user: req.user,
    });
  } catch (err) {
    res.status(500).send("Error while searching homes");
  }
};
