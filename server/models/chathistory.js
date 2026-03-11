const mongoose = require("mongoose");

const chatHist = [
  {
    chatId: String,
    messages: [
      {
        role: String,
        content: String,
      },
    ],
  },
];

module.exports = chatHist;
