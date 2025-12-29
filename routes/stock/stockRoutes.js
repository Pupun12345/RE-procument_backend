const express = require("express");
const router = express.Router();
const Stock = require("../../models/ppe/Stock");

// GET STOCK (PPE)
router.get("/", async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 50);
    const search = req.query.search || "";

    const filter = search
      ? { itemName: { $regex: search, $options: "i" } }
      : {};

    const total = await Stock.countDocuments(filter);

    const data = await Stock.find(filter)
      .sort({ itemName: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ data, total });
  } catch (err) {
    console.error("STOCK FETCH ERROR:", err);
    res.status(500).json({ message: "Failed to fetch stock" });
  }
});

module.exports = router;
