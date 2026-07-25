import mongoose from "mongoose";
// import { DB_NAME } from "../constant.js";
async function connectedDb() {
  try {
   await mongoose.connect(
      `${process.env.MONGO_URI}`
      
    );
    console.log(`\n MongoDB connected `);
  } catch (err) {
    console.error("❌ Database connection failed", err);
    process.exit(1);
  }
}
export default connectedDb ; 
 