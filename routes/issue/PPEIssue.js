const mongoose = require("mongoose");

const PPEItemSchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true },
    unit: { type: String, required: true },
    qty: { type: Number, required: true },
  },
  { _id: false }
);

const PPEIssueSchema = new mongoose.Schema(
  {
    issuedTo: { type: String, required: true },
    issueDate: { type: String, required: true },
    location: { type: String, default: "" },

    items: {
      type: [PPEItemSchema],
      required: true,
      validate: v => v.length > 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PPEIssue", PPEIssueSchema);
