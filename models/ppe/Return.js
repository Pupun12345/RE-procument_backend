const mongoose = require("mongoose");

const ReturnItemSchema = new mongoose.Schema(
  {
    itemId: String,
    itemName: String,
    quantity: Number,
    unit: String,
  },
  { _id: false }
);

const ReturnSchema = new mongoose.Schema(
  {
    personName: { type: String, required: true },
    location: String,
    returnDate: { type: Date, default: Date.now },
    items: [ReturnItemSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Return", ReturnSchema);
