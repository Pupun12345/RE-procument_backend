const mongoose = require("mongoose");

const PurchaseItemSchema = new mongoose.Schema(
  {
    itemName: String,
    qty: Number,
    unit: String,
    rate: Number,
    amount: Number,
  },
  { _id: false }
);

const OldPurchaseSchema = new mongoose.Schema(
  {
    partyName: { type: String, required: true },
    invoiceNumber: { type: String, required: true },
    invoiceDate: { type: String, required: true },

    items: { type: [PurchaseItemSchema], required: true },

    subtotal: Number,
    gstPercent: Number,
    gstAmount: Number,
    total: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model("OldPurchase", OldPurchaseSchema);
