import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import axios from "axios";
import multer from "multer";
import fs from "fs";
import path from "path";
import FormData from "form-data"; // ✅ Required for proper FastAPI image upload
import Admin from './models/Admin.js'; 
import User from "./models/User.js";
import Order from "./models/Order.js";
import SignInLog from "./models/SignInLog.js"; // ✅ Add this model import
import { MONGO_URI, JWT_SECRET, FASTAPI_URL } from "./config.js"; // ✅ Ensure FASTAPI_URL is set in config.js

dotenv.config();
const app = express();

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});


// CORS Middleware
const corsOptions = {
  origin: "http://localhost:3000",  // Remove array if only one origin
  credentials: true,  // Allow cookies & authentication headers
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: ["Authorization", "Content-Type"],
};

app.use(cors(corsOptions));
app.use(express.json());

// MongoDB Connection
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // ⏳ Reduce waiting time for server response
})
.then(() => console.log("✅ MongoDB Connected"))
.catch((err) => console.error("❌ MongoDB Connection Error:", err.message));


// Middleware for Authentication
const authenticateUser = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized access" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token", error: error.message });
  }
};

// Admin Authentication Middleware
const authenticateAdmin = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized access" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.adminId) {
      return res.status(403).json({ message: "Not authorized as admin" });
    }
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token", error: error.message });
  }
};

// 📝 User Registration
app.post("/signup", async (req, res) => {
  const { name, email, phone, place, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, phone, place, password: hashedPassword });
    await newUser.save();

    const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: "1h" });
    res.status(201).json({ message: "User registered successfully", token, user: newUser });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// 🔑 User Login
// 🔑 User Login Endpoint
app.post("/signin", async (req, res) => {
  const { email, password } = req.body; // ✅ Expect "email" instead of "username"

  try {
      const user = await User.findOne({ email }); // ✅ Find user by "email"
      if (!user) return res.status(401).json({ message: "Invalid credentials" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

      const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: "1h" });

      // // Log user sign-in
      // const loginLog = new UserSignInLog({
      //     email: user.email, // ✅ Use "email"
      //     ipAddress: req.ip || req.connection.remoteAddress,
      //     userAgent: req.headers['user-agent'],
      //     loginTime: new Date(),
      //     role: "user" 
      // });

      // await loginLog.save();

      res.json({ token });
  } catch (error) {
      console.error("User login error:", error);
      res.status(500).json({ message: "Server error" });
  }
});


// 👤 Get User Info
app.get("/api/user", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// 📦 Orders API
app.post("/api/orders", authenticateUser, async (req, res) => {
  try {
    const { items, totalAmount } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Order must contain at least one item." });
    }

    const newOrder = new Order({ userId: req.user.userId, items, totalAmount });
    await newOrder.save();

    res.status(201).json({ message: "Order placed successfully", order: newOrder });
  } catch (error) {
    res.status(500).json({ message: "Error placing order", error: error.message });
  }
});

// 📦 Get Orders for a User
app.get("/api/orders", authenticateUser, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.userId });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders", error: error.message });
  }
});

/* ------------------- 🔍 Improved FastAPI Prediction Integration ------------------- */
// 🖼 Multer Configuration for Image Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/";
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// 🪴 Predict Plant Type using FastAPI
app.post("/api/predict", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  try {
    const imagePath = req.file.path;

    // ✅ Create FormData and attach file
    const formData = new FormData();
    formData.append("file", fs.createReadStream(imagePath));

    // ✅ Send Image to FastAPI for Prediction
    const fastapiResponse = await axios.post(`${FASTAPI_URL}/predict`, formData, {
      headers: { ...formData.getHeaders() },
    });

    // ✅ Remove Uploaded File After Processing
    fs.unlink(imagePath, (err) => {
      if (err) console.error("❌ Error deleting file:", err);
    });

    res.json(fastapiResponse.data);
  } catch (error) {
    console.error("❌ FastAPI Error:", error.message);
    res.status(500).json({ message: "Prediction failed", error: error.message });
  }
});

// 🔐 Admin Login Endpoint
app.post("/adminlogin", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find admin by username
    const admin = await Admin.findOne({ username });
    
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // Compare passwords
    const isMatch = await bcrypt.compare(password, admin.password);
    
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // Create JWT token
    const token = jwt.sign(
      { adminId: admin._id, username: admin.username },
      JWT_SECRET,
      { expiresIn: "1h" }
    );
    
    // Log the successful login
    const ipAddress = req.ip || req.connection.remoteAddress;
    const loginLog = new SignInLog({
      username: admin.username,
      ipAddress: ipAddress,
      userAgent: req.headers['user-agent']
    });
    
    await loginLog.save();
    
    // Return token
    res.json({ token });
    
  } catch (error) {
    console.error("❌ Admin Login Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// // 📋 Fetch Sign-in Logs (Admin only)
// app.get("/sign-in-logs", authenticateAdmin, async (req, res) => {
//   try {
//     const logs = await SignInLog.find().sort({ loginTime: -1 });
//     res.json(logs);
//   } catch (error) {
//     console.error("❌ Error fetching logs:", error);
//     res.status(500).json({ message: "Error fetching sign-in logs", error: error.message });
//   }
// });

// Fetch only user sign-in logs (Admin only)
app.get("/sign-in-logs/users", authenticateAdmin, async (req, res) => {
  try {
    const logs = await SignInLog.find({ role: "user" }).sort({ loginTime: -1 });
    res.json(logs);
  } catch (error) {
    console.error("Error fetching user logs:", error);
    res.status(500).json({ message: "Error fetching user sign-in logs" });
  }
});



// 👥 Initialize default admin if none exists
const initializeAdmin = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log("⏳ Waiting for DB connection...");
      return;
    }

    const existingAdmin = await Admin.findOne({ username: "admin" });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_DEFAULT_PASSWORD || "admin123", 10);
      
      await Admin.create({
        username: "admin",
        password: hashedPassword,
        email: "admin@example.com",
      });

      console.log("✅ Default admin account created");
    }
  } catch (error) {
    console.error("❌ Error initializing admin:", error);
  }
};

// Call the function in your server setup
initializeAdmin();

// Make sure to add the SignInLog model in models/SignInLog.js
// The model should be created before using it

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  initializeAdmin(); // Create default admin account if none exists
});