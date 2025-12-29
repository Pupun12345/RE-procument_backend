const express = require("express");
const router = express.Router();

const {
  createOrder,
  getOrders,
  deleteOrder,
} = require("../../controllers/scaffoldingOrderController");

router.post("/", createOrder);
router.get("/", getOrders);
router.delete("/:id", deleteOrder);

module.exports = router;
