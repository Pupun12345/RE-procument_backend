const ScaffoldingPurchase = require("../models/scaffolding/Purchase");
const ScaffoldingStock = require("../models/scaffolding/Stock");

exports.createPurchase = async (req, res) => {
  try {
    // 1️⃣ SAVE PURCHASE (no field mismatch)
    const purchase = await ScaffoldingPurchase.create(req.body);

    // 2️⃣ UPDATE STOCK
    for (const item of purchase.items) {
      const itemName = item.itemName || item.name;
      const qty = Number(item.qty || item.quantity || 0);
      const unit = item.unit || item.uom || "-";

      if (!itemName || qty === 0) continue;

      await ScaffoldingStock.findOneAndUpdate(
        { itemName },
        {
          $inc: { qty },
          $setOnInsert: { unit },
        },
        { upsert: true }
      );
    }

    res.status(201).json(purchase);
  } catch (err) {
    console.error("SCAFFOLDING PURCHASE ERROR:", err);
    res.status(500).json({
      message: "Failed to save Scaffolding purchase",
      error: err.message,
    });
  }
};


exports.getPurchases = async (req, res) => {
  try {
    const purchases = await ScaffoldingPurchase
      .find()
      .sort({ createdAt: -1 });

    res.json(purchases);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch Scaffolding purchases" });
  }
};

exports.deletePurchase = async (req, res) => {
  try {
    const purchase = await ScaffoldingPurchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    // 🔻 Reduce stock
    for (const item of purchase.items) {
      const itemName = item.itemName || item.name;
      const qty = Number(item.qty || item.quantity || 0);

      if (!itemName || qty === 0) continue;

      await ScaffoldingStock.findOneAndUpdate(
        { itemName },
        { $inc: { qty: -qty } }
      );
    }

    await ScaffoldingPurchase.findByIdAndDelete(req.params.id);

    res.json({ message: "Scaffolding purchase deleted" });
  } catch (err) {
    console.error("DELETE SCAFFOLDING ERROR:", err);
    res.status(500).json({ message: "Delete failed" });
  }
};
