const mongoose = require("mongoose");

const scaffoldingItemSchema = new mongoose.Schema(
  {
    itemName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    puw: {
      type: Number,          // ✅ must be Number
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ScaffoldingItem", scaffoldingItemSchema);
