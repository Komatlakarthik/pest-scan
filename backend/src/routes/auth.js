const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User } = require("../models");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !password) {
      return res.status(400).json({ message: "Name and password are required" });
    }
    const existingUser = await User.findOne({ where: { name } });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }
    if (email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email || null,
      password: hashedPassword,
      phone: null
    });
    const token = jwt.sign({ id: user.id, name: user.name }, JWT_SECRET, { expiresIn: "30d" });
    res.status(201).json({
      message: "User created successfully",
      user: { id: user.id, name: user.name, email: user.email },
      token
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error during signup" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
    const user = await User.findOne({ where: { name: username } });
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid username or password" });
    }
    const token = jwt.sign({ id: user.id, name: user.name }, JWT_SECRET, { expiresIn: "30d" });
    res.json({
      message: "Login successful",
      user: { id: user.id, name: user.name, email: user.email },
      token
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] }
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;