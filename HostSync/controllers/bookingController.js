const Home = require("../models/home");
const user = require("../models/user");

const razorpayInstance = require("../utilities/razorpayUtil");

const crypto = require("crypto");

const mongoose = require("mongoose");

exports.getReservePage = async (req, res, next) => {
  const homeId = req.params.homeId;
  const home = await Home.findById(homeId);

  //1.find all the users who have booking for this home

  const usersWithBooking = await user.find({ "bookings.home": homeId }); // store all the user which has this homeId booking (that user also contain another home bookings )

  //2.Initialize an array to store all booked calendar dates.

  let bookedDates = [];

  // looped through each users booking

  for (const user of usersWithBooking) {
    // loop through that user bookings array to  find that homeid booking date
    for (const booking of user.bookings) {
      if (booking.home.toString() === homeId.toString()) {
        // Convert check-in & check-out to Date objects

        const startDate = new Date(booking.checkInDate);

        const endDate = new Date(booking.checkOutDate);

        //  Loop through each day between start and end

        let current = new Date(startDate);

        while (current <= endDate) {
          // Format: "YYYY-MM-DD"

          const datestr = current.toISOString().split("T")[0];

          bookedDates.push(datestr);

          // move to the nest day

          current.setDate(current.getDate() + 1);
        }
      }
    }
  }

  // remove duplicates (if overlapping bookings exist)

  bookedDates = [...new Set(bookedDates)];

  // ✅ 6. Render the booking form page with bookedDates passed

  res.render("store/reserve", {
    home,
    pageTitle: "Book you home",
    isLoggedIn: req.isLoggedIn,
    user: req.user,
    razorpayKey: process.env.RAZORPAY_KEY_ID,
    bookedDates, // pass it to the ejs template
  });
};

exports.createOrder = async (req, res, next) => {
  console.log(req.body);

  const { homeId, amount, checkInDate, checkOutDate } = req.body;

  if (!homeId || !checkInDate || !checkOutDate || !amount) {
    return res.status(400).json({ error: "Missing booking details" });
  }

  const options = {
    amount: amount * 100,
    currency: "INR",
    receipt: `receipt_order_${new Date().getTime()}`,
  };

  try {
    const order = await razorpayInstance.orders.create(options);

    console.log("successfully created");

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    console.log("Rozarpay Order Error", err);

    res.status(500).json({ error: "Failed to create Razorpay order" });
  }
};

exports.verifyPayment = async (req, res, next) => {
  const {
    paymentId,
    orderId,
    Signature,
    homeId,
    // price,
    amount,
    checkInDate,
    checkOutDate,
  } = req.body;

  const body = orderId + "|" + paymentId;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  const isVerified = expectedSignature === Signature;

  if (isVerified) {
    const user = require("../models/user");

    const current_user = await user.findById(req.session.user._id);

    // 1. load all the user who have the bookings for this home

    const allUsers = await user.find({ "booking.home": homeId }); // contain all the user who has the booking of that home which a guest want to book now

    // Step 2: Convert the new booking dates to real Date objects

    const newCheckIn = new Date(checkInDate);

    const newCheckOut = new Date(checkOutDate);

    // 🔄 Step 3: Loop through all bookings of all users for this home

    for (const u of allUsers) {
      for (const booking of u.bookings) {
        // ✅ Check only bookings for this same home

        if (booking.home.toString() === homeId) {
          // find that guest check in and check out

          const existingCheckIn = new Date(booking.checkInDate);

          const existingCheckOut = new Date(booking.checkOutDate);

          // check if that date overlao with current booking date

          const isOverlap =
            newCheckIn < existingCheckOut || newCheckOut > existingCheckIn;

          // if isOverlap then date are not available,return an error to frontend

          if (isOverlap) {
            return res.status(409).json({
              success: false,
              message: "This home is already booked for the selected dates.",
            });
          }
        }
      }
    }

    console.log("after verification total amount is", amount);

    current_user.bookings.push({
      home: homeId,
      checkInDate,
      checkOutDate,
      // price,
      amount,
      razorpay: {
        paymentId,
        orderId,
        status: "paid",
      },
    });

    await current_user.save();

    res.status(200).json({
      success: true,
      redirectUrl: `/payment-success?paymentId=${paymentId}`,
    });
  } else {
    return res
      .status(400)
      .json({ success: false, message: "Invalid Signature" });
  }
};

exports.getPaymentSuccess = async (req, res, next) => {
  const paymentId = req.query.paymentId;
  const userId = req.session.user._id;

  const current_user = await user.findById(userId).populate("bookings.home");

  const booking = current_user.bookings.find(
    (b) => b.razorpay.paymentId === paymentId
  );

  if (!booking) return res.redirect("/bookings");

  res.render("store/payment-success", {
    pageTitle: "Payment Successful",
    booking,
    paymentId,
    user,
    isLoggedIn: req.isLoggedIn,
  });
};
exports.getGuestBookings = async (req, res, next) => {
  const userId = req.session.user._id;

  const current_user = await user.findById(userId).populate("bookings.home");

  console.log("current user bookigs ", current_user.bookings);

  res.render("store/bookings", {
    bookings: current_user.bookings,
    pageTitle: "my bookings",
    isLoggedIn: req.isLoggedIn,
    user: req.session.user,
  });
};

exports.getCancelBooking = async (req, res, next) => {
  console.log("inside the getCancelBookings");

  const homeId = req.params.homeId;

  const userId = req.session.user._id;

  const current_user = await user.findById(userId);

  const matchBookings = current_user.bookings.filter(
    (booking) => booking && booking.home && booking.home.toString() === homeId
  );

  const presentInBooking = matchBookings.length > 0;

  if (presentInBooking) {
    current_user.bookings = current_user.bookings.filter((booking) => {
      return booking.home.toString() !== homeId.toString();
    });

    await current_user.save();
  }

  res.redirect("/bookings");
};

// This line imports the pdfkit library, which lets us create PDF documents in Node.js.

const PDFDocument = require("pdfkit");

const QRCode = require("qrcode");

// fucntion to generate the pdf with all informations

// It runs when a user clicks “Download Receipt”.

// The req object contains the booking ID (from the route param like /receipt/:id).

exports.generateReceipt = async (req, res, next) => {
  try {
    const bookingId = new mongoose.Types.ObjectId(req.params.id);

    // now we got the booking id (means that receipt id), so our target is to fetch the user which contain this booking id , and the home informations (means for that booking id consisting booking home )
    const booking_user = await user.findOne({ "bookings._id": bookingId });

    if (!booking_user) {
      console.log("user not found");
      return null;
    }

    console.log("booking user is ", booking_user);
    // find the specific booking within the users booking

    // We use .toString() because MongoDB ObjectId must be compared as string.

    const booking = booking_user.bookings.find(
      (b) => b._id.toString() === bookingId.toString()
    );

    if (!booking) {
      console.log("Booking not found in users bookings");
      return null;
    }
    // store all the user informations

    const userFirstName = booking_user.firstName;
    const userLastName = booking_user.lastName;

    // store all  booking information

    const bookingAmount = booking.amount;

    const checkIn = booking.checkInDate;
    const checkOut = booking.checkOutDate;

    // take that homeid so that we also know about the booking home

    const homeId = booking.home;

    // now fetch all the information about that home

    const bookingHome = await Home.findById(homeId);

    const homeName = bookingHome.houseName;
    const location = bookingHome.location;

    //  This creates a new blank PDF document using pdfkit.

    const doc = new PDFDocument();

    res.setHeader("Content-Type", "application/pdf");

    res.setHeader("Content-Disposition", "attachment; filename=receipt.pdf");

    doc.pipe(res);

    // Write Content in PDF

    doc
      .fontSize(26)
      .fillColor("#1a1a1a")
      .text("HostSync Receipt", { align: "center", underline: true });

    doc.moveDown(2); // adds space

    doc.fontSize(14).fillColor("#333");

    doc
      .text(`Receipt ID:`, { continued: true })
      .font("Helvetica-Bold")
      .text(` ${bookingId}`, { continued: false });

    doc.moveDown(1.1);
    doc
      .font("Helvetica")
      .text(`Customer Name:`, { continued: true })
      .font("Helvetica-Bold")
      .text(` ${userFirstName} ${userLastName}`);
    doc.moveDown(1.1);
    doc
      .font("Helvetica")
      .text(`Booked Home:`, { continued: true })
      .font("Helvetica-Bold")
      .text(` ${homeName}`);

    doc.moveDown(1.1);

    doc
      .font("Helvetica")
      .text(`Location:`, { continued: true })
      .font("Helvetica-Bold")
      .text(` ${location}`);

    doc.moveDown(1.1);
    doc
      .font("Helvetica")
      .text(`Check-in:`, { continued: true })
      .font("Helvetica-Bold")
      .text(` ${checkIn.toDateString()}`);

    doc.moveDown(1.1);
    doc
      .font("Helvetica")
      .text(`Check-out:`, { continued: true })
      .font("Helvetica-Bold")
      .text(` ${checkOut.toDateString()}`);

    doc.moveDown(1.1);
    doc
      .font("Helvetica")
      .text(`Total Amount Paid:`, { continued: true })
      .font("Helvetica-Bold")
      .text(` ₹${bookingAmount}`);

    doc.moveDown(1.5);
    doc
      .font("Helvetica")
      .fontSize(12)
      .fillColor("#666")
      .text("This receipt is generated from our official HostSync website", {
        align: "center",
      });

    doc.moveDown(2);

    // next step - the verification receipt (QR Code)

    // create a verify Url , this url will be encoded in the QR code(it means when someone scan the QR code this link will open )
    const verifyUrl = `/verify-booking/${bookingId}`;

    const qrCodeDataURL = await QRCode.toDataURL(verifyUrl);

    // draw the qr code and placed it in the center position

    const imageSize = 120;

    // manually calculate the center position in the horizontal direction
    const centerX = (doc.page.width - imageSize) / 2;

    const imageY = doc.y;

    //  ✔ This will place the image horizontally centered at the current vertical position (doc.y), which is what you expect.

    doc.image(qrCodeDataURL, centerX, imageY, {
      fit: [imageSize, imageSize],
      align: "center",
    });

    // done QR generated to do verification
    // push the y position below the image

    doc.y = imageY + imageSize + 17;
    doc
      .fontSize(10)
      .fillColor("#888")
      .text("Please Scan to verify booking receipt", {
        align: "center",
      });

    // Finish the PDF and send it , This tells PDFKit: “We're done writing the file — send it!”

    // ***add issued by - punyaslok nath in the extreme right position of the bottom of my pdf

    const footerText = "Issued by : Punyaslok Nath";

    // measure the width of the text to align it to the right

    const textWidth = doc.widthOfString(footerText);

    const bottomMargin = 50;

    // set the exact x and y to draw the text at the bottom right
    const x = doc.page.width - textWidth - 40;

    const y = doc.page.height - bottomMargin;

    doc.text(footerText, x, y, {
      lineBreak: false,
    });

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};
