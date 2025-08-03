const express=require('express');

const router=express.Router();

const receiptController=require('../controllers/receiptController');

// Route to verify receipt

router.get('/verify-booking/:bookingId',receiptController.verifyReceipt);


module.exports=router;