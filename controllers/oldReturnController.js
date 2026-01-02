const OldReturn = require("../models/old/OldReturn");
const OldStock = require("../models/old/OldStock");

/* ================= CREATE RETURN ================= */
exports.createReturn = async (req, res) => {
  try {
    const { personName, returnDate, location, items } = req.body;

    if (
      !personName ||
      !returnDate ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({ message: "Invalid return data" });
    }

    // 1️⃣ Save return
    const record = await OldReturn.create({
      personName,
      returnDate,
      location,
      items,
    });

    // 2️⃣ INCREASE STOCK (SAFE)
    for (const item of items) {
      const qty = Number(item.quantity ?? item.qty ?? 0);

      if (!item.itemName || !Number.isFinite(qty) || qty <= 0) {
        continue; // ⬅️ prevents NaN crash
      }

      await OldStock.findOneAndUpdate(
        { itemName: item.itemName },
        {
          $inc: { qty },
          $setOnInsert: { unit: item.unit || "-" },
        },
        { upsert: true }
      );
    }

    res.status(201).json(record);
  } catch (err) {
    console.error("OLD RETURN CREATE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ================= GET RETURNS ================= */
exports.getReturns = async (req, res) => {
  try {
    const records = await OldReturn.find().sort({ createdAt: -1 });
    res.json(records);
  } catch (err) {
    console.error("OLD RETURN GET ERROR:", err);
    res.status(500).json({
      message: err.message || "Failed to fetch OLD returns",
    });
  }
};
exports.getReturnById = async (req, res) => {
  try {
    const record = await OldReturn.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: "Return not found" });
    }
    res.json(record);
  } catch (err) {
    console.error("GET OLD RETURN BY ID ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};



/* ================= UPDATE RETURN ================= */
exports.updateReturn = async (req, res) => {
  try {
    const existing = await OldReturn.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Return not found" });
    }

    // 🔁 ROLLBACK OLD STOCK
    for (const item of existing.items) {
      const qty = Number(item.quantity ?? item.qty ?? 0);
      if (!Number.isFinite(qty) || qty <= 0) continue;

      await OldStock.findOneAndUpdate(
        { itemName: item.itemName },
        { $inc: { qty: -qty } }
      );
    }

    // 🔺 APPLY NEW STOCK
    for (const item of req.body.items || []) {
      const qty = Number(item.quantity ?? item.qty ?? 0);
      if (!item.itemName || !Number.isFinite(qty) || qty <= 0) continue;

      await OldStock.findOneAndUpdate(
        { itemName: item.itemName },
        {
          $inc: { qty },
          $setOnInsert: { unit: item.unit || "-" },
        },
        { upsert: true }
      );
    }

    const updated = await OldReturn.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.json(updated);
  } catch (err) {
    console.error("OLD RETURN UPDATE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ================= DELETE RETURN ================= */
exports.deleteReturn = async (req, res) => {
  try {
    const record = await OldReturn.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: "Return not found" });
    }

    // 🔻 DECREASE STOCK
    for (const item of record.items) {
      const qty = Number(item.quantity ?? item.qty ?? 0);
      if (!Number.isFinite(qty) || qty <= 0) continue;

      await OldStock.findOneAndUpdate(
        { itemName: item.itemName },
        { $inc: { qty: -qty } }
      );
    }

    await OldReturn.findByIdAndDelete(req.params.id);

    res.json({ message: "Old return deleted successfully" });
  } catch (err) {
    console.error("OLD RETURN DELETE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};
