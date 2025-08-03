const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "First name is required"],
  },

  lastName: {
    type: String,
    required: [true, "Last name is required"],
  },

  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
  },

  password: {
    type: String,
    required: [true, "Password id required"],
  },

  UserType: {
    type: String,
    enum: ["guest", "host","admin"],
    default: "guest",
  },

  favourites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Home",
    },
  ],

  bookings: [
    {
      home: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Home", // to access the that home details need to link with the Home model
        required: true,
      },
      checkInDate: {
        type: Date,
        required: true,
      },
      checkOutDate: {
        type: Date,
        required: true,
      },
      amount:Number,
      status: {
        type: String,
        enum: ["pending", "confirmed", "cancelled", "completed"],
        default: "pending",
      },
      razorpay: {
        paymentId: String, // Unique ID of the payment from Razorpay
        orderId: String, // Razorpay order ID
        status: String, // Usually "paid"
      },
    },
  ],

  // New fields for reset password functionality

  resetToken: String, // will store the unique reset token

  resetTokenExpiration: Date, // will store the expiration time of token
});

module.exports = mongoose.model("user", userSchema);
