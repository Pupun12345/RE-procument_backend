const mongoose = require("mongoose");

const OldItemSchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true, unique: true },
    unit: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OldItem", OldItemSchema);
