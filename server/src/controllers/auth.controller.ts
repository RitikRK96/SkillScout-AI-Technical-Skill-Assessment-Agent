import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.model";

const generateTokens = (userId: string) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET || "fallback_secret", {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET || "fallback_refresh_secret", {
    expiresIn: "7d",
  });
  return { accessToken, refreshToken };
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ error: "User already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

    const { accessToken, refreshToken } = generateTokens(user.id);
    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("accessToken", accessToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" });
    res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" });

    res.status(201).json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: "Registration failed" });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !user.password) {
      res.status(400).json({ error: "Invalid credentials" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ error: "Invalid credentials" });
      return;
    }

    const { accessToken, refreshToken } = generateTokens(user.id);
    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("accessToken", accessToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" });
    res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" });

    res.status(200).json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      res.status(401).json({ error: "No refresh token provided" });
      return;
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || "fallback_refresh_secret") as { id: string };
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      res.status(401).json({ error: "Invalid refresh token" });
      return;
    }

    const tokens = generateTokens(user.id);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.cookie("accessToken", tokens.accessToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" });
    res.cookie("refreshToken", tokens.refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" });

    res.status(200).json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(401).json({ error: "Invalid refresh token" });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || "fallback_refresh_secret") as { id: string };
      await User.findByIdAndUpdate(decoded.id, { refreshToken: null });
    }
  } catch (error) {
    // Ignore verification errors on logout
  }

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken", { path: "/" });
  res.status(200).json({ success: true });
};
