//  ✅ Import Cloudinary and the special storage engine that connects it with Multer.
const { CloudinaryStorage } = require("multer-storage-cloudinary");
// multer-storage-cloudinary is a package that connects Multer and Cloudinary together.It helps send the uploaded file straight to Cloudinary.

// so here , we are bringing in the storage engine from multer-storage-cloudinary.

// And importing your Cloudinary setup from cloudinary.js file so this file knows which Cloudinary account to talk to.

const cloudinary = require("./cloudinary");

//Create the Cloudinary Storage Engine
const storage = new CloudinaryStorage({
  // This tells Multer which Cloudinary account to use (the one you set up using credentials).

  cloudinary: cloudinary,

  //   This tells Cloudinary:
  // “Save all uploaded files in a folder called HostSync inside my Cloudinary account.”
  // (This folder is automatically created if it doesn't exist.)

  params: {
    folder: "HostSync",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

// So, in summary:

// "Hey Multer, whenever a user uploads a file, upload it to my Cloudinary account in the HostSync folder, and only allow image files."

// Export the storage engine

// This makes the storage object available to other files in your project (like your routes where the upload happens).

// So later, when you want to use Multer and say "store this file in Cloudinary", you’ll import this storage and plug it in like this:

// const upload = multer({ storage });

module.exports = storage;
