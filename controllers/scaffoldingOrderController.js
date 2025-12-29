const ScaffoldingOrder = require("../models/scaffolding/ScaffoldingOrder");

/* ================= CREATE ORDER ================= */
exports.createOrder = async (req, res) => {
  try {
    const {
      supervisor,
      employeeId,
      issueDate,
      location,
      materials,
    } = req.body;

    if (
      !supervisor ||
      !employeeId ||
      !issueDate ||
      !location ||
      !Array.isArray(materials) ||
      materials.length === 0
    ) {
      return res.status(400).json({ message: "Invalid order data" });
    }

    for (const m of materials) {
      if (!m.material || !m.quantity || !m.provider) {
        return res.status(400).json({
          message: "Invalid material row",
        });
      }
    }

    const orderNo = `ORD-${new Date().getFullYear()}-${Date.now()}`;

    const saved = await ScaffoldingOrder.create({
      orderNo,
      supervisor,
      employeeId,
      issueDate,
      location,
      materials,
    });

    res.status(201).json(saved);
  } catch (err) {
    console.error("CREATE ORDER ERROR:", err);
    res.status(500).json({ message: "Failed to create order" });
  }
};

/* ================= GET ORDERS ================= */
exports.getOrders = async (req, res) => {
  try {
    const data = await ScaffoldingOrder.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};
exports.deleteOrder = async (req, res) => {
  try {
    await ScaffoldingOrder.findByIdAndDelete(req.params.id);
    res.json({ message: "Order deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
};
