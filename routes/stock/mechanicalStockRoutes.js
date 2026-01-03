const express = require("express");
const router = express.Router();
const MechanicalStock = require("../../models/mechanical/Stock");
const { getStock } = require("../../controllers/mechanicalStockController");

/* ================= GET MECHANICAL STOCK ================= */
router.get("/", getStock);

/* ================= ADD OLD MECHANICAL STOCK ================= */
router.post("/", async (req, res) => {
  try {
    const { itemName, qty, unit } = req.body;

    // 🔐 Basic validation
    if (!itemName || !unit || Number(qty) <= 0) {
      return res.status(400).json({ message: "Invalid stock data" });
    }

    const updated = await MechanicalStock.findOneAndUpdate(
      {
        itemName: { $regex: `^${itemName}$`, $options: "i" },
      },
      {
        $inc: { qty: Number(qty) },   // 🔑 DIRECT ADD
        $setOnInsert: { unit },
      },
      {
        upsert: true,
        new: true,
      }
    );

    res.json({
      message: "Old mechanical stock added successfully",
      stock: updated,
    });
  } catch (err) {
    console.error("ADD OLD MECHANICAL STOCK ERROR:", err);
    res.status(500).json({ message: "Failed to add old mechanical stock" });
  }
});

module.exports = router;
