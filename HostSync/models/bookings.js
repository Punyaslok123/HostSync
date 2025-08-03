// We are creating a new collection/table in MongoDB called Booking to store each user's booking of a home with their check-in and check-out dates.




const mongoose=require('mongoose');

const bookingSchema=new mongoose.Schema({
     user:{
          type:mongoose.Schema.Types.ObjectId,
          ref:"user",
          required:true,
     },

     home:{
         type:mongoose.Schema.Types.ObjectId,
         ref:"Home",
         required:true,
     },

     checkInDate : {
          type:Date,
          required:true,
     },

     checkOutDate: {
          type:Date,
          required:true,
     },

     status:{
         type:String,
         enum:["confirmed","cancelled"],
         default:"confirmed",

     }
})

module.exports=mongoose.model("Booking",bookingSchema)