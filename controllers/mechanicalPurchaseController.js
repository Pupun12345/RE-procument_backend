const MECHANICALPurchase = require("../models/mechanical/Purchase");
const Stock = require("../models/mechanical/Stock");

/* ================= CREATE PURCHASE ================= */
exports.createPurchase = async (req, res) => {
  try {
    const {
      partyName,
      invoiceNumber,
      invoiceDate,
      items,
      subtotal,
      gstPercent,
      gstAmount,
      total,
    } = req.body;

    if (!partyName || !invoiceNumber || !invoiceDate || !items?.length) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 1️⃣ Save purchase
    const purchase = await MECHANICALPurchase.create({
      partyName,
      invoiceNumber,
      invoiceDate,
      items,
      subtotal,
      gstPercent,
      gstAmount,
      total,
    });

    // 2️⃣ UPDATE STOCK (IN)
    for (const item of items) {
      await Stock.findOneAndUpdate(
        { itemName: item.itemName },
        {
          $inc: { qty: Number(item.qty) },
          $setOnInsert: { unit: item.unit },
        },
        { upsert: true, new: true }
      );
    }

    res.status(201).json(purchase);
  } catch (err) {
    console.error("MECHANICAL PURCHASE ERROR:", err);
    res.status(500).json({
      message: "Failed to save MECHANICAL purchase",
      error: err.message,
    });
  }
};

/* ================= GET PURCHASES ================= */
exports.getPurchases = async (req, res) => {
  try {
    const purchases = await MECHANICALPurchase.find().sort({ createdAt: -1 });
    res.json(purchases);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch MECHANICAL purchases" });
  }
};

/* ================= DELETE PURCHASE ================= */
exports.deletePurchase = async (req, res) => {
  try {
    // 1️⃣ Find purchase first
    const purchase = await MECHANICALPurchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    // 2️⃣ UPDATE STOCK (ROLLBACK)
    for (const item of purchase.items) {
      await Stock.findOneAndUpdate(
        { itemName: item.itemName },
        { $inc: { qty: -Number(item.qty) } }
      );
    }

    // 3️⃣ Delete purchase
    await MECHANICALPurchase.findByIdAndDelete(req.params.id);

    res.json({ message: "MECHANICAL purchase deleted" });
  } catch (err) {
    console.error("DELETE MECHANICAL ERROR:", err);
    res.status(500).json({ message: "Delete failed" });
  }
};
