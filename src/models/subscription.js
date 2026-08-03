import mongoose, { Schema } from "mongoose";
const subscriptionSchema = new Schema({
  subscriber: {
    type: Object.Types.ObjectId,
    ref: "User",
  },
  channel: {
    type: Object.Types.ObjectId,
    ref: "User",
  },

} , {timestamps : true}); 

export const subscription = mongoose.model("subscription", subscriptionSchema);
