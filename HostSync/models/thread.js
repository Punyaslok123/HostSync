const mongoose=require("mongoose");


const threadSchema=new mongoose.Schema({
    guest: {
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:true,
    },
    host: {
        type:mongoose.Schema.Types.ObjectId,
        ref:"Home",
        required:true,
    },
    home: {
        type:mongoose.Schema.Types.ObjectId,
        ref:"Home",
        required:true,
    },
    lastMessageAt: {
        type: Date,
        default: Date.now,
    },
    messages: [
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Message",
        }
    ],
},{
    timestamps:true,
})

module.exports=mongoose.model("Thread",threadSchema);