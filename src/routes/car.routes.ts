import express from "express";
import {
  addCar,
  getCars,
  updateCar,
  deleteCar,
  toggleCarStatus,
  updateCarStatus,
} from "../controllers/car.controller";

const router = express.Router();

router.post("/", addCar);
router.get("/", getCars);
router.patch("/:id", updateCar);
router.delete("/:id", deleteCar);

router.patch("/toggle/:id", toggleCarStatus);
router.patch("/status/:id", updateCarStatus);

export default router;