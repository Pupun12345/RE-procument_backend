const PPEItem = require("../models/ppe/Item");
const MechanicalItem = require("../models/mechanical/Item");
const ScaffoldingItem = require("../models/scaffolding/Item");

const modelMap = {
  ppe: PPEItem,
  mechanical: MechanicalItem,
  scaffolding: ScaffoldingItem,
};

// GET items
exports.getItems = async (req, res) => {
  const { type } = req.params; // ppe / mechanical / scaffolding
  const Model = modelMap[type];

  if (!Model) {
    return res.status(400).json({ message: "Invalid item type" });
  }

  try {
    const items = await Model.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch items" });
  }
};

// CREATE item
exports.createItem = async (req, res) => {
  const { type } = req.params;
  const { itemName, unit, puw } = req.body;
  const Model = modelMap[type];

  if (!Model) {
    return res.status(400).json({ message: "Invalid item type" });
  }

  if (!itemName || !unit) {
    return res.status(400).json({ message: "Item name and unit required" });
  }

  try {
    const exists = await Model.findOne({ itemName });
    if (exists) {
      return res.status(409).json({ message: "Item already exists" });
    }

    const item = await Model.create({ itemName, unit, puw: Number(puw), });
    res.status(201).json({ success: true, item });
  } catch (err) {
    res.status(500).json({ message: "Failed to create item" });
  }
};
