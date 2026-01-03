const mongoose = require("mongoose");

const ScaffoldingStockSchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true, unique: true },
    unit: { type: String, required: true },

    puw: { type: Number, required: true }, // ✅ ADD
    qty: { type: Number, default: 0 },
    weight: { type: Number, default: 0 },  // ✅ ADD
  },
  { timestamps: true }
);

module.exports = mongoose.model("ScaffoldingStock", ScaffoldingStockSchema);
