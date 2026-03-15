const express = require("express");
const Groq = require("groq-sdk");
const authMiddleware = require("../middleware/authMiddleware");
const checkCredits = require("../middleware/creditCheck");

const router = express.Router();

// POST /api/chat  — costs 1 credit per message
router.post("/", authMiddleware, checkCredits("chat"), async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages array is required" });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are NxtAI, a helpful and intelligent AI assistant. Be concise, clear, and friendly.",
        },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });

    const reply = completion.choices[0]?.message?.content ?? "";

    return res.json({
      reply,
      remainingCredits: req.remainingCredits, // set by checkCredits middleware
    });
  } catch (err) {
    console.error("Groq API error:", err.message);
    return res.status(500).json({ error: err.message ?? "Internal server error" });
  }
});

module.exports = router;
