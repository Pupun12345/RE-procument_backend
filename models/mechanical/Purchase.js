const mongoose = require("mongoose");

const ItemSchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true },
    qty: { type: Number, required: true },
    unit: { type: String, required: true },
    rate: { type: Number, required: true },
    amount: { type: Number, required: true },
  },
  { _id: false }
);

const mechanicalPurchaseSchema = new mongoose.Schema(
  {
    partyName: { type: String, required: true },
    invoiceNumber: { type: String, required: true },
    invoiceDate: { type: String, required: true },
    items: { type: [ItemSchema], required: true },
    subtotal: { type: Number, required: true },
    gstPercent: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    total: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "MechanicalPurchase",
  mechanicalPurchaseSchema
);
