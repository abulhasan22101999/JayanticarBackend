import express from "express";
import {
  createBooking,
  getBookings,
  updateBooking,
  deleteBooking,
  toggleBookingStatus,
  searchCars,
  searchDrivers,
  getBookingByMobileOrId,
  updateBookingStatus,
} from "../controllers/booking.controller";

const router = express.Router();

router.post("/bookings", createBooking);
router.get("/bookings", getBookings);
router.put("/bookings/:id", updateBooking);
router.delete("/bookings/:id", deleteBooking);

// ✅ toggle — auto complete এর জন্য (car/driver check নেই)
router.patch("/bookings/:id/toggle", toggleBookingStatus);

// ✅ status — manual change এর জন্য (car/driver check আছে)
router.patch("/bookings/:id/status", updateBookingStatus);

// search
router.get("/cars/search", searchCars);
router.get("/drivers/search", searchDrivers);
router.get("/bookings/search", getBookingByMobileOrId);

export default router;  




