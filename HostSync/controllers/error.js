exports.pageNotFound = (req, res, next) => {
  res.render("404", {
    pageTitle: "404 not found",
    isLoggedIn: req.isLoggedIn,
    user: req.session.user,
  });
};