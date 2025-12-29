const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstname: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "user" }
});

module.exports = mongoose.model("User", userSchema);
//updated code