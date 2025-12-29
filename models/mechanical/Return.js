const mongoose = require("mongoose");

const MechanicalReturnItemSchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
  },
  { _id: false }
);

const MechanicalReturnSchema = new mongoose.Schema(
  {
    personName: { type: String, required: true },
    location: { type: String },
    returnDate: { type: Date, default: Date.now },
    items: { type: [MechanicalReturnItemSchema], required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "MechanicalReturn",
  MechanicalReturnSchema
);
