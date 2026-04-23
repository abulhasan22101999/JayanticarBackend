import mongoose, { Document } from "mongoose";

// ✅ TYPE
interface IBooking extends Document {
  bookingId: string;
  carId: mongoose.Types.ObjectId;
  driverId: mongoose.Types.ObjectId;
  pickupDate: Date;
  dropDate: Date;
  pickupLocation: string;
  dropLocation: string;
  guestName: string;
  guestMobileNo: string;
  company?: string;
  reportingAddress?: string;
  reportingTime?: string;
  status: "booked" | "complete";
}

const bookingSchema = new mongoose.Schema<IBooking>(
  {
    bookingId: {
      type: String,
      unique: true,
    },

    carId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Car",
      required: true,
    },

    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
    },

    pickupDate: {
      type: Date,
      required: true,
    },

    dropDate: {
      type: Date,
      required: true,
    },

    pickupLocation: {
      type: String,
      required: true,
    },

    dropLocation: {
      type: String,
      required: true,
    },

    guestName: {
      type: String,
      required: true,
    },

    guestMobileNo: {
      type: String,
      required: true,
    },

    company: String,
    reportingAddress: String,
    reportingTime: String,

    status: {
  type: String,
  enum: ["booked", "complete", "cancelled"],  // 👈
  default: "booked",
},
  },
  { timestamps: true }
);

// ✅ AUTO BOOKING ID — duplicate proof
bookingSchema.pre("save", async function () {
  if (!this.bookingId) {
    let unique = false;
    let bookingId = "";

    while (!unique) {
      const timestamp = Date.now().toString().slice(-6);
      bookingId = "JT-" + timestamp;

      const existing = await mongoose
        .model("Booking")
        .findOne({ bookingId });

      if (!existing) unique = true;
    }

    this.bookingId = bookingId;
  }
});

// ✅ EXPORT
export const Booking = mongoose.model<IBooking>("Booking", bookingSchema);