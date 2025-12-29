const ScaffoldingIssue = require("../models/scaffolding/Issue");
const ScaffoldingStock = require("../models/scaffolding/Stock");

// controllers/scaffoldingIssueController.js
exports.createIssue = async (req, res) => {
  try {
    const {
      issuedTo,
      issueDate,
      location,
      woNumber,
      supervisorName,
      tslName,
      items,
    } = req.body;

    if (!issuedTo || !issueDate || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Invalid issue data" });
    }

    const issue = await ScaffoldingIssue.create({
      issuedTo,
      issueDate,
      location,
      woNumber,
      supervisorName,
      tslName,
      items,
    });

    // update stock for each item
    for (const item of items) {
      await ScaffoldingStock.findOneAndUpdate(
        { itemName: item.itemName },
        { $inc: { qty: -item.qty } }
      );
    }

    res.status(201).json(issue);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to issue items" });
  }
};


/* ================= GET ISSUES ================= */
exports.getIssues = async (req, res) => {
  try {
    const issues = await ScaffoldingIssue.find().sort({ createdAt: -1 });
    res.json(issues);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch issues" });
  }
};

/* ================= DELETE ISSUE ================= */
exports.deleteIssue = async (req, res) => {
  try {
    const issue = await ScaffoldingIssue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    // restore stock for each item
    for (const item of issue.items) {
      await ScaffoldingStock.findOneAndUpdate(
        { itemName: item.itemName },
        { $inc: { qty: item.qty } }
      );
    }

    await ScaffoldingIssue.findByIdAndDelete(req.params.id);

    res.json({ message: "Issue deleted & stock restored" });
  } catch (err) {
    console.error("DELETE ISSUE ERROR:", err);
    res.status(500).json({ message: "Delete failed" });
  }
};

