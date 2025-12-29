const mongoose = require("mongoose");

const MaterialSchema = new mongoose.Schema(
  {
    material: { type: String, required: true },
    quantity: { type: Number, required: true },
    provider: { type: String, required: true },
  },
  { _id: false }
);

const ScaffoldingOrderSchema = new mongoose.Schema(
  {
    orderNo: { type: String, required: true, unique: true },

    supervisor: { type: String, required: true },
    employeeId: { type: String, required: true },

    issueDate: { type: Date, required: true },
    location: { type: String, required: true },

    materials: { type: [MaterialSchema], required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "ScaffoldingOrder",
  ScaffoldingOrderSchema
);
