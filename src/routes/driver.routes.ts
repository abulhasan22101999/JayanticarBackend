import express from "express";
import {
  addDriver,
  getDrivers,
  updateDriver,
  deleteDriver,
  toggleDriverStatus,
  updateDriverStatus,
} from "../controllers/driver.controller";

const router = express.Router();

router.post("/", addDriver);
router.get("/", getDrivers);
router.patch("/:id", updateDriver);
router.delete("/:id", deleteDriver);


router.patch("/toggle/:id", toggleDriverStatus);
router.patch("/status/:id", updateDriverStatus);

export default router;