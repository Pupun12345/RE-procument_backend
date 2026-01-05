const ScaffoldingIssue = require("../models/scaffolding/Issue");
const ScaffoldingStock = require("../models/scaffolding/Stock");

// controllers/scaffoldingIssueController.js
exports.createIssue = async (req, res) => {
  try {
    // 🔥 Normalize items BEFORE saving
    const normalizedItems = req.body.items.map(item => ({
      ...item,
      returnedQty: 0,
      returnedWeight: 0,
    }));

    const issue = await ScaffoldingIssue.create({
      ...req.body,
      items: normalizedItems,
    });

    for (const item of normalizedItems) {
      const stock = await ScaffoldingStock.findOne({ itemName: item.itemName });
      if (!stock) continue;

      const issuedQty = Number(item.qty);
      const issuedWeight = issuedQty * stock.puw;

      await ScaffoldingStock.updateOne(
        { itemName: item.itemName },
        {
          $inc: {
            qty: -issuedQty,
            weight: -issuedWeight,
          },
        }
      );
    }

    res.status(201).json(issue);
  } catch (err) {
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
    if (!issue) return res.status(404).json({ message: "Issue not found" });

    for (const item of issue.items) {
      const stock = await ScaffoldingStock.findOne({ itemName: item.itemName });
      if (!stock) continue;

      const restoreWeight = item.qty * stock.puw;

      await ScaffoldingStock.findOneAndUpdate(
        { itemName: item.itemName },
        {
          $inc: {
            qty: item.qty,
            weight: restoreWeight,
          },
        }
      );
    }

    await issue.deleteOne();
    res.json({ message: "Issue deleted & stock restored" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
};


/* ================= UPDATE ISSUE (EDIT) ================= */
exports.updateIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      issuedTo,
      issueDate,
      location,
      woNumber,
      supervisorName,
      tslName,
      items,
    } = req.body;

    if (!issuedTo || !issueDate) {
      return res.status(400).json({ message: "Invalid update data" });
    }

    // 1️⃣ Find old issue
    const oldIssue = await ScaffoldingIssue.findById(id);
    if (!oldIssue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    /* ================= ROLLBACK OLD STOCK ================= */
    if (Array.isArray(oldIssue.items)) {
      for (const oldItem of oldIssue.items) {
        const stock = await ScaffoldingStock.findOne({
          itemName: oldItem.itemName,
        });
        if (!stock) continue;

        const qty = Number(oldItem.qty);
        const weight = qty * stock.puw;

        await ScaffoldingStock.findOneAndUpdate(
          { itemName: oldItem.itemName },
          {
            $inc: {
              qty: qty,
              weight: weight,
            },
          }
        );
      }
    }

    /* ================= APPLY NEW STOCK ================= */
    if (Array.isArray(items) && items.length > 0) {
      for (const newItem of items) {
        const stock = await ScaffoldingStock.findOne({
          itemName: newItem.itemName,
        });
        if (!stock) continue;

        const qty = Number(newItem.qty);
        const weight = qty * stock.puw;

        await ScaffoldingStock.findOneAndUpdate(
          { itemName: newItem.itemName },
          {
            $inc: {
              qty: -qty,
              weight: -weight,
            },
          }
        );
      }

      // update items only after stock is correct
      oldIssue.items = items;
    }

    /* ================= UPDATE OTHER FIELDS ================= */
    oldIssue.issuedTo = issuedTo;
    oldIssue.issueDate = issueDate;
    oldIssue.location = location;
    oldIssue.woNumber = woNumber;
    oldIssue.supervisorName = supervisorName;
    oldIssue.tslName = tslName;

    await oldIssue.save();

    res.json({
      message: "Issue updated successfully",
      issue: oldIssue,
    });
  } catch (err) {
    console.error("UPDATE ISSUE ERROR:", err);
    res.status(500).json({ message: "Update failed" });
  }
};


