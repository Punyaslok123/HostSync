const express = require("express");

const authRouter = express.Router();

const authController = require("../controllers/authController");

authRouter.get("/login", authController.getLogin);

authRouter.post("/login", authController.postLogin);

authRouter.post("/logout", authController.postLogout);

authRouter.get("/signup", authController.getSignUp);

authRouter.post("/signup", authController.postSignUp);

authRouter.get("/forget-password", authController.getForgetPassword);

authRouter.post("/forget-password", authController.postForgetPassword);

// handle the /reset-password request 

authRouter.get("/reset-password/:token",authController.getResetPassword)



// handle the post request passeord request 


authRouter.post("/reset-password",authController.postResetPassword);

authRouter.get("/verify-otp", authController.getVerifyOtp);
authRouter.post("/verify-otp", authController.postVerifyOtp);

// now implement the postResetPassword functionality in the authController 


authRouter.get("/termsandconditions",authController.termsAndConditions);

authRouter.get("/privacypolicy",authController.privacyPolicy);

module.exports = authRouter;
