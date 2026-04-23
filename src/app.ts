import express from "express";
import cors from "cors";

// ✅ ROUTES
import carRoutes from "./routes/car.routes";
import driverRoutes from "./routes/driver.routes";
import bookingRoutes from "./routes/booking.routes";
import authRoutes from "./routes/auth.routes"; 

const app = express();

// ✅ MIDDLEWARE
app.use(cors());
app.use(express.json());

// ✅ ROUTES USE
app.use("/api/cars", carRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api", bookingRoutes);
app.use("/api/auth", authRoutes); 

export default app;