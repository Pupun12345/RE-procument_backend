const mongoose = require("mongoose");

const ScaffoldingStockSchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true, unique: true },
    unit: String,
    qty: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ScaffoldingStock", ScaffoldingStockSchema);
