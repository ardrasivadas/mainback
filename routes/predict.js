import express from "express";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";

const router = express.Router();

// Multer for handling file uploads
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required" });
    }

    const formData = new FormData();
    formData.append("image", req.file.buffer, { filename: "upload.jpg" });

    const response = await axios.post("https://plant-identify.onrender.com/predict/", formData, {
      headers: {
        ...formData.getHeaders(),
        "Access-Control-Allow-Origin": "*",
      },
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: "Error in prediction", error: error.message });
  }
});

export default router;