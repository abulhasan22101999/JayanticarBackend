import mongoose, { Schema, Document } from "mongoose";

export interface ICar extends Document {
  carNumber: string;
  carModel: string;
  driverName: string;
  driverPhoneNo: string;
  status: "available" | "booked";
  createdAt: Date;
}

const CarSchema: Schema = new Schema(
  {
    carNumber: {
      type: String,
      required: true,
      unique: true, 
    },
    carModel: {
      type: String,
      required: true,
    },
    driverName: {
      type: String,
      required: true,
    },
    driverPhoneNo: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["available", "booked"],
      default: "available",
    },
  },
  { timestamps: true }
);

export default mongoose.model<ICar>("Car", CarSchema);