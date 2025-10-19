import mongoose from "mongoose";

 const connectDB = () =>{
    mongoose.connect(process.env.MONGO_URL, {
        dbName:"Mern-Stack-Library-Management"
    }).then(()=>{
        console.log("Database connected")
    }).catch(err=>{
        console.log("Error",err)
    })
} 

export default connectDB;