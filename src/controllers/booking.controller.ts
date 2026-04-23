import { Booking } from "../models/booking.model";
import { Driver } from "../models/driver.model";
import { Car } from "../models/car.model";
import { Request, Response } from "express";

// ✅ CREATE BOOKING (FULL FIXED)
// ✅ CREATE BOOKING (FINAL)


export const createBooking = async (req: Request, res: Response) => {
  try {
    const {
      carId,
      driverId,
      pickupDate,
      dropDate,
      pickupLocation,
      dropLocation,
      guestName,
      guestMobileNo,
      company,
      reportingAddress,
      reportingTime,
    } = req.body;

    // 🔥 CAR CHECK
    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }

    // 🔥 DRIVER CHECK
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    // 🔥 DATE OVERLAP CHECK — dropDate optional handle
    const existingBooking = await Booking.findOne({
      $or: [{ carId }, { driverId }],
      status: { $ne: "complete" },
      ...(dropDate && {
        $and: [
          { pickupDate: { $lte: new Date(dropDate) } },
          {
            $or: [
              { dropDate: { $gte: new Date(pickupDate) } },
              { dropDate: null },
            ],
          },
        ],
      }),
    });

    if (existingBooking) {
      return res.status(400).json({
        message: "Car or Driver already booked for selected dates ❌",
      });
    }

    // 🔥 CREATE
    const booking = await Booking.create({
      carId,
      driverId,
      pickupDate,
      dropDate: dropDate || null,
      pickupLocation,
      dropLocation,
      guestName,
      guestMobileNo,
      company,
      reportingAddress,
      reportingTime,
    });

    // 🔥 STATUS UPDATE
    await Car.findByIdAndUpdate(carId, { status: "booked" });
    await Driver.findByIdAndUpdate(driverId, { status: "booked" });

    res.status(201).json({
      message: "Booking created ✅",
      data: booking,
    });
  } catch (error) {
    console.log("CREATE BOOKING ERROR:", error); // 👈 add
    res.status(500).json({
      message: "Error creating booking",
    });
  }
};




export const getBookings = async (req: Request, res: Response) => {
  try {
    const bookings = await Booking.find()
      .populate("carId", "carNumber carModel carName")  // 👈 carName add
      .populate("driverId", "driverName mobileNo")
      .sort({ createdAt: -1 });

    res.json({
      total: bookings.length,
      data: bookings,
    });
  } catch {
    res.status(500).json({ message: "Error fetching bookings" });
  }
};



export const updateBooking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 🔥 পুরনো booking আনো
    const oldBooking = await Booking.findById(id);
    if (!oldBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const newData = req.body;

    // 🔥 CAR CHANGED?
    if (newData.carId && newData.carId !== oldBooking.carId.toString()) {
      // পুরনো car active
      await Car.findByIdAndUpdate(oldBooking.carId, { status: "active" });
      // নতুন car booked
      await Car.findByIdAndUpdate(newData.carId, { status: "booked" });
    }

 
    if (newData.driverId && newData.driverId !== oldBooking.driverId.toString()) {
      
      await Driver.findByIdAndUpdate(oldBooking.driverId, { status: "active" });
      
      await Driver.findByIdAndUpdate(newData.driverId, { status: "booked" });
    }

    const booking = await Booking.findByIdAndUpdate(id, newData, { new: true });

    res.json({
      message: "Booking updated",
      data: booking,
    });
  } catch {
    res.status(500).json({ message: "Error updating booking" });
  }
};


export const deleteBooking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findByIdAndDelete(id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // 🔥 delete হলে car + driver active
    await Driver.findByIdAndUpdate(booking.driverId, { status: "active" });
    await Car.findByIdAndUpdate(booking.carId, { status: "active" });

    res.json({
      message: "Booking deleted",
    });
  } catch {
    res.status(500).json({ message: "Error deleting booking" });
  }
};


export const toggleBookingStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    if (booking.status === "booked") {
      booking.status = "complete";

      // 🔥 complete হলে car + driver active
      await Car.findByIdAndUpdate(booking.carId, { status: "active" });
      await Driver.findByIdAndUpdate(booking.driverId, { status: "active" });

    } else {
      booking.status = "booked";

      await Car.findByIdAndUpdate(booking.carId, { status: "booked" });
      await Driver.findByIdAndUpdate(booking.driverId, { status: "booked" });
    }

    await booking.save();

    res.json({
      message: "Booking status updated",
      data: booking,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating booking",
    });
  }
};



export const searchCars = async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || "";

    const cars = await Car.find({
      status: "active",   // 👈 only active cars
      $or: [
        { carNumber: { $regex: q, $options: "i" } },
        { carName: { $regex: q, $options: "i" } },
        { carModel: { $regex: q, $options: "i" } },
      ],
    }).limit(10);

    res.json({ data: cars });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error searching cars" });
  }
};


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


export const getBookingByMobileOrId = async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || "";

    if (!q) {
      return res.status(400).json({ message: "Query required" });
    }

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




export const updateBookingStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const prevStatus = booking.status;
    booking.status = status;
    await booking.save();

    // 🔥 complete বা cancelled হলে car + driver active
    if (status === "complete" || status === "cancelled") {
      await Car.findByIdAndUpdate(booking.carId, { status: "active" });
      await Driver.findByIdAndUpdate(booking.driverId, { status: "active" });
    }

    // 🔥 আবার booked হলে car + driver booked
    if (status === "booked" && prevStatus !== "booked") {
      await Car.findByIdAndUpdate(booking.carId, { status: "booked" });
      await Driver.findByIdAndUpdate(booking.driverId, { status: "booked" });
    }

    res.json({ message: "Status updated", data: booking });
  } catch (error) {
    res.status(500).json({ message: "Error updating status" });
  }
};

