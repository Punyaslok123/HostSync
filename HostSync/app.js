require("dotenv").config();
const path = require("path");
const rootDir = require("./utils/path.js");
const express = require("express");
const app = express();
app.use(express.json());
const session = require("express-session");

const MongoDBStore = require("connect-mongodb-session")(session);

const db_path =process.env.MONGO_URI;

const store = new MongoDBStore({
  uri: db_path,
  collection: "sessions",
});

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store,
  })
);

app.use((req, res, next) => {
  req.isLoggedIn = req.session.isLoggedIn;

  if (req.session.user) {
    req.user = req.session.user;
  }

  next();
});

app.use(express.urlencoded({ extended: true }));

const multer = require("multer");

const bookingRouter = require("./routers/booking_router.js");
app.use(bookingRouter);

const { default: mongoose } = require("mongoose");

const randomString = (length) => {
  const characters = "abcdefghijklmnopqrstuvwxyz";

  let str = "";

  for (let i = 0; i < length; i++)
    str = str + characters[Math.floor(Math.random() * length)];

  return str;
};

// const storage = multer.diskStorage({
//   destination: (req, res, cb) => {
//     cb(null, "uploads/");
//   },

//   filename: (req, file, cb) => {
//     cb(null, randomString(10) + "-" + file.originalname);
//   },
// });

// const fileFilter = (req, file, cb) => {
//   if (
//     file.mimetype === "image/png" ||
//     file.mimetype === "image/jpeg" ||
//     file.mimetype === "image/jpg"
//   ) {
//     cb(null, true);
//   } else cb(null, false);
// };

// app.use(multer({ storage, fileFilter }).single("photo"));

app.set("view engine", "ejs");
app.set("views", "views");

const storeRouter = require("./routers/storeRouter.js");

const authRouter = require("./routers/auth_router.js");
app.use(authRouter);

const adminRouter = require("./routers/admin_router.js");

app.use(adminRouter);

// receiptRouter registered

const receiptRouter = require("./routers/receipt_router");

app.use(receiptRouter);

const chatRouter = require("./routers/chat_router.js");
app.use(chatRouter);

app.use("/host", (req, res, next) => {
  if (req.isLoggedIn) {
    next();
  } else res.redirect("/login");
});

app.use((req, res, next) => {
  console.log(req.url, req.method);
  next();
});

app.use(storeRouter);

const { hostRouter } = require("./routers/host_router.js");

app.use(express.static("public"));

app.use("/uploads", express.static(path.join(rootDir, "uploads")));

app.use("/homes/uploads", express.static(path.join(rootDir, "uploads")));

app.use(hostRouter);

const errorController = require("./controllers/error.js");
const { threadId } = require("worker_threads");

app.use(errorController.pageNotFound);

const port = process.env.PORT;

mongoose
  .connect(db_path)
  .then(() => {
    console.log("connected to Mongo");

    const http = require("http");
    const socketio = require("socket.io");

    const server = http.createServer(app);
    const io = socketio(server);

    app.set("io", io);

    const Message = require("./models/message");
    const Thread = require("./models/thread");

    io.on("connection", (socket) => {
      console.log("New User connected:", socket.id);

      socket.on("joinroom", (threadId) => {
        socket.join(threadId);
        console.log(`socket ${socket.id} joined thread ${threadId}`);
      });

      // handle the sendMessage event

      socket.on("markSeen", async ({ threadId, userId }) => {
        try {
          // ✅ Find all messages in this thread that:
          //  - were NOT sent by me (i.e. sender ≠ userId)
          //  - and are still unseen

          const updated = await Message.updateMany(
            {
              thread: threadId,
              sender: { $ne: userId },
              seen: false,
            },
            {
              $set: { seen: true },
            }
          );

          console.log("✅ [Backend] markSeen received from", userId);

          // ✅ now reciver Notify others in the room that messages were seen by me (receiver) now.
          if (updated.modifiedCount > 0) {
            console.log("📢 [Backend] Emitting messageSeen to room:", threadId);
            io.to(threadId).emit("messageSeen", {
              seenBy: userId,
              threadId: threadId,
            });
          }
        } catch (err) {
          console.log("error marking messages seen", err);
        }

        // now handle the forntend messageSeen event
      });
      socket.on("sendMessage", async (data) => {
        console.log("data is ", data);
        const { room, sender, message, type } = data;

        const savedMsg = await Message.create({
          sender,
          message,
          thread: room,
          type,
        });

        await Thread.findByIdAndUpdate(room, {
          $push: { messages: savedMsg._id },
        });
        
        io.to(room).emit("receiveMessage", {
          _id: savedMsg._id, //send the message Id
          sender,
          message,
          createdAt: savedMsg.createdAt,
          seen: savedMsg.seen, //initially false
        });
      });

      socket.on("disconnect", () => {
        console.log("User is disconnected", socket.id);
      });
    });

    server.listen(port, () => {
      console.log(`server is running on the address http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.log("error while connecting to Mongo", error);
  });
