const mongoose = require("mongoose");
const ScaffoldingReturn = require("../models/scaffolding/Return");
const ScaffoldingStock = require("../models/scaffolding/Stock");

/* ================= CREATE RETURN ================= */
exports.createScaffoldingReturn = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      woNumber,
      personName,
      location,
      supervisorName = "",
      tslName = "",
      returnDate,
      items,
    } = req.body;

    // 🔐 Basic validation
    if (
      !personName ||
      !location ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Invalid return data" });
    }

    // 🔐 Validate items
    for (const item of items) {
      if (
        !item.itemName ||
        !item.unit ||
        typeof item.quantity !== "number" ||
        item.quantity <= 0
      ) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          message: "Invalid item data in return",
        });
      }
    }

    // 🔺 Increase stock (RETURN = IN)
    for (const item of items) {
      await ScaffoldingStock.findOneAndUpdate(
        {
          itemName: { $regex: `^${item.itemName}$`, $options: "i" },
        },
        {
          $inc: { qty: item.quantity },
          $setOnInsert: { unit: item.unit },
        },
        { upsert: true, session }
      );
    }

    // 💾 Save return record
    const [saved] = await ScaffoldingReturn.create(
      [
        {
          woNumber,
          personName,
          location,
          supervisorName,
          tslName,
          returnDate,
          items,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json(saved);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("SCAFFOLDING RETURN ERROR:", err);
    res.status(500).json({ message: "Failed to save scaffolding return" });
  }
};

/* ================= GET ALL RETURNS ================= */
exports.getScaffoldingReturns = async (req, res) => {
  try {
    const data = await ScaffoldingReturn.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    console.error("GET SCAFFOLDING RETURNS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch scaffolding returns" });
  }
};

/* ================= DELETE RETURN ================= */
exports.deleteScaffoldingReturn = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const record = await ScaffoldingReturn.findById(req.params.id).session(
      session
    );

    if (!record) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Return not found" });
    }

    // 🔄 Rollback stock
    for (const item of record.items) {
      await ScaffoldingStock.findOneAndUpdate(
        {
          itemName: { $regex: `^${item.itemName}$`, $options: "i" },
        },
        { $inc: { qty: -item.quantity } },
        { session }
      );
    }

    await record.deleteOne({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({ message: "Scaffolding return deleted" });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("DELETE RETURN ERROR:", err);
    res.status(500).json({ message: "Delete failed" });
  }
};
