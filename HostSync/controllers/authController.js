const { check, validationResult } = require("express-validator");
const user = require("../models/user");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const OtpToken=require("../models/otpToken");

const nodemailer = require("nodemailer");
exports.getLogin = (req, res, next) => {
  res.render("auth/login", {
    pageTitle: "Login",
    isLoggedIn: false,
    errors: [],
    oldInput: { email: "" },
    user: {},
  });
};

exports.postLogin = async (req, res, next) => {
  console.log("came inside the postlogin ", req.body);

  const { email, password } = req.body;

  const findUser = await user.findOne({ email });

  if (!findUser) {
    return res.status(422).render("auth/login", {
      pageTitle: "Login",
      isLoggedIn: false,
      errors: ["User does not exist"],
      oldInput: { email },
      user: {},
    });
  }

  const isMatch = await bcrypt.compare(password, findUser.password);

  if (!isMatch) {
    return res.status(422).render("auth/login", {
      pageTitle: "Login",
      isLoggedIn: false,
      errors: ["Invalid password"],
      oldInput: { email },
      user: {},
    });
  }

  req.session.isLoggedIn = true;
  req.session.user = findUser;
  await req.session.save();
  res.redirect("/");
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
};

exports.getSignUp = (req, res, next) => {
  res.render("auth/signup", {
    pageTitle: "signUp",
    isLoggedIn: false,
    errors: [],
    oldInput: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      UserType: "",
    },
    user: {},
  });
};

exports.postSignUp = [
  check("firstName")
    .trim()
    .isLength({ min: 2 })
    .withMessage("first name should atleast 2 characters long")
    .matches(/^[A-Za-z\s]*$/)
    .withMessage("first name should contain only alphabets"),

  check("lastName")
    .matches(/^[A-Za-z\s]*$/)
    .withMessage("last Name should contains only alphabets"),

  check("email")
    .isEmail()
    .withMessage("please enter a valid email")
    .normalizeEmail(),

  check("password")
    .isLength({ min: 8 })
    .withMessage("password should contain atleast 8 characters long")
    .matches(/[A-Z]/)
    .withMessage("password should contain atleast one UpperCase letter")
    .matches(/[a-z]/)
    .withMessage("password should contain atleast one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("password should contain atleast one number")
    .matches(/[@!#$^&*+-~?]/)
    .withMessage("password should contain atleast one special character"),

  check("confirm_password")
    .trim()
    .custom((value, { req }) => {
      if (value != req.body.password) {
        throw new Error("password do not match");
      }

      return true;
    }),

  check("UserType")
    .notEmpty()
    .withMessage("please select a user type")
    .isIn(["guest", "host"])
    .withMessage("invalid user Type"),

  check("terms")
    .notEmpty()
    .withMessage("please accept the terms and conditions")
    .custom((value, { req }) => {
      if (value !== "on") {
        throw new Error("please accept the terms and condition");
      }
      return true;
    }),

  async (req, res, next) => {
    console.log(req.body);

    const { firstName, lastName, email, password, UserType } = req.body;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).render("auth/signup", {
        pageTitle: "SignUp",
        isLoggedIn: false,
        errors: errors.array().map((err) => err.msg),
        oldInput: { firstName, lastName, email, UserType },
        user: {},
      });
    }

    // if there is not any error comes it means user correctly put his all details according to our requirements 

    // instead of directly save the user in the data base , 1st we will send the otp to that user email and then verify that otp , if its correct then we will alow him to create account (i means save the user in database and redirect to the login )

    // so instead of usinng save using only bycrypt save do it new otp generation + save + email flow 

    try{

      // before generating the otp first check if that user is already exist or not (means that email is present in the user model or not , if present then it means a user wants to create another account using that same email id, we need to prevent that )

      const existingUser=await user.findOne({email});
      
      if(existingUser) {
           return res.status(422).render("auth/signup",{
             pageTitle:"Signup",
             isLoggedIn:false,
             errors: ["This email is already registered, Please log in or use another email"],
             oldInput: {firstName,lastName,email,UserType},
             user:{},
           })
      }
      // generate otp of 6 number
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // store the otp expire time , Date.now() gives the current time in milisecond, so expiresAt holds the timestamp when OTP will expire.

      const expiresAt = Date.now() + 10 * 60 * 1000;

      // Hash the user password before saving

      const hashPassword = await bcrypt.hash(password, 12);

      // removing existing otps for this email if exist
      await OtpToken.findOneAndDelete({ email });

      //create new OTP token entry , it saves all mecessary info temporarily in the otpToken,  userData	contain Full user info: name, email, hashed password, role, We will move this info into the real User collection after OTP is verified.

      await OtpToken.create({
        email,
        otp,
        expiresAt,
        userData: {
          firstName,
          lastName,
          email,
          password: hashPassword,
          UserType,
        },
      });
      
      //  Set up email transporter using Gmail

      // This sets up nodemailer to use Gmail to send emails.
      // user → your Gmail.
      // pass → an App Password, not your actual Gmail password.

      // ✅it will Allows your backend to send an email with the OTP.

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "punyashloknath@gmail.com",
          pass: "aqyl brwi amsq rimp",
        },
      });

      //  Send the OTP email to the user

      // The body(html) contains the OTP and expiration time.

      await transporter.sendMail({
        to: email,
        from: "punyashloknath@gmail.com",
        subject: "Your OTP for Account Verification",
        html: `<p> Your OTP is <b>${otp}</b> . It is valid for 10 minutes.</p>`,
      });

      // redirect the user to the OTP verification page (basically this will create a get verify-otp request , we will handle it using router and controller to render the otp form )

      return res.redirect(`/verify-otp?email=${email}`);
    } catch(err){
       console.log(err);
       return res.status(500).render("auth/signup", {
         pageTitle:"Signup",
         isLoggedIn:false,
         errors: [err.message],
         oldInput: {firstName,lastName,email,UserType},
         user: {},
       })
  }
}
];

exports.getForgetPassword = async (req, res, next) => {
  res.render("auth/forgetPassword", {
    pageTitle: "Forget Password",
    isLoggedIn: false,
    user: {},
  });
};

exports.postForgetPassword = async (req, res, next) => {
  const { email } = req.body;

  const existingUser = await user.findOne({ email });

  if (!existingUser) {
    return res.redirect("/forget-password");
  }

  const token = crypto.randomBytes(32).toString("hex");

  const hashToken = await bcrypt.hash(token, 12);

  existingUser.resetToken = hashToken;

  existingUser.resetTokenExpiration = Date.now() + 36000000;

  await existingUser.save();

  const transporter = nodemailer.createTransport({
    service: "gmail",

    auth: {
      user: "punyashloknath@gmail.com",
      pass: "aqyl brwi amsq rimp",
    },
  });
  await transporter.sendMail({
    to: existingUser.email,
    from: "punyashloknath@gmail.com",
    subject: "Password Reset",
    html: `
  <p>You requested a password reset</p>
  <p>Click this <a href="https://hostsync-j3um.onrender.com/reset-password/${token}">link</a> to reset your password.</p>
`,
  });
  res.redirect("/login");
};



exports.getResetPassword=async (req,res,next)=>{
  const token = req.params.token;

  

  const users = await user.find({
    resetTokenExpiration: { $gt: Date.now() },
  });

   let matchingUser=null;



  for(let u of users){
     
    const isMatch=await bcrypt.compare(token,u.resetToken);


    if(isMatch)   {
      matchingUser=u;
      break;
    }
  }


  if(!matchingUser){
       return res.send("Token is invalid or has expired");
  }
 
  res.render("auth/resetPassword",{
      pageTitle:"Reset Password",
      isLoggedIn:false,
      user:{},
      token,
      userId:matchingUser._id.toString()
  })


 

  
}

exports.postResetPassword=async (req,res,next)=>{


  console.log("inside the postResetPassword",req.body);
  const { userId, token, password, confirm_password } = req.body; 
  if (password !== confirm_password) {
    return res.send("Password do not match");
  }


  const existingUser = await user.findOne({
    _id: userId,
    resetTokenExpiration: { $gt: Date.now() },
  });

  if (!existingUser) {
    return res.send("Invalid token or roken expired");
  }

  
  const isMatch = await bcrypt.compare(token, existingUser.resetToken);


  if (!isMatch) {
    return res.send("Invalid token");
  }

  

  const hashPassword = await bcrypt.hash(password, 12);

 

  existingUser.password = hashPassword;

  existingUser.resetToken = undefined;
  existingUser.resetTokenExpiration = undefined;


  await existingUser.save();

  res.send(
    "Password reset successful. You can now log in with your new password"
  );
}

// use to render the otp form 
exports.getVerifyOtp = (req, res) => {
  const email = req.query.email;
  res.render("auth/verifyOtp", { email,pageTitle:"verify email",error: null });
};


// It’s an async function because it will do DB operations (which return Promises).This function is triggered when the user submits the OTP form.

exports.postVerifyOtp = async (req, res) => {
  //  extract email and otp values from the submitted form (from the <input name="email"> and <input name="otp">).
  const { email, otp } = req.body;

  //Now we look for an existing OTP record for this email in the OtpToken collection.
  const otpRecord = await OtpToken.findOne({ email });

  //If the OTP record doesn't exist, maybe they never signed up or OTP was deleted.

  //If no OTP was found in the database:we show the OTP input page again.

  if (!otpRecord) {
    return res.render("auth/verifyOtp", {
      email,
      error: "OTP not found. Please sign up again.",
    });
  }

  // Check whether the current time is past the OTP's expiry time.

  //If OTP is expired:

  if (Date.now() > otpRecord.expiresAt) {
    // Delete the expired OTP record to keep the DB clean.

    await OtpToken.deleteOne({ email });

    // Show the OTP input page again, with error message: "OTP expired."

    return res.render("auth/verifyOtp", {
      email,
      error: "OTP expired. Please sign up again.",
    });
  }

  // f the user typed a wrong OTP, we compare it with what's in the DB.

  if (otpRecord.otp !== otp) {
    // means user enter the wrong otp , so again show the otp form with the error
    return res.render("auth/verifyOtp", {
      email,
      pageTitle: "verify Otp",
      error: "Invalid OTP. Try again.",
    });
  }

  // ✅ If OTP is valid and not expired:

  // Create the actual user

  // before creating first check this user already exist or not in the user model, if already exist it means this user already verified his account (it means he already create accout ), now he wants to create the account again
  const userExists = await user.findOne({ email });
  if (userExists) {
    await OtpToken.deleteOne({ email });
    return res.render("auth/verifyOtp", {
      email,
      pageTitle:"verify Otp",
      error: "User already exists.",
    });
  }

  // now everything is valid , so create the user

  // take all the user information from  otpRecord (otpRecord contain that user otp Model)

  const { firstName, lastName, password, UserType } = otpRecord.userData;

  // We create a new instance of the User model with the stored data.
  const newUser = new user({
    firstName,
    lastName,
    email,
    password,
    UserType,
  });

  // Save this new user to the actual User collection (now they are officially registered).

  await newUser.save();

  // now that user is created , we dont need the otp record anymore , so we delete it from the otpToken collection 


  await OtpToken.deleteOne({ email });

  // now redirect to the login page , so thay can sign in 

  res.redirect("/login");
};


exports.termsAndConditions=async (req,res,next)=>{
       res.render("auth/terms-condition", {
         pageTitle: "Terms and condition",
         isLoggedIn: false,
         user: {},
       });
}

exports.privacyPolicy=async (req,res,next) => {
          res.render("auth/privacy-policy", {
            pageTitle: "Privacy Policy",
            isLoggedIn: false,
            user: {},
          });
}