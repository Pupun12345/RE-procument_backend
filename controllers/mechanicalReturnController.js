const MechanicalReturn = require("../models/mechanical/Return");
const MechanicalStock = require("../models/mechanical/Stock");

/* ================= CREATE RETURN ================= */
exports.createMechanicalReturn = async (req, res) => {
  try {
    const { personName, location, returnDate, items } = req.body;

    if (!personName || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Invalid return data" });
    }

    // 🔺 INCREASE STOCK
    for (const item of items) {
      await MechanicalStock.findOneAndUpdate(
        {
          itemName: { $regex: `^${item.itemName}$`, $options: "i" },
        },
        {
          $inc: { qty: Number(item.quantity) },
          $setOnInsert: { unit: item.unit },
        },
        { upsert: true }
      );
    }

    const saved = await MechanicalReturn.create({
      personName,
      location,
      returnDate,
      items,
    });

    res.status(201).json(saved);
  } catch (err) {
    console.error("MECHANICAL RETURN ERROR:", err);
    res.status(500).json({ message: "Failed to save mechanical return" });
  }
};

/* ================= GET ALL RETURNS ================= */
exports.getMechanicalReturns = async (req, res) => {
  try {
    const data = await MechanicalReturn.find().sort({ createdAt: -1 });
    res.json(data);
  } catch {
    res.status(500).json({ message: "Failed to fetch mechanical returns" });
  }
};

/* ================= GET RETURN BY ID ================= */
exports.getMechanicalReturnById = async (req, res) => {
  try {
    const record = await MechanicalReturn.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: "Return not found" });
    }
    res.json(record);
  } catch {
    res.status(500).json({ message: "Failed to fetch return" });
  }
};

/* ================= UPDATE RETURN ================= */
exports.updateMechanicalReturn = async (req, res) => {
  try {
    const oldRecord = await MechanicalReturn.findById(req.params.id);
    if (!oldRecord) {
      return res.status(404).json({ message: "Return not found" });
    }

    // 🔄 rollback old stock
    for (const item of oldRecord.items) {
      await MechanicalStock.findOneAndUpdate(
        { itemName: { $regex: `^${item.itemName}$`, $options: "i" } },
        { $inc: { qty: -item.quantity } }
      );
    }

    // 🔺 apply new stock
    for (const item of req.body.items) {
      await MechanicalStock.findOneAndUpdate(
        { itemName: { $regex: `^${item.itemName}$`, $options: "i" } },
        { $inc: { qty: Number(item.quantity) } }
      );
    }

    const updated = await MechanicalReturn.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updated);
  } catch {
    res.status(500).json({ message: "Update failed" });
  }
};

/* ================= DELETE RETURN ================= */
exports.deleteMechanicalReturn = async (req, res) => {
  try {
    const record = await MechanicalReturn.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: "Return not found" });
    }

    // 🔄 rollback stock
    for (const item of record.items) {
      await MechanicalStock.findOneAndUpdate(
        { itemName: { $regex: `^${item.itemName}$`, $options: "i" } },
        { $inc: { qty: -item.quantity } }
      );
    }

    await record.deleteOne();
    res.json({ message: "Mechanical return deleted successfully" });
  } catch {
    res.status(500).json({ message: "Delete failed" });
  }
};
