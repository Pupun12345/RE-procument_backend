require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Seeding users...");

    await User.deleteMany({});

    const users = [
      {
        firstname: "Admin",
        lastname: "User",
        email: "md@rayengineering.co",
        password: await bcrypt.hash("Nityananda@1982", 10),
        role: "admin",
      },
      {
        firstname: "User1",
        lastname: "User1",
        email: "store@rayengineering.co",
        password: await bcrypt.hash("Store#1982", 10),
        role: "user",
      },
      {
        firstname: "User2",
        lastname: "User2",
        email: "accounts@rayengineering.co",
        password: await bcrypt.hash("Accounts#1982", 10),
        role: "user",
      },
    ];

    await User.insertMany(users);
    console.log("✅ Users seeded!");
    mongoose.connection.close();
  })
  .catch((err) => console.error("❌ Error:", err));
//updated code