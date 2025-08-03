const Home=require("../models/home");

module.exports=async function(req,res,next) {
      const homeId=req.params.homeId ;

      try{
           const home=await Home.findById(homeId);

           if(!home){
               return res.status(404).send("Home not found");
           }

           if(home.owner.toString()!==req.session.user._id.toString()){
                return res.status(403).send("Unauthorized: You do not own this home");
           }

           next();
      }catch(err){
          console.error("Error in ownership check",err);

          res.status(500).send("Server error");
      }
}