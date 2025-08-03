const user = require("../models/user");
const mongoose=require("mongoose")
const Home = require("../models/home");

exports.verifyReceipt= async (req,res) => {
      try {
          // get the booking id from the user who has this booking

           const bookingId = new mongoose.Types.ObjectId(req.params.bookingId);
          // search the user who has this booking
          
          console.log("booking id is ",bookingId);

          const bookingUser=await user.findOne({"bookings._id":bookingId});

          


          // if no user found ->  it means invalid receipt

          if(!bookingUser) {
              return res.status(404).send(`
                <h1 style="color:red;"> ❌ Invalid or Fake Receipt </h1>
                <p>This receipt is not present in our system. </p>`)
          }

          // get the specific booking info from users bookings

          const booking=bookingUser.bookings.find(b=> b._id.toString()===bookingId.toString());

          if(!booking) {
              return res.status(404).send(`
                <h1 style="color:red;">❌ Invalid Booking Entry</h1>
        <p>Booking ID not found in the user record.</p>
                `)
          }

          // get the booking home info 

           const homeId = booking.home;
          
             // now fetch all the information about that home
          
             const bookingHome = await Home.findById(homeId);
          
             const homeName = bookingHome.houseName;
             const location = bookingHome.location;
          

          return res.send(`
            <h1 style="color:green;">✅ Valid Booking Receipt</h1>
      <p><strong>Name:</strong> ${bookingUser.firstName} ${
            bookingUser.lastName
          }</p>
      <p><strong>Amount Paid:</strong> ₹${booking.amount}</p>
     
            <p><strong>Booked House:</strong> ${homeName}</p>
            <p><strong>Location:</strong> ${location}</p>

      <p><strong>Check-In:</strong> ${new Date(
        booking.checkInDate
      ).toDateString()}</p>
       <p><strong>Check-out:</strong> ${new Date(
         booking.checkOutDate
       ).toDateString()}</p>
            `);
      }catch(err) {
          console.log(err);
          res.status(500).send("Server Error");
      }
}