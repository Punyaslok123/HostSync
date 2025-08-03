// We import the Multer package.

//  Multer is a middleware used in Node.js to handle form-data — especially file uploads. Think of it like a helper that processes file uploads when a user submits a form with images.
const multer = require("multer");

// This line imports the storage engine we created in step- 4. That storage knows how to connect to Cloudinary, where to store files, and which file types to accept. Basically, this tells Multer:
// "Hey, don’t save files locally. Use this Cloudinary configuration instead."
const storage = require("./cloudinaryStorage");

//  We create a new upload object using multer().

// 🔄 Here, we tell Multer to use our custom Cloudinary storage instead of default disk storage.

// 🏞️ Now, whenever a user uploads an image, Multer will send that image to Cloudinary, not to your local uploads/ folder.
const upload = multer({ storage });

// 🔶 We export the upload object.
// 🚀 This makes it available for importing into your route files, like:
// 🧩 Once imported, you’ll plug it into your routes like:


module.exports = upload;
