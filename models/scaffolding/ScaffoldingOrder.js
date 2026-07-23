const mongoose = require("mongoose");

const MaterialSchema = new mongoose.Schema(
  {
    material: { type: String, required: true },
    unit: { type: String, default: "" },
    unitWeight: { type: Number, default: 0 },
    quantity: { type: Number, required: true },
    issuedWeight: { type: Number, default: 0 },
    provider: { type: String, required: true },
  },
  { _id: false }
);

const ScaffoldingOrderSchema = new mongoose.Schema(
  {
    orderNo: { type: String, required: true, unique: true },

    orderManager: { type: String, required: true },
    workOrderNumber: { type: String, default: "" },

    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    location: { type: String, required: true },

    materials: { type: [MaterialSchema], required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "ScaffoldingOrder",
  ScaffoldingOrderSchema
);
