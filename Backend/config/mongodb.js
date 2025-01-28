import mongoose from "mongoose";
import 'dotenv/config'

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/Ecommerce`)
        console.log(`MongoDB connected !!`);
    } catch (error) {
        console.log("MongoDB connection error", process.env.MONGODB_URI); 
        process.exit(1);
    }
}

export default connectDB;