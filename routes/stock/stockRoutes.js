const express = require("express");
const router = express.Router();
const Stock = require("../../models/ppe/Stock");

/* ================= GET STOCK (PPE) ================= */
router.get("/", async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 50);
    const search = req.query.search || "";

    const filter = search
      ? { itemName: { $regex: search, $options: "i" } }
      : {};

    const total = await Stock.countDocuments(filter);

    const data = await Stock.find(filter)
      .sort({ itemName: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ data, total });
  } catch (err) {
    console.error("STOCK FETCH ERROR:", err);
    res.status(500).json({ message: "Failed to fetch stock" });
  }
});

/* ================= ADD OLD STOCK ================= */
router.post("/", async (req, res) => {
  try {
    const { itemName, qty, unit } = req.body;

    if (!itemName || !unit || Number(qty) <= 0) {
      return res.status(400).json({ message: "Invalid stock data" });
    }

    const updated = await Stock.findOneAndUpdate(
      {
        itemName: { $regex: `^${itemName}$`, $options: "i" },
      },
      {
        $inc: { qty: Number(qty) },   // 🔑 DIRECT ADD
        $setOnInsert: { unit,itemName: itemName },
      },
      {
        upsert: true,
        new: true,
      }
    );

    res.json({
      message: "Old stock added successfully",
      stock: updated,
    });
  } catch (err) {
    console.error("ADD OLD STOCK ERROR:", err);
    res.status(500).json({ message: "Failed to add old stock" });
  }
});

module.exports = router;
