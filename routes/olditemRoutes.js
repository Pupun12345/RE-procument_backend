const express = require("express");
const router = express.Router();
const OldItem = require("../models/old/OldItem");

/* ===== ADD OLD ITEM ===== */
router.post("/", async (req, res) => {
  try {
    const { itemName, unit } = req.body;

    if (!itemName || !unit) {
      return res.status(400).json({
        success: false,
        message: "Item name and unit required",
      });
    }

    const exists = await OldItem.findOne({ itemName: itemName.trim() });
    if (exists) {
      return res.status(409).json({
        success: false,
        message: "Item already exists",
      });
    }

    const item = await OldItem.create({
      itemName: itemName.trim(),
      unit: unit.trim(),
    });

    res.status(201).json({
      success: true,
      item,
    });
  } catch (err) {
    console.error("Old Item Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/* ===== GET OLD ITEMS ===== */
router.get("/", async (req, res) => {
  try {
    const items = await OldItem.find().sort({ createdAt: -1 });
    res.status(200).json(items);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;
