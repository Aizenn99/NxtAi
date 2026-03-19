const axios = require("axios");
const Image = require("../../models/image");
const User = require("../../models/user");

const HF_API_URL =
  "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell";
const IMAGE_CREDIT_COST = 5;

// Generate Image
const generateImage = async (req, res) => {
  try {
    const { prompt, width = 512, height = 512 } = req.body;
    const userId = req.userId || req.user?.id;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // Check credits
    const user = await User.findById(userId);
    if (!user || user.credits < IMAGE_CREDIT_COST) {
      return res.status(403).json({ error: "Insufficient credits" });
    }

    console.log("📤 Calling Hugging Face...");
    console.log("Prompt:", prompt);
    console.log("Token exists:", !!process.env.HUGGINGFACE_API_KEY);

    const response = await axios.post(
      HF_API_URL,
      { inputs: prompt, parameters: { width, height } },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "image/jpeg",
        },
        responseType: "arraybuffer",
        timeout: 60000,
      },
    );

    console.log("✅ HF Response status:", response.status);
    console.log("✅ Response data length:", response.data?.length);

    const base64Image = Buffer.from(response.data).toString("base64");
    const imageUrl = `data:image/jpeg;base64,${base64Image}`;

    const newImage = await Image.create({
      userId,
      prompt,
      imageUrl,
      width,
      height,
    });

    await User.findByIdAndUpdate(userId, {
      $inc: { credits: -IMAGE_CREDIT_COST },
    });

    return res.status(201).json({
      success: true,
      image: newImage,
      creditsRemaining: user.credits - IMAGE_CREDIT_COST,
    });
  } catch (error) {
    // Detailed error logging
    console.error("❌ generateImage error:");
    console.error("Message:", error.message);
    console.error("Status:", error.response?.status);
    console.error(
      "HF Error data:",
      Buffer.from(error.response?.data || "").toString(),
    );

    if (error.response?.status === 503) {
      return res.status(503).json({
        error: "Model is loading, please retry in 20 seconds",
      });
    }

    if (error.response?.status === 401) {
      return res.status(401).json({
        error: "Invalid Hugging Face token",
      });
    }

    if (error.response?.status === 403) {
      return res.status(403).json({
        error: "Access denied — accept the model license on Hugging Face",
      });
    }

    return res.status(500).json({
      error: "Image generation failed",
      detail: error.message,
    });
  }
};

// Save image from chat route
const saveImage = async (req, res) => {
  try {
    const { prompt, imageUrl, width, height } = req.body;
    const newImage = await Image.create({
      userId: req.user.id,
      prompt,
      imageUrl,
      width: width || 512,
      height: height || 512,
    });
    return res.status(201).json({ success: true, image: newImage });
  } catch (error) {
    return res.status(500).json({ error: "Failed to save image" });
  }
};

// Get single image by ID
const getImageById = async (req, res) => {
  try {
    const image = await Image.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!image) return res.status(404).json({ error: "Image not found" });
    return res.status(200).json({ success: true, image });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch image" });
  }
};

// Add both to exports

// Get All Images (user history)
const getUserImages = async (req, res) => {
  try {
    const images = await Image.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({ success: true, images });
  } catch (error) {
    console.error("getUserImages error:", error.message);
    return res.status(500).json({ error: "Failed to fetch images" });
  }
};

// Delete Image
const deleteImage = async (req, res) => {
  try {
    const deleted = await Image.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!deleted) {
      return res.status(404).json({ error: "Image not found" });
    }

    return res.status(200).json({ success: true, message: "Image deleted" });
  } catch (error) {
    console.error("deleteImage error:", error.message);
    return res.status(500).json({ error: "Failed to delete image" });
  }
};

module.exports = {
  generateImage,
  getUserImages,
  deleteImage,
  saveImage,
  getImageById,
};
