const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  generateImage,
  getUserImages,
  deleteImage,
  saveImage,
  getImageById,
} = require("../controllers/images/imagecontroller");

router.post(
  "/generate/image",
  (req, res, next) => {
    console.log("🔥 Image route hit");
    console.log("Body:", req.body);
    console.log("User from token:", req.user);
    next();
  },
  authMiddleware,
  generateImage,
);
router.get("/images", authMiddleware, getUserImages);
router.post("/images/save", authMiddleware, saveImage);
router.get("/images/:id", authMiddleware, getImageById);
router.delete("/images/:id", authMiddleware, deleteImage);

module.exports = router;
