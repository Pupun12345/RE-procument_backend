const mongoose = require("mongoose");

/* ================= ITEM ================= */
const ItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    qty: { type: Number, required: true },
    unit: { type: String, required: true },
    uom: { type: String, default: "" },
    workOrderNo: { type: String, default: "" },
    rate: { type: Number, required: true }
  },
  { _id: false }
);

/* ================= PURCHASE ================= */
const PurchaseSchema = new mongoose.Schema(
  {
    partyName: { type: String, required: true },
    invoiceNo: { type: String, required: true },
    invoiceDate: { type: String, required: true },

    items: { type: [ItemSchema], required: true },

    subtotal: { type: Number, required: true },
    gstPercent: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    total: { type: Number, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "ScaffoldingPurchase",
  PurchaseSchema
);
