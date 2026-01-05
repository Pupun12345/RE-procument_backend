const express = require("express");
const router = express.Router();

const {
  createOrder,
  getOrders,
  updateOrder,
  deleteOrder,
} = require("../../controllers/scaffoldingOrderController");
const auth = require("../../middleware/auth");
const adminOnly = require("../../middleware/adminOnly");

router.post("/", createOrder);
router.get("/", getOrders);
router.put("/:id", auth, adminOnly, updateOrder);
router.delete("/:id", auth, adminOnly, deleteOrder);
module.exports = router;
