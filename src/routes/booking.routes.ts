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
  // getBookingByMobile,
} from "../controllers/booking.controller";



const router = express.Router();

router.post("/bookings", createBooking);
router.get("/bookings", getBookings);
router.put("/bookings/:id", updateBooking);
router.delete("/bookings/:id", deleteBooking);
router.patch("/bookings/:id/toggle", toggleBookingStatus);

// search
router.get("/cars/search", searchCars);
router.get("/drivers/search", searchDrivers);

router.get("/bookings/search", getBookingByMobileOrId);
// router.get("/bookings/mobile/:mobile", getBookingByMobile);

router.patch("/bookings/:id/toggle", updateBookingStatus); // 👈 নতুন function

export default router;