import { Request, Response } from "express";
import { Car } from "../models/car.model";

export const addCar = async (req: Request, res: Response) => {
  try {
    const { carName, carModel, carNumber,cartype, ownership } = req.body;

    if (!carName || !carModel || !carNumber) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const car = await Car.create({
      carName,
      carModel,
      carNumber,
      cartype,
      // 🔥 only "others" গেলে others, otherwise self
      ownership: ownership === "others" ? "others" : "self",
    });

    res.status(201).json({
      message: "Car added successfully",
      data: car,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Car number already exists",
      });
    }

    res.status(500).json({
      message: "Server error",
    });
  }
};

export const getCars = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    let filter: any = {};

    // 🔥 status filter apply
    if (status) {
      filter.status = status;
    }

    const cars = await Car.find(filter).sort({ createdAt: -1 });

    res.json({
      message: "Car list fetched",
      total: cars.length,
      data: cars,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching cars",
    });
  }
};


export const updateCar = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const updated = await Car.findByIdAndUpdate(
      id,
      {
        ...req.body,
        ownership:
          req.body.ownership === "others" ? "others" : "self",
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        message: "Car not found",
      });
    }

    res.json({
      message: "Car updated successfully",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating car",
    });
  }
};



export const deleteCar = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const car = await Car.findByIdAndDelete(id);

    if (!car) {
      return res.status(404).json({
        message: "Car not found",
      });
    }

    res.json({
      message: "Car deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting car",
    });
  }
};





export const toggleCarStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const car = await Car.findById(id);

    if (!car) {
      return res.status(404).json({
        message: "Car not found",
      });
    }

    // 🔥 3-state cycle logic
    if (car.status === "active") {
      car.status = "booked";
    } else if (car.status === "booked") {
      car.status = "inactive";
    } else {
      car.status = "active";
    }

    await car.save();

    res.json({
      message: "Status updated",
      data: car,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating status",
    });
  }
};



export const updateCarStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const car = await Car.findById(id);
    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }

    // 🔥 already booked হলে active/inactive করা যাবে না
    if (car.status === "booked" && status !== "booked") {
      return res.status(400).json({
        message: "This car is already booked! Complete the Ride first ❌",
      });
    }

    car.status = status;
    await car.save();

    return res.json({ message: "Status updated", data: car });
  } catch (error) {
    return res.status(500).json({ message: "Error updating status" });
  }
};


// export const updateCarStatus = async (req: Request, res: Response) => {



//   try {
//     const { id } = req.params;
//     const { status } = req.body;

//     const car = await Car.findById(id);

//     if (!car) {
//       return res.status(404).json({ message: "Car not found" });
//     }

//     car.status = status;

//     await car.save();

//     return res.json({
//       message: "Status updated",
//       data: car,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       message: "Error updating status",
//     });
//   }
// };