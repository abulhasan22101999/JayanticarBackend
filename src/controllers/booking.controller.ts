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

    // 🔥 CAR CHECK — only if carId provided
    if (carId) {
      const car = await Car.findById(carId);
      if (!car) {
        return res.status(404).json({ message: "Car not found" });
      }
    }

    // 🔥 DRIVER CHECK — only if driverId provided
    if (driverId) {
      const driver = await Driver.findById(driverId);
      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }
    }

    // 🔥 DATE OVERLAP CHECK — only if carId or driverId provided
    if (carId || driverId) {
      const orConditions = [];
      if (carId) orConditions.push({ carId });
      if (driverId) orConditions.push({ driverId });

     const existingBooking = await Booking.findOne({
  $or: orConditions,
  status: "booked", // ✅ শুধু "booked" check করো, cancelled ignore করো
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
    }

    // 🔥 CREATE
    const booking = await Booking.create({
      carId: carId || null,
      driverId: driverId || null,
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

    // 🔥 STATUS UPDATE — only if provided
    if (carId) await Car.findByIdAndUpdate(carId, { status: "booked" });
    if (driverId) await Driver.findByIdAndUpdate(driverId, { status: "booked" });

    res.status(201).json({
      message: "Booking created ✅",
      data: booking,
    });
  } catch (error) {
    console.log("CREATE BOOKING ERROR:", error);
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

    const oldBooking = await Booking.findById(id);
    if (!oldBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const newData = req.body;

    // 🔥 CAR CHANGED?
    const oldCarId = oldBooking.carId?.toString();
    const newCarId = newData.carId || null;

    if (oldCarId && oldCarId !== newCarId) {
      // পুরনো car active
      await Car.findByIdAndUpdate(oldCarId, { status: "active" });
    }
    if (newCarId && newCarId !== oldCarId) {
      // নতুন car booked
      await Car.findByIdAndUpdate(newCarId, { status: "booked" });
    }

    // 🔥 DRIVER CHANGED?
    const oldDriverId = oldBooking.driverId?.toString();
    const newDriverId = newData.driverId || null;

    if (oldDriverId && oldDriverId !== newDriverId) {
      // পুরনো driver active
      await Driver.findByIdAndUpdate(oldDriverId, { status: "active" });
    }
    if (newDriverId && newDriverId !== oldDriverId) {
      // নতুন driver booked
      await Driver.findByIdAndUpdate(newDriverId, { status: "booked" });
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

    // 🔥 complete করতে car ও driver থাকতে হবে
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

    // 🔥 complete বা cancelled হলে car + driver active
    if (status === "complete" || status === "cancelled") {
      if (booking.carId) await Car.findByIdAndUpdate(booking.carId, { status: "active" });
      if (booking.driverId) await Driver.findByIdAndUpdate(booking.driverId, { status: "active" });
    }

    // 🔥 আবার booked হলে car + driver booked
    if (status === "booked" && prevStatus !== "booked") {
      if (booking.carId) await Car.findByIdAndUpdate(booking.carId, { status: "booked" });
      if (booking.driverId) await Driver.findByIdAndUpdate(booking.driverId, { status: "booked" });
    }

    res.json({ message: "Status updated", data: booking });
  } catch (error) {
    res.status(500).json({ message: "Error updating status" });
  }
};



export const toggleBookingStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // 🔥 complete করতে car ও driver থাকতে হবে
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