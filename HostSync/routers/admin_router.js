const express = require("express");

const adminRouter = express.Router();

const adminController = require("../controllers/adminController");

// route for the admin dashboard page

adminRouter.get("/dashboard", adminController.getAdminDashBoard);

// now implement the getAdminDashBoard page

module.exports = adminRouter;
