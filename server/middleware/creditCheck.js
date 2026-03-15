const User = require("../models/user");
const creditCosts = require("../config/creditCosts");

/**
 * Factory middleware: checkCredits("chat") | checkCredits("image") | etc.
 * Must be used AFTER authMiddleware (relies on req.userId from JWT).
 *
 * Costs: chat=1, image=5, ppt=10, video=20
 */
const checkCredits = (feature) => async (req, res, next) => {
  const cost = creditCosts[feature];

  if (cost === undefined) {
    return res.status(500).json({ message: `Unknown feature: ${feature}` });
  }

  try {
    // Atomically deduct credits only if user has enough — prevents race conditions
    const user = await User.findOneAndUpdate(
      { _id: req.userId, credits: { $gte: cost } },
      { $inc: { credits: -cost } },
      { new: true }
    );

    if (!user) {
      // Either user not found OR not enough credits
      const existing = await User.findById(req.userId);
      if (!existing) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.status(403).json({
        message: "Insufficient credits",
        required: cost,
        remaining: existing.credits,
      });
    }

    // Attach remaining credits so the route handler can return it
    req.remainingCredits = user.credits;
    next();
  } catch (error) {
    console.error("Credit check error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = checkCredits;
