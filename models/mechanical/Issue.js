const mongoose = require("mongoose");

const ItemSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  unit: { type: String, default: "" },

  issuedQty: { type: Number, required: true },
  returnedQty: { type: Number, default: 0 }, // 🔥 TRACK RETURN

}, { _id: false });


const IssueSchema = new mongoose.Schema(
  {
    issuedTo: { type: String, required: true },
    issueDate: { type: String, required: true },
    location: { type: String, default: "" },

    items: {
      type: [ItemSchema],
      required: true,
      validate: (v) => Array.isArray(v) && v.length > 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MechanicalIssue", IssueSchema);
