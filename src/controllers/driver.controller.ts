import { Request, Response } from "express";
import { Driver } from "../models/driver.model";
import { Car } from "../models/car.model";

// ✅ ADD DRIVER
export const addDriver = async (req: Request, res: Response) => {
  try {
    const { driverName, mobileNo, alternateMobileNo } = req.body;

    if (!driverName || !mobileNo) {
      return res.status(400).json({
        message: "Driver name and mobile number required",
      });
    }

    // ✅ 10 digit validation
    if (!/^\d{10}$/.test(mobileNo)) {
      return res.status(400).json({
        message: "Mobile number must be exactly 10 digits",
      });
    }

    const driver = await Driver.create({
      driverName,
      mobileNo,
      alternateMobileNo: alternateMobileNo || null,
    });

    res.status(201).json({
      message: "Driver added successfully",
      data: driver,
    });
  } catch (error: any) {

    if (error.code === 11000) {
      return res.status(400).json({
        message: "Mobile number already exists",
      });
    }

    res.status(500).json({
      message: "Server error",
    });
  }
};


// ✅ GET DRIVERS (WITH AUTO STATUS)  Listing
 export const getDrivers = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    let filter: any = {};

    // ✅ filter apply
    if (status && status !== "") {
      filter.status = status;
    }

    const drivers = await Driver.find(filter).sort({ createdAt: -1 });

    res.json({
      message: "Driver list fetched",
      total: drivers.length,
      data: drivers,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching drivers",
    });
  }
};

// Toggle system 
export const toggleDriverStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const driver = await Driver.findById(id);

    if (!driver) {
      return res.status(404).json({
        message: "Driver not found",
      });
    }

    // 🔥 proper 3-state cycle
    if (driver.status === "active") {
      driver.status = "inactive";
    } else if (driver.status === "inactive") {
      driver.status = "booked";
    } else {
      driver.status = "active";
    }

    await driver.save();

    res.json({
      message: "Status updated",
      data: driver,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating status",
    });
  }
};

// update / edit api

export const updateDriver = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const driver = await Driver.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!driver) {
      return res.status(404).json({
        message: "Driver not found",
      });
    }

    res.json({
      message: "Driver updated successfully",
      data: driver,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating driver",
    });
  }
};


// delete api

export const deleteDriver = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const driver = await Driver.findByIdAndDelete(id);

    if (!driver) {
      return res.status(404).json({
        message: "Driver not found",
      });
    }

    res.json({
      message: "Driver deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting driver",
    });
  }
};


export const updateDriverStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const driver = await Driver.findById(id);
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    // 🔥 already booked হলে active/inactive করা যাবে না
    if (driver.status === "booked" && status !== "booked") {
      return res.status(400).json({
        message: "This driver is already booked! Complete the booking first ❌",
      });
    }

    driver.status = status;
    await driver.save();

    res.json({ message: "Status updated", data: driver });
  } catch (error) {
    res.status(500).json({ message: "Error updating status" });
  }
};

// export const updateDriverStatus = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const { status } = req.body;

//     const driver = await Driver.findById(id);

//     if (!driver) {
//       return res.status(404).json({
//         message: "Driver not found",
//       });
//     }

//     driver.status = status; // direct set from dropdown

//     await driver.save();

//     res.json({
//       message: "Status updated",
//       data: driver,
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Error updating status",
//     });
//   }
// };