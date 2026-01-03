const express = require("express");
const router = express.Router();
const ScaffoldingStock = require("../../models/scaffolding/Stock");
const { getStock } = require("../../controllers/scaffoldingStockController");

/* ================= GET SCAFFOLDING STOCK ================= */
router.get("/", getStock);

/* ================= ADD OLD SCAFFOLDING STOCK ================= */
router.post("/", async (req, res) => {
  try {
    const { itemName, qty, unit, puw, weight } = req.body;

    // 🔐 Basic validation
    if (
      !itemName ||
      !unit ||
      Number(qty) <= 0 ||
      Number(puw) <= 0
    ) {
      return res.status(400).json({ message: "Invalid stock data" });
    }

    const calculatedWeight = Number(qty) * Number(puw);

    const updated = await ScaffoldingStock.findOneAndUpdate(
      {
        itemName: { $regex: `^${itemName}$`, $options: "i" },
      },
      {
        $inc: {
          qty: Number(qty),
          weight: calculatedWeight, // 🔑 important
        },
        $setOnInsert: {
          unit,
          puw: Number(puw),
        },
      },
      {
        upsert: true,
        new: true,
      }
    );

    res.json({
      message: "Old scaffolding stock added successfully",
      stock: updated,
    });
  } catch (err) {
    console.error("ADD OLD SCAFFOLDING STOCK ERROR:", err);
    res.status(500).json({
      message: "Failed to add old scaffolding stock",
    });
  }
});

module.exports = router;
