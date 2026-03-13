const express = require("express");
const router = express.Router();
const ChatHistory = require("../models/chathistory");
const authMiddleware = require("../middleware/authMiddleware");

// POST /api/chathistory
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { chats } = req.body;
    const userId = req.userId;

    let chatHistory = await ChatHistory.findOne({ userId });
    
    if (chatHistory) {
      chatHistory.chats = chats;
      await chatHistory.save();
    } else {
      chatHistory = new ChatHistory({ userId, chats });
      await chatHistory.save();
    }

    res.json({ success: true, chatHistory });
  } catch (err) {
    console.error("Chat history error:", err.message);
    res.status(500).json({ error: err.message ?? "Internal server error" });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const chatHistory = await ChatHistory.findOne({ userId });
    res.json(chatHistory ? chatHistory.chats : []);
  } catch (err) {
    console.error("Chat history error:", err.message);
    res.status(500).json({ error: err.message ?? "Internal server error" });
  }
});

module.exports = router;
