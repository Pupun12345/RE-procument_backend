const PPEPurchase = require("../models/ppe/Purchase");
const Stock = require("../models/ppe/Stock");

/* ================= CREATE PURCHASE ================= */
// 🛠️ Add this helper function at the top of your file (or inside the controller)
const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escapes special regex characters
};

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

    // 🔴 Basic validation
    if (!partyName || !invoiceNumber || !invoiceDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "At least one item is required" });
    }

    // ✅ Sanitize + validate items
    const cleanItems = items
      .filter(i => i.itemName && Number(i.qty) > 0 && i.unit)
      .map(i => ({
        itemName: i.itemName.trim(),
        unit: i.unit,
        qty: Number(i.qty),
        rate: Number(i.rate || 0),
        amount: Number(i.amount || 0),
      }));

    if (cleanItems.length === 0) {
      return res.status(400).json({ message: "Invalid purchase items" });
    }

    // 1️⃣ Save purchase
    const purchase = await PPEPurchase.create({
      partyName,
      invoiceNumber,
      invoiceDate,
      items: cleanItems,
      subtotal,
      gstPercent,
      gstAmount,
      total,
    });

    // 2️⃣ UPDATE STOCK (IN)
    for (const item of cleanItems) {
      // 🟢 Escape the string before using it in Regex
      const safeRegexName = escapeRegex(item.itemName);

      await Stock.findOneAndUpdate(
        {
          // ✅ Safe Case-insensitive item matching
          itemName: { $regex: `^${safeRegexName}$`, $options: "i" },
        },
        {
          $inc: { qty: item.qty },
          $setOnInsert: { unit: item.unit, itemName: item.itemName },
        },
        { upsert: true, new: true } 
      );
    }

    res.status(201).json(purchase);
  } catch (err) {
    console.error("PPE PURCHASE ERROR:", err);
    res.status(500).json({
      message: "Failed to save PPE purchase",
      error: err.message,
    });
  }
};

/* ================= GET PURCHASES ================= */
exports.getPurchases = async (req, res) => {
  try {
    const purchases = await PPEPurchase.find().sort({ createdAt: -1 });
    res.json(purchases);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch PPE purchases" });
  }
};

/* ================= DELETE PURCHASE ================= */
exports.deletePurchase = async (req, res) => {
  try {
    // 1️⃣ Find purchase
    const purchase = await PPEPurchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    // 2️⃣ SAFETY CHECK — prevent negative stock
    for (const item of purchase.items) {
      const stock = await Stock.findOne({
        itemName: { $regex: `^${item.itemName}$`, $options: "i" },
      });

      if (!stock || stock.qty < item.qty) {
        return res.status(400).json({
          message: `Cannot delete purchase. Stock already issued for ${item.itemName}`,
        });
      }
    }

    // 3️⃣ ROLLBACK STOCK
    for (const item of purchase.items) {
      await Stock.findOneAndUpdate(
        {
          itemName: { $regex: `^${item.itemName}$`, $options: "i" },
        },
        { $inc: { qty: -Number(item.qty) } }
      );
    }

    // 4️⃣ Delete purchase
    await PPEPurchase.findByIdAndDelete(req.params.id);

    res.json({ message: "PPE purchase deleted successfully" });
  } catch (err) {
    console.error("DELETE PPE ERROR:", err);
    res.status(500).json({ message: "Delete failed" });
  }
};
/* ================= UPDATE PURCHASE ================= */
exports.updatePurchase = async (req, res) => {
  try {
    const { id } = req.params;

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

    const existingPurchase = await PPEPurchase.findById(id);
    if (!existingPurchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    // 🔄 Rollback old stock
    for (const item of existingPurchase.items) {
      await Stock.findOneAndUpdate(
        { itemName: { $regex: `^${item.itemName}$`, $options: "i" } },
        { $inc: { qty: -Number(item.qty) } }
      );
    }

    // ✅ Sanitize new items
    const cleanItems = items
      .filter(i => i.itemName && Number(i.qty) > 0 && i.unit)
      .map(i => ({
        itemName: i.itemName.trim(),
        unit: i.unit,
        qty: Number(i.qty),
        rate: Number(i.rate || 0),
        amount: Number(i.amount || 0),
      }));

    // 🔄 Apply new stock
    for (const item of cleanItems) {
      await Stock.findOneAndUpdate(
        { itemName: { $regex: `^${item.itemName}$`, $options: "i" } },
        {
          $inc: { qty: item.qty },
          $setOnInsert: { unit: item.unit },
        },
        { upsert: true }
      );
    }

    // 💾 Update purchase
    const updatedPurchase = await PPEPurchase.findByIdAndUpdate(
      id,
      {
        partyName,
        invoiceNumber,
        invoiceDate,
        items: cleanItems,
        subtotal,
        gstPercent,
        gstAmount,
        total,
      },
      { new: true }
    );

    res.json(updatedPurchase);
  } catch (err) {
    console.error("UPDATE PPE ERROR:", err);
    res.status(500).json({ message: "Failed to update purchase" });
  }
};
