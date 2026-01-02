const OldIssue = require("../models/old/OldIssue");
const OldStock = require("../models/old/OldStock");

/* ================= CREATE ISSUE ================= */
exports.createIssue = async (req, res) => {
  try {
    const { issuedTo, issueDate, location, items } = req.body;

    if (!issuedTo || !issueDate || !items?.length) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 🔒 Check stock availability
    for (const item of items) {
      const stock = await OldStock.findOne({ itemName: item.itemName });
      if (!stock || stock.qty < item.qty) {
        return res.status(400).json({
          message: `Insufficient stock for ${item.itemName}`,
        });
      }
    }

    // 1️⃣ Save issue
    const issue = await OldIssue.create({
      issuedTo,
      issueDate,
      location,
      items,
    });

    // 2️⃣ Reduce stock
    for (const item of items) {
      await OldStock.findOneAndUpdate(
        { itemName: item.itemName },
        { $inc: { qty: -Number(item.qty) } }
      );
    }

    res.status(201).json(issue);
  } catch (err) {
    console.error("OLD ISSUE CREATE ERROR:", err);
    res.status(500).json({ message: "Failed to issue old items" });
  }
};

/* ================= GET ISSUES ================= */
exports.getIssues = async (req, res) => {
  try {
    const issues = await OldIssue.find().sort({ createdAt: -1 });
    res.json(issues);
  } catch {
    res.status(500).json({ message: "Failed to fetch old issues" });
  }
};

/* ================= UPDATE ISSUE ================= */
exports.updateIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const { issuedTo, issueDate, location, items } = req.body;

    const existing = await OldIssue.findById(id);
    if (!existing) {
      return res.status(404).json({ message: "Issue not found" });
    }

    // 🔁 Rollback old stock
    for (const item of existing.items) {
      await OldStock.findOneAndUpdate(
        { itemName: item.itemName },
        { $inc: { qty: Number(item.qty) } }
      );
    }

    // 🔒 Check new stock
    for (const item of items) {
      const stock = await OldStock.findOne({ itemName: item.itemName });
      if (!stock || stock.qty < item.qty) {
        return res.status(400).json({
          message: `Insufficient stock for ${item.itemName}`,
        });
      }
    }

    // 🔻 Apply new stock
    for (const item of items) {
      await OldStock.findOneAndUpdate(
        { itemName: item.itemName },
        { $inc: { qty: -Number(item.qty) } }
      );
    }

    const updated = await OldIssue.findByIdAndUpdate(
      id,
      { issuedTo, issueDate, location, items },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    console.error("OLD ISSUE UPDATE ERROR:", err);
    res.status(500).json({ message: "Failed to update issue" });
  }
};

/* ================= DELETE ISSUE ================= */
exports.deleteIssue = async (req, res) => {
  try {
    const issue = await OldIssue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    // 🔺 Restore stock
    for (const item of issue.items) {
      await OldStock.findOneAndUpdate(
        { itemName: item.itemName },
        { $inc: { qty: Number(item.qty) } }
      );
    }

    await OldIssue.findByIdAndDelete(req.params.id);

    res.json({ message: "Old issue deleted successfully" });
  } catch (err) {
    console.error("OLD ISSUE DELETE ERROR:", err);
    res.status(500).json({ message: "Delete failed" });
  }
};
