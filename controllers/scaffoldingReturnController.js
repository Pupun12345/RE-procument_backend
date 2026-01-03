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
    // 🔺 Increase stock (RETURN = IN)
    for (const item of items) {
      const stock = await ScaffoldingStock.findOne({
        itemName: { $regex: `^${item.itemName}$`, $options: "i" },
      }).session(session);

      if (!stock) continue;

      const qty = Number(item.quantity);
      const weight = qty * stock.puw;

      await ScaffoldingStock.findOneAndUpdate(
        { itemName: stock.itemName },
        {
          $inc: {
            qty: qty,
            weight: weight, // ✅ INCREASE WEIGHT
          },
        },
        { session }
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
      const stock = await ScaffoldingStock.findOne({
        itemName: { $regex: `^${item.itemName}$`, $options: "i" },
      }).session(session);

      if (!stock) continue;

      const qty = Number(item.quantity);
      const weight = qty * stock.puw;

      await ScaffoldingStock.findOneAndUpdate(
        { itemName: stock.itemName },
        {
          $inc: {
            qty: -qty,
            weight: -weight, // ✅ ROLLBACK WEIGHT
          },
        },
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
/* ================= UPDATE RETURN (EDIT) ================= */
exports.updateScaffoldingReturn = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const {
      woNumber,
      personName,
      location,
      supervisorName = "",
      tslName = "",
      returnDate,
      items,
    } = req.body;

    if (!personName || !location) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Invalid update data" });
    }

    // 1️⃣ Find old return
    const oldReturn = await ScaffoldingReturn.findById(id).session(session);
    if (!oldReturn) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Return not found" });
    }

    // 2️⃣ ONLY touch stock & items if items are provided
    if (Array.isArray(items) && items.length > 0) {
      // 🔻 rollback OLD stock
      for (const oldItem of oldReturn.items) {
        const stock = await ScaffoldingStock.findOne({
          itemName: { $regex: `^${oldItem.itemName}$`, $options: "i" },
        }).session(session);

        if (!stock) continue;

        const qty = Number(oldItem.quantity);
        const weight = qty * stock.puw;

        await ScaffoldingStock.findOneAndUpdate(
          { itemName: stock.itemName },
          {
            $inc: {
              qty: -qty,
              weight: -weight,
            },
          },
          { session }
        );
      }

      // 🔺 apply NEW stock
      for (const newItem of items) {
        const stock = await ScaffoldingStock.findOne({
          itemName: { $regex: `^${newItem.itemName}$`, $options: "i" },
        }).session(session);

        if (!stock) continue;

        const qty = Number(newItem.quantity);
        const weight = qty * stock.puw;

        await ScaffoldingStock.findOneAndUpdate(
          { itemName: stock.itemName },
          {
            $inc: {
              qty: qty,
              weight: weight,
            },
          },
          { session }
        );
      }

      // update items ONLY here
      oldReturn.items = items;
    }

    // 3️⃣ Always update non-item fields
    oldReturn.woNumber = woNumber;
    oldReturn.personName = personName;
    oldReturn.location = location;
    oldReturn.supervisorName = supervisorName;
    oldReturn.tslName = tslName;
    oldReturn.returnDate = returnDate;

    await oldReturn.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({
      message: "Scaffolding return updated successfully",
      data: oldReturn,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("UPDATE RETURN ERROR:", err);
    res.status(500).json({ message: "Update failed" });
  }
};
