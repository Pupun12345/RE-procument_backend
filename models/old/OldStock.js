const mongoose = require("mongoose");

const OldStockSchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true, unique: true },
    qty: { type: Number, default: 0 },
    unit: { type: String, default: "-" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OldStock", OldStockSchema);
