import mongoose from "mongoose";

const carSchema = new mongoose.Schema(
  {
    carName: {
      type: String,
      required: true,
      trim: true,
    },
    carModel: {
      type: String,
      required: true,
    },
    carNumber: {
      type: String,
      required: true,
      unique: true,
    },

    // 🔥 ownership logic
    ownership: {
      type: String,
      enum: ["self", "others"],
      default: "self",
    },

    // 🔥 toggle field
    status: {
      type: String,
      enum: ["active", "inactive","booked"],
      default: "active",
    },
  },
  { timestamps: true }
);

export const Car = mongoose.model("Car", carSchema);