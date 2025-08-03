const mongoose = require("mongoose");
const user=require("./user");

const homeSchema = mongoose.Schema({
  houseName: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
  },
  photo: String,
 
  description: String,

  // add the owner field
  owner: {
     type:mongoose.Schema.Types.ObjectId,
     ref:"user",
     required:true,
  }
});

homeSchema.pre("findOneAndDelete", async function (next) {
  const homeId = this.getQuery()._id;

   await user.updateMany(
       { favourites: homeId },
       { $pull: { favourites: homeId } }
     );
});

module.exports = mongoose.model("Home", homeSchema);
