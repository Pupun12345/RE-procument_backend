const PPEIssue = require("../models/ppe/issue");
const PPEStock = require("../models/ppe/Stock");

const normalizeItemName = (value = "") =>
  String(value).trim().replace(/\s+/g, " ").toLowerCase();

const findStockByItemName = async (itemName) => {
  const targetName = normalizeItemName(itemName);
  const stockItems = await PPEStock.find({}).lean();

  return stockItems.find((stock) => normalizeItemName(stock.itemName) === targetName) || null;
};

/* ================= CREATE PPE ISSUE ================= */

exports.createPPEIssue = async (req, res) => {
  try {
    console.log("RAW PPE PAYLOAD:", JSON.stringify(req.body, null, 2));

    const { issuedTo, issueDate, location, items } = req.body;

    if (!issuedTo || !issueDate) {
      return res.status(400).json({ message: "Issued To and Date required" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "At least one item required" });
    }

    const cleanItems = items
      .filter(i => i.itemName && Number(i.qty) > 0)
      .map(i => ({
        itemName: i.itemName.trim(),
        unit: i.unit || "",
        qty: Number(i.qty),
      }));

    if (cleanItems.length === 0) {
      return res.status(400).json({ message: "Invalid items data" });
    }

    const resolvedStockItems = [];

    // Stock validation
    for (const item of cleanItems) {
      const stock = await findStockByItemName(item.itemName);

      console.log("ISSUE ITEM:", item.itemName);
      console.log("STOCK FOUND:", stock);

      if (!stock || (stock.qty || 0) < item.qty) {
        return res.status(400).json({
          message: `Insufficient stock for ${item.itemName}`,
          available: stock ? stock.qty || 0 : 0,
          requested: item.qty,
        });
      }

      resolvedStockItems.push({ stockId: stock._id, qty: item.qty });
    }

    const issue = await PPEIssue.create({
      issuedTo,
      issueDate,
      location,
      items: cleanItems,
    });

    for (const item of resolvedStockItems) {
      await PPEStock.findByIdAndUpdate(item.stockId, {
        $inc: { qty: -item.qty },
      });
    }

    res.status(201).json(issue);
  } catch (err) {
    console.error("CREATE PPE ISSUE ERROR:", err);
    res.status(500).json({ message: "Failed to issue PPE" });
  }
};



/* ================= GET ALL PPE ISSUES ================= */
exports.getPPEIssues = async (req, res) => {
  try {
    const issues = await PPEIssue.find().sort({ createdAt: -1 });
    res.json(issues);
  } catch {
    res.status(500).json({ message: "Failed to fetch PPE issues" });
  }
};

/* ================= GET ONE (EDIT) ================= */
exports.getPPEIssueById = async (req, res) => {
  try {
    const issue = await PPEIssue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: "Not found" });
    res.json(issue);
  } catch {
    res.status(500).json({ message: "Failed to fetch PPE issue" });
  }
};

/* ================= UPDATE PPE ISSUE ================= */
exports.updatePPEIssue = async (req, res) => {
  try {
    const issue = await PPEIssue.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(issue);
  } catch {
    res.status(500).json({ message: "Failed to update PPE issue" });
  }
};

/* ================= DELETE PPE ISSUE ================= */
exports.deletePPEIssue = async (req, res) => {
  try {
    const issue = await PPEIssue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: "Not found" });

    // Restore stock
    for (const item of issue.items) {
      const stock = await findStockByItemName(item.itemName);
      if (stock) {
        await PPEStock.findByIdAndUpdate(stock._id, {
          $inc: { qty: item.qty },
        });
      }
    }

    await issue.deleteOne();
    res.json({ message: "PPE issue deleted" });
  } catch {
    res.status(500).json({ message: "Delete failed" });
  }
};
