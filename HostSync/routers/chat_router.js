const express=require("express");

const chatRouter=express.Router();

const chatController=require("../controllers/chatController");



chatRouter.post("/start-chat/:homeId",chatController.startChat);

chatRouter.get("/chat/thread/:threadId",chatController.getThreadChatPage);

chatRouter.get("/inbox",chatController.getHostInbox);
module.exports=chatRouter;