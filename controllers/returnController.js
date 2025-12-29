const PPERReturn = require("../models/ppe/Return"); // adjust path if needed
const Stock = require("../models/ppe/Stock");

/**
 * CREATE PPE RETURN
 * Stock will INCREASE
 */
exports.createPPEReturn = async (req, res) => {
  try {
    const { personName, location, returnDate, items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items to return" });
    }

    // 🔺 Increase stock
    for (const item of items) {
      await Stock.updateOne(
        { itemName: item.itemName },
        {
          $inc: { qty: Number(item.quantity) },
          $setOnInsert: { unit: item.unit },
        },
        { upsert: true }
      );
    }

    const returned = await PPERReturn.create({
      personName,
      location,
      returnDate,
      items,
    });

    res.status(201).json(returned);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET ALL PPE RETURNS
 */
exports.getPPEReturns = async (req, res) => {
  try {
    const returns = await PPERReturn.find().sort({ createdAt: -1 });
    res.json(returns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET PPE RETURN BY ID
 */
exports.getPPEReturnById = async (req, res) => {
  try {
    const record = await PPERReturn.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: "Return record not found" });
    }

    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * UPDATE PPE RETURN
 * (Adjust stock difference safely)
 */
exports.updatePPEReturn = async (req, res) => {
  try {
    const oldReturn = await PPERReturn.findById(req.params.id);
    if (!oldReturn) {
      return res.status(404).json({ message: "Return record not found" });
    }

    const newItems = req.body.items || [];

    // 🔄 Revert old stock
    for (const item of oldReturn.items) {
      await Stock.updateOne(
        { itemName: item.itemName },
        { $inc: { qty: -Number(item.quantity) } }
      );
    }

    // 🔺 Apply new stock
    for (const item of newItems) {
      await Stock.updateOne(
        { itemName: item.itemName },
        { $inc: { qty: Number(item.quantity) } }
      );
    }

    const updated = await PPERReturn.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * DELETE PPE RETURN
 * (Revert stock)
 */
exports.deletePPEReturn = async (req, res) => {
  try {
    const record = await PPERReturn.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: "Return record not found" });
    }

    // 🔄 Revert stock
    for (const item of record.items) {
      await Stock.updateOne(
        { itemName: item.itemName },
        { $inc: { qty: -Number(item.quantity) } }
      );
    }

    await record.deleteOne();
    res.json({ message: "Return record deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
