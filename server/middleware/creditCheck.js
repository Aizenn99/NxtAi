const User = require("../models/user");
const creditCosts = require("../config/creditCosts");

const DAILY_CREDITS = 100; // your reset value

const checkCredits = (feature) => async (req, res, next) => {
  const cost = creditCosts[feature];

  if (cost === undefined) {
    return res.status(500).json({ message: `Unknown feature: ${feature}` });
  }

  try {
    let user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if 24 hours passed
    const now = new Date();
    const lastReset = new Date(user.lastCreditReset);

    const hoursPassed = (now - lastReset) / (1000 * 60 * 60);

    if (hoursPassed >= 24) {
      user.credits = DAILY_CREDITS;
      user.lastCreditReset = now;
      await user.save();
    }

    // Check if user has sufficient credits
    if (user.credits < cost) {
      return res.status(403).json({
        message: "Insufficient credits",
        required: cost,
        remaining: user.credits,
      });
    }

    // Update credits separately
    user.credits -= cost;
    await user.save();

    req.remainingCredits = user.credits;
    next();
  } catch (error) {
    console.error("Credit check error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = checkCredits;
