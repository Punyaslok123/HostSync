const Message = require("../models/message");


const Thread=require("../models/thread");

const Home=require("../models/home");

const user=require("../models/user");

exports.startChat=async (req,res,next)=>{
     try{

        
        const guestId=req.session.user._id;


        const homeId=req.params.homeId;

        const home=await Home.findById(homeId);
        
        
        if(!home)  return res.redirect("/homes");
        
    
        const hostUser=await user.findById(home.owner);

        if(!hostUser) {
          return res.status(404).send("Host not found");
        }
        
        
        let existingThread=await Thread.findOne({
           guest:guestId,
           host:hostUser._id,
           home:homeId,
        })

      
        if(!existingThread){
          existingThread=await Thread.create({
            guest:guestId,
            host:hostUser._id,
            home:homeId,
            messages:[],
          })
        }

        

        res.redirect(`/chat/thread/${existingThread._id}`);
     } catch(err) {
        console.log("Error in startChat:",err);
        res.status(500).send("Something went worng");
     }
}

exports.getThreadChatPage=async (req,res,next) => {
    const threadId=req.params.threadId;
    const currentUserId=req.session.user._id;

    try{
        
      const thread=await Thread.findById(threadId).populate("guest")
      .populate("host")
      .populate("home");

      if(!thread){
          return res.status(404).send("Thread not found");
      }

      const messages=await Message.find({thread:threadId}).populate("sender").sort({createdAt:1});
      
      // fallback - mark messages as seen if they are from other person - basically in the database we update it 

      await Message.updateMany({
           thread:thread,
           sender: {$ne : currentUserId},  // not mr
           seen:false    //and not seen
      },
       {
        $set: {seen : true} // mark as seen
       })
       
     
      res.render("store/chat",{
         thread,
         messages,
         currentUserId,
         isLoggedIn:req.isLoggedIn,
         user:req.session.user,
         pageTitle:"chat inbox",
      })
    } catch(err){
      console.log("error loading thread",err);
      res.status(500).send("Internal error");
    }

}

exports.getHostInbox = async (req, res) => {
  try {

   
    const currentHostId = req.session.user._id;

  
    const threads = await Thread.find({ host: currentHostId })
      .populate("guest")
      .populate("home")
      .populate({
        path: "messages",
        options: { sort: { createdAt: -1 }, limit: 1 },
      })
      .sort({ updatedAt: -1 });
    
     
    res.render("store/hostInbox", {
      threads,
      user: req.session.user,
      isLoggedIn: req.isLoggedIn,
      pageTitle: "Your Inbox",
    });
  } catch (err) {
    console.error("Error loading host inbox:", err);
    res.status(500).send("Error loading inbox");
  }
};