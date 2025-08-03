// Imports Mongoose so we can define a schema.
const mongoose=require('mongoose');

// create a new mongoose schema for storing the chat message(Defines the shape of a chat message document — how it looks in the database.) 


const messageSchema = new mongoose.Schema(
  {
    thread: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Thread",
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    type: {
      type: String, // guest/host
      enum: ["host", "guest", "admin"],
      required: true,
    },

    message: {
      type: String, // actual chat message
      required: true,
    },

    seen: {
      type: Boolean,
      default: false, // ✅ unseen initially
    },
  },
  {
    timestamps: true,
  }
);


// Registers the schema as a model named Message — so we can use it like:
module.exports=mongoose.model("Message",messageSchema);