const mongoose = require('mongoose');

function connectDB(){
    mongoose.connect(process.env.MONGO_URI).then(()=>{
        console.log("databse connected");
        
    })
}
module.exports = connectDB;