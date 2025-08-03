exports.getAddHome = (req, res, next) => {
  res.render("/host/edit-home", {
    pageTitle: "Register Home",
    isLoggedIn: req.isLoggedIn,
    user: req.session.user,
  });
};

const Home = require("../models/home");

exports.postAddHome = (req, res, next) => {
  console.log("home registration is successful for : ", req.body);

  const home = new Home(
    req.body.houseName,
    req.body.price,
    req.body.location,
    req.body.rating,
    req.body.photo
  );

  home.save();

  res.render("host/go_home", {
    pageTitle: "Go again home",
    isLoggedIn: req.isLoggedIn,
    user: req.session.user,
  });
};

exports.getHomes = (req, res, next) => {
  Home.find((registeredHomes) => {
    console.log(registeredHomes);
    res.render("store/home-list", {
      registeredHomes: registeredHomes,
      pageTitle: "HostSync Home",
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
    });
  });
};
