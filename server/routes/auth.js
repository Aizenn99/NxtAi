const express = require("express");
const router = express.Router();
const User = require("../models/user");
const creditCosts = require("../config/creditCosts");
const authMiddleware = require("../middleware/authMiddleware");
const {
  register,
  login,
  checkAuth,
  logout,
} = require("./../controllers/auth/auth-controller");

router.post("/register", register);
router.post("/login", login);
router.get("/checkAuth", checkAuth);
router.post("/logout", logout);

router.post("/deduct", authMiddleware, async (req, res) => {
  try {
    const { feature } = req.body;
    const cost = creditCosts[feature];
    if (cost === undefined) {
      return res.status(400).json({ message: `Unknown feature: ${feature}` });
    }
    const user = await User.findOneAndUpdate(
      { _id: req.userId, credits: { $gte: cost } },
      { $inc: { credits: -cost } },
      { new: true },
    );
    if (!user) {
      return res.status(403).json({ message: "Insufficient credits" });
    }
    return res.json({ success: true, remainingCredits: user.credits });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
