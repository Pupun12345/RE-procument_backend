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
    issueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ScaffoldingIssue",
      required: true,
    },

    personName: String,
    location: String,

    // ✅ ADD THESE FIELDS
    woNumber: { type: String, default: "" },
    supervisorName: { type: String, default: "" },
    tslName: { type: String, default: "" },

    returnDate: { type: Date, default: Date.now },

    items: [ScaffoldingReturnItemSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "ScaffoldingReturn",
  ScaffoldingReturnSchema
);
