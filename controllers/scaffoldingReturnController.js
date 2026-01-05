const mongoose = require("mongoose");
const ScaffoldingReturn = require("../models/scaffolding/Return");
const ScaffoldingStock = require("../models/scaffolding/Stock");
const ScaffoldingIssue = require("../models/scaffolding/Issue");

/* ================= CREATE RETURN ================= */
exports.createScaffoldingReturn = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { issueId, items } = req.body;

    const issue = await ScaffoldingIssue.findById(issueId).session(session);
    if (!issue) throw new Error("Issue not found");

    for (const item of items) {
const issueItem = issue.items.find(
  (i) =>
    i.itemName.trim().toLowerCase() ===
    item.itemName.trim().toLowerCase()
);

      if (!issueItem) {
        throw new Error(`${item.itemName} not found in issue`);
      }

      const issuedQty = Number(issueItem.qty);
      const returnedQty = Number(issueItem.returnedQty || 0);
      const returnQty = Number(item.quantity);

      const remainingQty = issuedQty - returnedQty;

      // 🔒 HARD BLOCK
      if (returnQty <= 0 || returnQty > remainingQty) {
        throw new Error(`Return exceeds issued qty for ${item.itemName}`);
      }

      const stock = await ScaffoldingStock.findOne({
        itemName: item.itemName,
      }).session(session);

      const returnWeight = returnQty * stock.puw;

      // 🔺 Update stock
      await ScaffoldingStock.updateOne(
        { itemName: item.itemName },
        {
          $inc: {
            qty: returnQty,
            weight: returnWeight,
          },
        },
        { session }
      );

      // 🔺 Update issue tracking
      issueItem.returnedQty += returnQty;
      issueItem.returnedWeight += returnWeight;
    }

    await issue.save({ session });
    await ScaffoldingReturn.create([req.body], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ message: "Return successful" });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: err.message });
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
      const issue = await ScaffoldingIssue.findById(record.issueId).session(
        session
      );
      if (!issue) continue;

const issueItem = issue.items.find(
  (i) =>
    i.itemName.trim().toLowerCase() ===
    item.itemName.trim().toLowerCase()
);
      if (!issueItem) continue;

      const qty = Number(item.quantity);
      const stock = await ScaffoldingStock.findOne({
        itemName: item.itemName,
      }).session(session);
      const weight = qty * stock.puw;

      // 🔄 rollback issue
      issueItem.returnedQty -= qty;
      issueItem.returnedWeight -= weight;

      // 🔄 rollback stock
      await ScaffoldingStock.updateOne(
        { itemName: item.itemName },
        {
          $inc: { qty: -qty, weight: -weight },
        },
        { session }
      );

      await issue.save({ session });
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
