import mongoose from "mongoose";

const driverSchema = new mongoose.Schema(
  {
    driverName: {
      type: String,
      required: true,
    },

   mobileNo: {
  type: String,
  required: true,
  unique: true,
  match: [/^\d{10}$/, "Mobile number must be exactly 10 digits"], 
},

    alternateMobileNo: {
      type: String,
       default: null,
      
    },

    status: {
      type: String,
      enum: ["active", "inactive","booked"],
      default: "active",
    },
  },
  { timestamps: true }
);

export const Driver = mongoose.model("Driver", driverSchema);