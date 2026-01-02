const mongoose = require("mongoose");

const ReturnItemSchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true },
    unit: String,
    quantity: { type: Number, required: true },
  },
  { _id: false }
);

const OldReturnSchema = new mongoose.Schema(
  {
    personName: { type: String, required: true },
    returnDate: { type: Date, required: true },
    location: String,
    items: { type: [ReturnItemSchema], required: true },
  },
  { timestamps: true }
);

// ✅ SAFE EXPORT (prevents overwrite / cache issues)
module.exports =
  mongoose.models.OldReturn ||
  mongoose.model("OldReturn", OldReturnSchema);
