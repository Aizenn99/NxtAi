const mongoose = require("mongoose");

const chatHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  chats: [
    {
      id: { type: String, required: true },
      title: { type: String, default: "New Chat" },
      messages: [
        {
          role: { type: String, enum: ["user", "assistant"], required: true },
          content: { type: String, required: true },
          timestamp: { type: Number },
        },
      ],
    },
  ],
});

module.exports = mongoose.model("ChatHistory", chatHistorySchema);
