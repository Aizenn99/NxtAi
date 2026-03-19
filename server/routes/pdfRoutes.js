const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { generatePDF } = require("../controllers/pdf/pdfController");

router.post("/generate/pdf", authMiddleware, generatePDF);

module.exports = router;
