const MechanicalStock = require("../models/mechanical/Stock");

exports.getStock = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 50);
    const search = req.query.search || "";

    const filter = search
      ? { itemName: { $regex: search, $options: "i" } }
      : {};

    const total = await MechanicalStock.countDocuments(filter);

    const data = await MechanicalStock.find(filter)
      .sort({ itemName: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ data, total });
  } catch (err) {
    console.error("MECHANICAL STOCK ERROR:", err);
    res.status(500).json({ message: "Failed to fetch mechanical stock" });
  }
};
