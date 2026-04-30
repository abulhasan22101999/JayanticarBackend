import { Booking } from "../models/booking.model";
import { Driver } from "../models/driver.model";
import { Car } from "../models/car.model";
import { Request, Response } from "express";

// ✅ CREATE BOOKING
export const createBooking = async (req: Request, res: Response) => {
  try {
    const {
      carId, driverId, pickupDate, dropDate,
      pickupLocation, dropLocation, guestName,
      guestMobileNo, company, reportingAddress, reportingTime,
    } = req.body;

    if (!pickupDate || !dropDate) {
      return res.status(400).json({ message: "pickupDate and dropDate are required" });
    }

    if (carId) {
      const car = await Car.findById(carId);
      if (!car) return res.status(404).json({ message: "Car not found" });
    }

    if (driverId) {
      const driver = await Driver.findById(driverId);
      if (!driver) return res.status(404).json({ message: "Driver not found" });
    }

    if (carId || driverId) {
      const orConditions = [];
      if (carId) orConditions.push({ carId });
      if (driverId) orConditions.push({ driverId });

      const existingBooking = await Booking.findOne({
        $or: orConditions,
        status: "booked",
        $and: [
          { pickupDate: { $lte: new Date(dropDate) } },
          { dropDate: { $gte: new Date(pickupDate) } },
        ],
      });

      if (existingBooking) {
        return res.status(400).json({ message: "Car or Driver already booked for selected dates ❌" });
      }
    }

    // ✅ All main fields filled → booked, else → pending
    const isComplete =
      carId && driverId && guestName && guestMobileNo && pickupLocation && dropLocation;

    const booking = await Booking.create({
      carId: carId || null,
      driverId: driverId || null,
      pickupDate,
      dropDate,
      pickupLocation: pickupLocation || "",
      dropLocation: dropLocation || "",
      guestName: guestName || "",
      guestMobileNo: guestMobileNo || "",
      company,
      reportingAddress,
      reportingTime,
      status: isComplete ? "booked" : "pending",
    });

    if (carId && isComplete) await Car.findByIdAndUpdate(carId, { status: "booked" });
    if (driverId && isComplete) await Driver.findByIdAndUpdate(driverId, { status: "booked" });

    res.status(201).json({ message: "Booking created ✅", data: booking });
  } catch (error) {
    console.log("CREATE BOOKING ERROR:", error);
    res.status(500).json({ message: "Error creating booking" });
  }
};


// ✅ GET ALL BOOKINGS
export const getBookings = async (req: Request, res: Response) => {
  try {
    const bookings = await Booking.find()
      .populate("carId", "carNumber carModel carName cartype")
      .populate("driverId", "driverName mobileNo")
      .sort({ createdAt: -1 });

    res.json({ total: bookings.length, data: bookings });
  } catch {
    res.status(500).json({ message: "Error fetching bookings" });
  }
};


// ✅ UPDATE BOOKING — auto recalculates status pending↔booked
export const updateBooking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const oldBooking = await Booking.findById(id);
    if (!oldBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const newData = req.body;

    // 🔥 CAR CHANGED?
    const oldCarId = oldBooking.carId?.toString();
    const newCarId = newData.carId || null;

    if (oldCarId && oldCarId !== newCarId) {
      await Car.findByIdAndUpdate(oldCarId, { status: "active" });
    }
    if (newCarId && newCarId !== oldCarId) {
      await Car.findByIdAndUpdate(newCarId, { status: "booked" });
    }

    // 🔥 DRIVER CHANGED?
    const oldDriverId = oldBooking.driverId?.toString();
    const newDriverId = newData.driverId || null;

    if (oldDriverId && oldDriverId !== newDriverId) {
      await Driver.findByIdAndUpdate(oldDriverId, { status: "active" });
    }
    if (newDriverId && newDriverId !== oldDriverId) {
      await Driver.findByIdAndUpdate(newDriverId, { status: "booked" });
    }

    // ✅ Auto recalculate status: only upgrade pending→booked or downgrade booked→pending
    // Never touch complete or cancelled
    if (oldBooking.status === "pending" || oldBooking.status === "booked") {
      const merged = { ...oldBooking.toObject(), ...newData };
      const isComplete =
        merged.carId && merged.driverId &&
        merged.guestName && merged.guestMobileNo &&
        merged.pickupLocation && merged.dropLocation;

      newData.status = isComplete ? "booked" : "pending";
    }

    const booking = await Booking.findByIdAndUpdate(id, newData, { new: true });

    res.json({ message: "Booking updated", data: booking });
  } catch {
    res.status(500).json({ message: "Error updating booking" });
  }
};


// ✅ DELETE BOOKING
export const deleteBooking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findByIdAndDelete(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    await Driver.findByIdAndUpdate(booking.driverId, { status: "active" });
    await Car.findByIdAndUpdate(booking.carId, { status: "active" });

    res.json({ message: "Booking deleted" });
  } catch {
    res.status(500).json({ message: "Error deleting booking" });
  }
};


// ✅ SEARCH CARS
export const searchCars = async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || "";

    const cars = await Car.find({
      status: "active",
      $or: [
        { carNumber: { $regex: q, $options: "i" } },
        { carName: { $regex: q, $options: "i" } },
        { carModel: { $regex: q, $options: "i" } },
        { cartype: { $regex: q, $options: "i" } },
      ],
    }).limit(10);

    res.json({ data: cars });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error searching cars" });
  }
};


// ✅ SEARCH DRIVERS
export const searchDrivers = async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || "";

    const drivers = await Driver.find({
      status: "active",
      $or: [
        { driverName: { $regex: q, $options: "i" } },
        { mobileNo: { $regex: q, $options: "i" } },
      ],
    }).limit(10);

    res.json({ data: drivers });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error searching drivers" });
  }
};


// ✅ GET BOOKING BY MOBILE OR ID
export const getBookingByMobileOrId = async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || "";
    if (!q) return res.status(400).json({ message: "Query required" });

    const bookings = await Booking.find({
      $or: [
        { guestMobileNo: q },
        { bookingId: { $regex: q, $options: "i" } },
      ],
    })
      .populate("carId", "carNumber carModel")
      .populate("driverId", "driverName mobileNo")
      .sort({ createdAt: -1 });

    res.json({ data: bookings });
  } catch {
    res.status(500).json({ message: "Error fetching bookings" });
  }
};


// ✅ UPDATE BOOKING STATUS
export const updateBookingStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // 🔒 Complete booking cannot be changed
    if (booking.status === "complete") {
      return res.status(400).json({ message: "Completed booking cannot be changed" });
    }

    // 🔒 Pending booking cannot be completed — must fill all details first
    if (booking.status === "pending" && status === "complete") {
      return res.status(400).json({
        message: "Cannot complete a pending booking. Please fill all details first ❌",
      });
    }

    // 🔒 complete needs car + driver
    if (status === "complete") {
      if (!booking.carId) {
        return res.status(400).json({ message: "Cannot complete: Car is not assigned ❌" });
      }
      if (!booking.driverId) {
        return res.status(400).json({ message: "Cannot complete: Driver is not assigned ❌" });
      }
    }

    const prevStatus = booking.status;
    booking.status = status;
    await booking.save();

    // complete বা cancelled হলে car + driver → active
    if (status === "complete" || status === "cancelled") {
      if (booking.carId) await Car.findByIdAndUpdate(booking.carId, { status: "active" });
      if (booking.driverId) await Driver.findByIdAndUpdate(booking.driverId, { status: "active" });
    }

    // আবার booked হলে car + driver → booked
    if (status === "booked" && prevStatus !== "booked") {
      if (booking.carId) await Car.findByIdAndUpdate(booking.carId, { status: "booked" });
      if (booking.driverId) await Driver.findByIdAndUpdate(booking.driverId, { status: "booked" });
    }

    res.json({ message: "Status updated", data: booking });
  } catch (error) {
    res.status(500).json({ message: "Error updating status" });
  }
};


// ✅ TOGGLE BOOKING STATUS (auto-complete endpoint)
export const toggleBookingStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (status === "complete") {
      if (!booking.carId) {
        return res.status(400).json({ message: "Cannot complete: Car is not assigned ❌" });
      }
      if (!booking.driverId) {
        return res.status(400).json({ message: "Cannot complete: Driver is not assigned ❌" });
      }
    }

    booking.status = status;
    await booking.save();

    if (status === "complete" || status === "cancelled") {
      if (booking.carId) await Car.findByIdAndUpdate(booking.carId, { status: "active" });
      if (booking.driverId) await Driver.findByIdAndUpdate(booking.driverId, { status: "active" });
    }

    if (status === "booked") {
      if (booking.carId) await Car.findByIdAndUpdate(booking.carId, { status: "booked" });
      if (booking.driverId) await Driver.findByIdAndUpdate(booking.driverId, { status: "booked" });
    }

    res.json({ message: "Status updated", data: booking });
  } catch (error) {
    res.status(500).json({ message: "Error updating booking" });
  }
};
