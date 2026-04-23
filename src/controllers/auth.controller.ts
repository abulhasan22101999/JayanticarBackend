// controllers/auth.controller.ts
import { Request, Response } from "express";
import { User } from "../models/user.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import crypto from "crypto";

// ✅ REGISTER (optional but useful)
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashed,
    });

    res.json({
      message: "User created",
      data: user,
    });
  } catch {
    res.status(500).json({ message: "Error registering" });
  }
};

// ✅ LOGIN
export const loginUser = async (req: Request, res: Response) => {
  try {
    console.log("BODY:", req.body);

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    console.log("USER:", user);

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET as string,
      { expiresIn: "30d" }
    );

    res.json({
      message: "Login successful",
      user: {
        _id: user._id,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.log("LOGIN ERROR:", error); // 🔥 KEY LINE
    res.status(500).json({
      message: "Server error",
    });
  }
};


// controllers/auth.controller.ts


export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // 🔥 create token
    const token = crypto.randomBytes(32).toString("hex");

    user.resetToken = token;
    user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    await user.save();

    // 🔥 for now (no email) → return link
    const resetLink = `http://localhost:5173/reset-password/${token}`;

    res.json({
      message: "Reset link generated",
      resetLink,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error generating reset link",
    });
  }
};



// controllers/auth.controller.ts


export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        message: "Password required",
      });
    }

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired token",
      });
    }

    // 🔥 hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;

    await user.save();

    res.json({
      message: "Password reset successful ✅",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error resetting password",
    });
  }
};