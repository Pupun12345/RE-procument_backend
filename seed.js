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
        email: "mohapatraanimesh69@gmail.com",
        password: await bcrypt.hash("rubu123", 10),
        role: "admin",
      },
      {
        firstname: "Krishna",
        lastname: "User1",
        email: "user1@example.com",
        password: await bcrypt.hash("rubu123", 10),
        role: "user",
      },
      {
        firstname: "Radha",
        lastname: "User2",
        email: "user2@example.com",
        password: await bcrypt.hash("rubu123", 10),
        role: "user",
      },
    ];

    await User.insertMany(users);
    console.log("✅ Users seeded!");
    mongoose.connection.close();
  })
  .catch((err) => console.error("❌ Error:", err));
//updated code