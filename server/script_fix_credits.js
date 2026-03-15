require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/user");

async function checkCredits() {
  await mongoose.connect(process.env.MONGO_URL);
  console.log("Connected to MongoDB.");
  
  const users = await User.find({ email: { $in: ["kalriyahet@gmail.com", "het@gmail.com"] } });
  
  console.log("Current State:");
  users.forEach(u => console.log(`${u.email}: credits=${u.credits}`));
  
  // Force reset them to 100 if missing or 0
  for (const u of users) {
    if (!u.credits || u.credits <= 0) {
      u.credits = 100;
      await u.save();
      console.log(`Reset ${u.email} to 100 credits.`);
    }
  }
  
  console.log("\nFinal State:");
  const updatedUsers = await User.find({ email: { $in: ["kalriyahet@gmail.com", "het@gmail.com"] } });
  updatedUsers.forEach(u => console.log(`${u.email}: credits=${u.credits}`));
  
  process.exit(0);
}

checkCredits().catch(console.error);
