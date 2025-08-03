const Home = require("../models/home");

const user = require("../models/user");

exports.getAdminDashBoard = async (req, res, next) => {
  try {
    const totalHomes = await Home.countDocuments();

    const totalUsers = await user.countDocuments();

    const users = await user.find({}, "bookings");

    const monthlyRevenue = new Array(12).fill(0);

    const bookingsPerMonth = new Array(12).fill(0);

    const bookingCountByHome = {}; // This creates an empty object to store each home’s booking count.
    //Key = home ID (string), Value = total bookings.

    console.log(users);

    let totalBookings = 0;
    let totalRevenue = 0;

    users.forEach((user) => {
      totalBookings += user.bookings.length;

      user.bookings.forEach((booking) => {
        totalRevenue += booking.amount || 0;

        if (booking.amount && booking.checkInDate) {
          const monthIndex = new Date(booking.checkInDate).getMonth();

          monthlyRevenue[monthIndex] += booking.amount;

          bookingsPerMonth[monthIndex] += 1;
        }

        // booking.home gives us the home’s ID (object), we convert it to string with .toString() to use it as a key in the object
        const homeId = booking.home.toString(); // convert into string

        bookingCountByHome[homeId] = (bookingCountByHome[homeId] || 0) + 1;
      });
    });

    // sort homes by booking in descending order
    //Object.entries() turns the object into an array of key-value pairs(key value pairs are also array ):

    //.sort((a, b) => b[1] - a[1]): Sorts the array by booking count (value at index 1) in descending order.

    //.slice(0, 5): Keeps only the top 5 most booked homes.

    const sortedHomeIds = Object.entries(bookingCountByHome)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    //now sortedHomeIds is a array which contain 5 arrays( each array has a 2 value a. homeId, b.no of booking of that homeId)

    // Fetch all home documents whose ID is in the top 5 list (means home id fetch from the sortedHomeIds)

    const topHomeIds = []; // Creates a topHomeIds array by extracting only home IDs from the sorted pairs.

    sortedHomeIds.forEach((pair) => {
      const id = pair[0]; // pair=[homeId,bookingCount]

      topHomeIds.push(id);
    });

    // now fetch the full home details using the topHomeIds array

    // Uses Home.find() to get all the homes whose _id is in that list.  $in is a MongoDB operator → means “match if _id is in this list”.
    const topHomes = await Home.find({
      _id: { $in: topHomeIds },
    });

    // attach booking count to each home  object

    const topHomesWithCount = []; // it will contain all top 5 home object(object also has the corrosponding number of booking)

    topHomes.forEach((home) => {
      // find no of booking of that home
      const count = bookingCountByHome[home._id.toString()] || 0;

      const homeObj = home.toObject(); // convert MOngoose doc to plain object

      // add count to that object
      homeObj.bookingCount = count;

      // push modified home to result array
      topHomesWithCount.push(homeObj);
    });

    console.log("top homes with count is ", topHomesWithCount);

    // now pass to ejs topHomesWithCount
    res.render("admin/dashboard", {
      pageTitle: "Admin Dashboard",
      totalHomes,
      totalUsers,
      totalBookings,
      totalRevenue,
      isLoggedIn: req.isLoggedIn,
      user: req.user,

      monthlyRevenue,

      bookingsPerMonth,
      topHomes: topHomesWithCount, // pass to ejs
    });
  } catch (err) {
    console.log("error loading dashboard page", err);

    res.status(500).send("Error loading dashboard");
  }
};
