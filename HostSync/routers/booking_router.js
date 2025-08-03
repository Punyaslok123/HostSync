const express = require("express");

const bookingRouter = express.Router();

const bookingController = require("../controllers/bookingController");

bookingRouter.get("/homes/reserve/:homeId", bookingController.getReservePage);


bookingRouter.post("/reserve/:homeId", bookingController.createOrder);



bookingRouter.post("/create-order", bookingController.createOrder);


bookingRouter.post("/verify-payment",bookingController.verifyPayment);
 

bookingRouter.get("/bookings", bookingController.getGuestBookings);

bookingRouter.get("/payment-success",bookingController.getPaymentSuccess);


bookingRouter.get("/cancel/:homeId", bookingController.getCancelBooking);

// router to handle the download receipt 

bookingRouter.get("/bookings/receipt/:id",bookingController.generateReceipt);

module.exports = bookingRouter;
