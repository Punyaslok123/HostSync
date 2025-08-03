const mongoose=require("mongoose");  // Importing mongoose, the library used to define schemas and models and interact with MongoDB.


//  Defining a new Mongoose schema named otpTokenSchema.

// 🔹 This schema describes how the OTP document will look inside the OtpToken collection.


//  email field will store the user's email address.

// 🔹 type: String → it must be a string.

// 🔹 required: true → must be provided; can’t be empty.

// 🔹 unique: true → only one OTP per email is allowed at a time (prevents multiple OTPs being saved for same email).

// 🔹 otp field will store the generated OTP code.

// 🔹 type: String → storing OTP as a string (even if it's numeric like "849102").


// 🔹 expiresAt field will store the expiry time of the OTP (example: 5 minutes after it was created).

// 🔹 type: Date → to store exact expiry timestamp.

// 🔹 Helps us check later: is the OTP still valid or expired?

// 🔹 userData will store the entire signup form data the user entered (e.g., name, password, phone).

// 🔹 You keep it here until OTP is verified. After that, you’ll use it to create the real user in your main User model.
const otpTokenSchema=new mongoose.Schema({
    email : {
        type:String,
        required:true,
        unique:true,
    },

    otp: {
         type:String,
         required:true
    },
    expiresAt: {
        type:Date,
        required:true,
    },

    userData: {
         type:Object,
         required:true
    }

})

// 🔹 Exporting a Mongoose model named OtpToken, based on the schema.

// 🔹 You can now use this model to save(), find(), delete() OTP entries in your database.

module.exports=mongoose.model("OtpToken",otpTokenSchema);