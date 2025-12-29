const MechanicalIssue = require("../models/mechanical/Issue");
const MechanicalStock = require("../models/mechanical/Stock");

/* ================= CREATE ================= */
exports.createIssue = async (req, res) => {
  try {
    const { issuedTo, issueDate, location, items } = req.body;

    if (!issuedTo || !issueDate) {
      return res.status(400).json({ message: "Issued To & Date required" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "At least one item required" });
    }

    const cleanItems = items
      .filter(i => i.itemName && Number(i.qty) > 0 && i.unit)
      .map(i => ({
        itemName: i.itemName.trim(),
        qty: Number(i.qty),
        unit: i.unit,
      }));

    if (cleanItems.length === 0) {
      return res.status(400).json({ message: "Invalid item data" });
    }

    // Stock validation
    for (const item of cleanItems) {
      const stock = await MechanicalStock.findOne({
        itemName: { $regex: `^${item.itemName}$`, $options: "i" },
      });

      if (!stock || stock.qty < item.qty) {
        return res.status(400).json({
          message: `Insufficient stock for ${item.itemName}`,
        });
      }
    }

    const issue = await MechanicalIssue.create({
      issuedTo,
      issueDate,
      location,
      items: cleanItems,
    });

    for (const item of cleanItems) {
      await MechanicalStock.findOneAndUpdate(
        { itemName: { $regex: `^${item.itemName}$`, $options: "i" } },
        { $inc: { qty: -item.qty } }
      );
    }

    res.status(201).json(issue);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Create failed" });
  }
};

/* ================= GET ALL ================= */
exports.getIssues = async (req, res) => {
  try {
    const issues = await MechanicalIssue.find().sort({ createdAt: -1 });
    res.json(issues);
  } catch {
    res.status(500).json({ message: "Fetch failed" });
  }
};

/* ================= GET ONE ================= */
exports.getIssueById = async (req, res) => {
  try {
    const issue = await MechanicalIssue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: "Not found" });
    res.json(issue);
  } catch {
    res.status(500).json({ message: "Fetch failed" });
  }
};

/* ================= UPDATE ================= */
exports.updateIssue = async (req, res) => {
  try {
    const issue = await MechanicalIssue.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(issue);
  } catch {
    res.status(500).json({ message: "Update failed" });
  }
};

/* ================= DELETE ================= */
exports.deleteIssue = async (req, res) => {
  try {
    const issue = await MechanicalIssue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: "Not found" });

    for (const item of issue.items) {
      await MechanicalStock.findOneAndUpdate(
        { itemName: item.itemName },
        { $inc: { qty: item.qty } }
      );
    }

    await issue.deleteOne();
    res.json({ message: "Deleted" });
  } catch {
    res.status(500).json({ message: "Delete failed" });
  }
};
