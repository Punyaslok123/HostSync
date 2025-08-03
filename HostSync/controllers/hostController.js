const Home = require("../models/home");

const fs = require("fs");
exports.getAddHome = (req, res, next) => {
  res.render("host/edit-home", {
    pageTitle: "Register Home",
    editing: false,
    isLoggedIn: req.isLoggedIn,
    user: req.session.user,
  });
};

exports.getEditHome = (req, res, next) => {
  const homeId = req.params.homeId;
  const editing = req.query.editing;
  console.log("parameter, queryparameter", homeId, editing);
  Home.findById(homeId).then((home) => {
    if (!home) {
      console.log("home is not found");
      return res.redirect("/host-homes");
    }

    console.log(home);
    res.render("host/edit-home", {
      home: home,
      pageTitle: "Edit your Home",
      currentPage: "host-homes",
      editing: editing,
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
    });
  });
};

exports.postEditHome = (req, res, next) => {
  const { _id, houseName, price, location, rating, description } = req.body;

  console.log("id is ", _id);

  Home.findById(_id)
    .then((home) => {
      home.houseName = houseName;
      home.price = price;
      home.location = location;
      home.rating = rating;

      home.description = description;

      if (req.file) {
        fs.unlink(home.photo, (err) => {
          if (err) console.log("error comes during deleting the photo", err);
        });

        home.photo = req.file.path;
      }

      home
        .save()
        .then((result) => {
          console.log("Home updated", result);
          res.redirect("/host-homes");
        })
        .catch((err) => {
          console.log("Error while updating the home");
        });
    })
    .catch((error) => {
      console.log("error during findding the home");
    });
};

exports.postDeleteHome = (req, res, next) => {
  const homeId = req.params.homeId;
  console.log("came to delete", homeId);

  Home.findByIdAndDelete(homeId)
    .then(() => {
      res.redirect("/host-homes");
    })
    .catch((error) => {
      console.log("error while deleting", error);
    });
};

exports.postAddHome = (req, res, next) => {
  console.log("req.body is ", req.body);

  const { houseName, price, location, rating, description } = req.body;

  console.log("file --", req.file);

  if (!req.file) {
    return res.status(422).send("No image provided");
  }

  //  req.file.path is the Cloudinary image URL of the uploaded file.
  const photo = req.file.path;

  const home = new Home({
    houseName,
    price,
    location,
    rating,
    photo,
    description,
    owner: req.session.user._id,
  });

  home.save().then(() => {
    console.log("Home saved successfully");
  });

  res.render("host/go_home", {
    pageTitle: "Go again home",
    isLoggedIn: req.isLoggedIn,
    user: req.session.user,
  });
};

exports.getHostHomes = (req, res, next) => {
  Home.find().then((registeredHomes) => {
    console.log(registeredHomes);
    res.render("host/host-home-list", {
      registeredHomes: registeredHomes,
      pageTitle: "Host Homes",
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
    });
  });
};
