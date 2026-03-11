const express = require("express");
const Groq = require("groq-sdk");

const router = express.Router();

// POST /api/chat
router.post("/", async (req, res) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    console.log("[chat] Using GROQ_API_KEY:", apiKey ? apiKey.substring(0, 10) + "..." : "UNDEFINED");

    const groq = new Groq({ apiKey });

    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages array is required" });
    }

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
    return res.json({ reply });
  } catch (err) {
    console.error("Groq API error:", err.message);
    return res.status(500).json({ error: err.message ?? "Internal server error" });
  }
});

module.exports = router;

