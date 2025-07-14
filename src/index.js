// require("dotenv").config({path: './env'});

import dotenv from "dotenv"
import connectDB from "./db/index.js";

dotenv.config({
    path: './env'
})

connectDB()

.then(()=>{

    app.on("error", (error)=>{
        console.error("Error in Express app:",error)
        throw error;
    })

    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`server is running on port ${process.env.PORT}`)
    })
})
.catch((error)=>{
    console.error("MongoDB connection failed:",error)
})



/*

// approch 1

import mongoose from "mongoose";
import { DB_NAME } from "./constants";
import express from "express"
const app = express();

( async ()=> {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error)=>{
            console.error("Error in Express app:",error)
            throw error;
        })

        app.listen(process.env.PORT, ()=>{
            console.log(`Server is running on port ${process.env.PORT}`)
        })
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        throw error;
    }
})()

*/