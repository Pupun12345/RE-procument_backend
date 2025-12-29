const mongoose = require("mongoose");

const ScaffoldingReturnItemSchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
  },
  { _id: false }
);

const ScaffoldingReturnSchema = new mongoose.Schema(
  {
    woNumber: String,
    personName: { type: String, required: true },
    location: { type: String, required: true },

    supervisorName: { type: String, default: "" },
    tslName: { type: String, default: "" },

    returnDate: { type: Date, default: Date.now },
    items: { type: [ScaffoldingReturnItemSchema], required: true },
  },
  { timestamps: true }
);


module.exports = mongoose.model(
  "ScaffoldingReturn",
  ScaffoldingReturnSchema
);
