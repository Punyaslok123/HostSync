const express = require("express");
const path = require("path");

const storeRouter = express.Router();

const storeController = require("../controllers/storeController");

storeRouter.get("/", storeController.getIndex);

storeRouter.get("/homes", storeController.getHomes);


storeRouter.get("/favourite-list", storeController.getfavouriteList);


storeRouter.get("/homes/:homeId",storeController.getHomeDetails);


storeRouter.post("/favourities",storeController.postAddToFavourite)


storeRouter.post(
  "/favourities/delete/:homeId",
  storeController.postRemoveFromFavourite
);

// add the router for the /search request

storeRouter.get("/search",storeController.searchHomes);

// implement the searchHomes function in the storeController



module.exports = storeRouter;

