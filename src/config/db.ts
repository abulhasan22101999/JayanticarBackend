import mongoose from "mongoose";
import { Driver } from "../models/driver.model"; 

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI as string);

    console.log(`MongoDB Connected: ${conn.connection.host}`);

  
    await Driver.syncIndexes();
    console.log("Driver indexes synced ✅");

  } catch (error) {
    console.error("❌ DB Connection Error:", error);
    process.exit(1);
  }
};

export default connectDB;