const mongoose = require("mongoose");
const MechanicalIssue = require("../models/mechanical/Issue");
const MechanicalReturn = require("../models/mechanical/Return");
const MechanicalStock = require("../models/mechanical/Stock");

exports.createMechanicalReturn = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();


  try {
    const { personName, location, returnDate, items } = req.body;

    if (!personName || !Array.isArray(items) || items.length === 0) {
      throw new Error("Invalid return data");
    }


    for (const item of items) {
      const returnQty = Number(item.quantity);
      if (returnQty <= 0) throw new Error("Invalid return qty");

      // 🔍 Find latest issue for this person + item
      const issue = await MechanicalIssue.findOne({
        issuedTo: personName,
        "items.itemName": item.itemName,
      }).sort({ createdAt: -1 }).session(session);

      if (!issue) {
        throw new Error(`No issue found for ${item.itemName}`);
      }

      const issueItem = issue.items.find(
        i => i.itemName === item.itemName
      );

      const remaining =
        issueItem.issuedQty - issueItem.returnedQty;

      if (returnQty > remaining) {
        throw new Error(
          `Return exceeds remaining qty for ${item.itemName}`
        );
      }

      // 🔺 Update issue
      issueItem.returnedQty += returnQty;
      await issue.save({ session });

      // 🔺 Update stock
      await MechanicalStock.findOneAndUpdate(
        { itemName: item.itemName },
        { $inc: { qty: returnQty } },
        { session }
      );
    }

    const saved = await MechanicalReturn.create(
      [{ personName, location, returnDate, items }],
      { session }
    );

    await session.commitTransaction();
    res.status(201).json(saved[0]);

  } catch (err) {
    await session.abortTransaction();
    console.error("MECHANICAL RETURN ERROR:", err);
    res.status(400).json({ message: err.message });
  } finally {
    session.endSession();
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
