const mongoose = require("mongoose");

const IssueItemSchema = new mongoose.Schema(
  {
    itemName: String,
    unit: String,
    qty: Number,
  },
  { _id: false }
);

const OldIssueSchema = new mongoose.Schema(
  {
    issuedTo: { type: String, required: true },
    issueDate: { type: Date, required: true },
    location: String,
    items: { type: [IssueItemSchema], required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OldIssue", OldIssueSchema);
