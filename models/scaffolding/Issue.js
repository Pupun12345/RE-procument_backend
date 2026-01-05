const mongoose = require("mongoose");

const ItemSchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true },
    unit: { type: String, required: true },
    qty: { type: Number, required: true }, // issued qty
    unitWeight: { type: Number, default: 0 },
    issuedWeight: { type: Number, default: 0 },

    returnedQty: { type: Number, default: 0 },      // ✅ NEW
    returnedWeight: { type: Number, default: 0 },   // ✅ NEW
  },
  { _id: false }
);


const IssueSchema = new mongoose.Schema(
  {
    issuedTo: { type: String, required: true },
    issueDate: { type: String, required: true },

    location: { type: String, default: "" },
    woNumber: { type: String, default: "" },
    supervisorName: { type: String, default: "" },
    tslName: { type: String, default: "" },

    items: { type: [ItemSchema], required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ScaffoldingIssue", IssueSchema);
