const express = require("express");

const hostRouter = express.Router();

//  Import upload middleware

// This brings in the upload middleware that you created in utils/upload.js.

// This is the middleware powered by Cloudinary.

// Now, it’s ready to catch images sent from forms and upload them directly to Cloudinary.

const upload=require("../utils/upload");

const hostController = require("../controllers/hostController");

const checkHomeOwner = require("../middlewares/checkHomeOwner");

hostRouter.get("/host/edit-home", hostController.getAddHome);

hostRouter.get("/host-homes", hostController.getHostHomes);


// upload.single("homeImage")	This tells Multer to handle 1 file, with field name "homeImage" (from your HTML form where we upload the file - edit-home.ejs).
// hostController.postAddHome	After the image is uploaded to Cloudinary, this function will run to save home data in the DB.

hostRouter.post("/host/add-home",upload.single("homeImage"),hostController.postAddHome);

// What Happens When User Submits the Form?
// Form sends image file with the name "homeImage".

// upload.single(...) takes that image and uploads it to Cloudinary automatically.

// Cloudinary gives back a secure URL of that image.

// That URL is stored in req.file.path (you’ll use this in the controller).

// postAddHome in your controller now runs, and you can save the home + image URL in MongoDB.

hostRouter.get(
  "/host/edit-home/:homeId",
  checkHomeOwner,hostController.getEditHome
);


hostRouter.post("/host/edit-home",upload.single("homeImage"),hostController.postEditHome)


hostRouter.post("/host/delete-home/:homeId",checkHomeOwner,hostController.postDeleteHome);



exports.hostRouter = hostRouter;
