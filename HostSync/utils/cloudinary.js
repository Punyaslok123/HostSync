//  What it does:

// This line imports the Cloudinary library into your file.

// We use .v2 to get version 2 of the SDK, which is the most commonly used and latest version.

//  Cloudinary SDK gives your Node.js app the power to upload, delete, rename, or transform images on Cloudinary’s servers.


const cloudinary=require("cloudinary").v2;


// ✅ Configure Cloudinary with the credentials from your .env file.

// .config({ ... }) sets up your login credentials( your login details ) to Cloudinary so it knows: means ou are telling Cloudinary:“Hey! I’m logging in with this account. Let me use your services (upload, delete, etc.)”

// Which account you're using (cloud_name)

// Your unique login ID (api_key)

// Your secret password (api_secret)

//  These credentials are stored safely in .env file:
cloudinary.config({
      cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
      api_key:process.env.CLOUDINARY_API_KEY,
      api_secret:process.env.CLOUDINARY_API_SECRET,
})

// ✅ Export it so other files can use this configured instance.



// This line exports your configured Cloudinary instance.
module.exports=cloudinary;