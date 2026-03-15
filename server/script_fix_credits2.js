require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/user");

async function run() {
  await mongoose.connect(process.env.MONGO_URL);
  const users = await User.find({}, 'email credits');
  users.forEach(u => console.log(`${u.email}: credits=${u.credits}`));
  
  // also explicitly update kalriyahet if we find a partial match
  const k = users.find(u => u.email.includes("kal"));
  if (k) {
    k.credits = 100;
    await k.save();
    console.log(`Reset ${k.email} to 100 credits.`);
  }

  process.exit(0);
}

run().catch(console.error);
