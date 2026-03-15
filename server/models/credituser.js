const mongoose = require("mongoose");

const creditUserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,

  credits: {
    type: Number,
    default: 100,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("CreditUser", creditUserSchema);
