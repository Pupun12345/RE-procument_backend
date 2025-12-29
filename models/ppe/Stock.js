const mongoose = require("mongoose");

const StockSchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true, unique: true },
    unit: { type: String },
    qty: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Stock", StockSchema);
