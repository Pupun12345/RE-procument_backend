const express = require("express");
const router = express.Router();

const OldPurchase = require("../../models/old/OldPurchase");
const OldStock = require("../../models/old/OldStock");

/* ================= CREATE (POST) ================= */
router.post("/", async (req, res) => {
  try {
    const purchase = await OldPurchase.create(req.body);

    // 🔺 UPDATE STOCK
    for (const item of purchase.items) {
      if (!item.itemName || !item.qty) continue;

      await OldStock.findOneAndUpdate(
        { itemName: item.itemName },
        {
          $inc: { qty: Number(item.qty) },
          $setOnInsert: { unit: item.unit },
        },
        { upsert: true }
      );
    }

    res.status(201).json({
      success: true,
      purchase,
    });
  } catch (err) {
    console.error("Create Old Purchase Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to save old purchase",
    });
  }
});

/* ================= READ ALL (GET) ================= */
router.get("/", async (req, res) => {
  try {
    const purchases = await OldPurchase.find().sort({ createdAt: -1 });
    res.status(200).json(purchases);
  } catch (err) {
    console.error("Get Old Purchases Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch old purchases",
    });
  }
});

/* ================= READ ONE (GET BY ID) ================= */
router.get("/:id", async (req, res) => {
  try {
    const purchase = await OldPurchase.findById(req.params.id);

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Old purchase not found",
      });
    }

    res.status(200).json(purchase);
  } catch (err) {
    console.error("Get Old Purchase Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch old purchase",
    });
  }
});

/* ================= UPDATE (PUT) ================= */
router.put("/:id", async (req, res) => {
  try {
    const existing = await OldPurchase.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Old purchase not found",
      });
    }

    // 🔻 ROLLBACK OLD STOCK
    for (const item of existing.items) {
      if (!item.itemName || !item.qty) continue;

      await OldStock.findOneAndUpdate(
        { itemName: item.itemName },
        { $inc: { qty: -Number(item.qty) } }
      );
    }

    // 🔺 APPLY NEW STOCK
    for (const item of req.body.items || []) {
      if (!item.itemName || !item.qty) continue;

      await OldStock.findOneAndUpdate(
        { itemName: item.itemName },
        {
          $inc: { qty: Number(item.qty) },
          $setOnInsert: { unit: item.unit },
        },
        { upsert: true }
      );
    }

    const updated = await OldPurchase.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json({
      success: true,
      purchase: updated,
    });
  } catch (err) {
    console.error("Update Old Purchase Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update old purchase",
    });
  }
});

/* ================= DELETE (DELETE) ================= */
router.delete("/:id", async (req, res) => {
  try {
    const purchase = await OldPurchase.findById(req.params.id);

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Old purchase not found",
      });
    }

    // 🔻 ROLLBACK STOCK
    for (const item of purchase.items) {
      if (!item.itemName || !item.qty) continue;

      await OldStock.findOneAndUpdate(
        { itemName: item.itemName },
        { $inc: { qty: -Number(item.qty) } }
      );
    }

    await OldPurchase.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Old purchase deleted successfully",
    });
  } catch (err) {
    console.error("Delete Old Purchase Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete old purchase",
    });
  }
});

module.exports = router;
