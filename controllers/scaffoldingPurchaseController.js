const ScaffoldingPurchase = require("../models/scaffolding/Purchase");
const ScaffoldingStock = require("../models/scaffolding/Stock");

exports.createPurchase = async (req, res) => {
  try {
    // 1️⃣ SAVE PURCHASE (no field mismatch)
    const purchase = await ScaffoldingPurchase.create(req.body);

    // 2️⃣ UPDATE STOCK
    for (const item of purchase.items) {
  const itemName = item.itemName || item.name;
  const qty = Number(item.qty || 0);
  const unit = item.unit || item.uom || "-";
  const puw = Number(item.puw || 0);
  const weight = qty * puw;

  if (!itemName || qty === 0 || puw === 0) continue;

  await ScaffoldingStock.findOneAndUpdate(
    { itemName },
    {
      $inc: {
        qty,
        weight,          // ✅ UPDATE WEIGHT
      },
      $setOnInsert: {
        unit,
        puw,             // ✅ STORE PUW ONCE
      },
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
  const qty = Number(item.qty || 0);
  const puw = Number(item.puw || 0);
  const weight = qty * puw;

  if (!itemName || qty === 0 || puw === 0) continue;

  await ScaffoldingStock.findOneAndUpdate(
    { itemName },
    {
      $inc: {
        qty: -qty,
        weight: -weight,   // ✅ ROLLBACK WEIGHT
      },
    }
  );
}


    await ScaffoldingPurchase.findByIdAndDelete(req.params.id);

    res.json({ message: "Scaffolding purchase deleted" });
  } catch (err) {
    console.error("DELETE SCAFFOLDING ERROR:", err);
    res.status(500).json({ message: "Delete failed" });
  }
};
/* ================= UPDATE PURCHASE ================= */
exports.updatePurchase = async (req, res) => {
  try {
    const { id } = req.params;

    // 1️⃣ Find existing purchase
    const existingPurchase = await ScaffoldingPurchase.findById(id);
    if (!existingPurchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    /* ================= ROLLBACK OLD STOCK ================= */
    for (const item of existingPurchase.items) {
      const itemName = item.itemName || item.name;
      const qty = Number(item.qty || 0);
      const puw = Number(item.puw || 0);
      const weight = qty * puw;

      if (!itemName || qty === 0 || puw === 0) continue;

      await ScaffoldingStock.findOneAndUpdate(
        { itemName },
        {
          $inc: {
            qty: -qty,
            weight: -weight, // ✅ rollback weight
          },
        }
      );
    }

    /* ================= APPLY NEW STOCK ================= */
    for (const item of req.body.items || []) {
      const itemName = item.itemName || item.name;
      const qty = Number(item.qty || 0);
      const unit = item.unit || item.uom || "-";
      const puw = Number(item.puw || 0);
      const weight = qty * puw;

      if (!itemName || qty === 0 || puw === 0) continue;

      await ScaffoldingStock.findOneAndUpdate(
        { itemName },
        {
          $inc: {
            qty,
            weight, // ✅ apply weight
          },
          $setOnInsert: {
            unit,
            puw, // ✅ store PUW once
          },
        },
        { upsert: true }
      );
    }

    /* ================= UPDATE PURCHASE ================= */
    const updatedPurchase = await ScaffoldingPurchase.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    res.json(updatedPurchase);
  } catch (err) {
    console.error("UPDATE SCAFFOLDING ERROR:", err);
    res.status(500).json({
      message: "Failed to update Scaffolding purchase",
      error: err.message,
    });
  }
};

