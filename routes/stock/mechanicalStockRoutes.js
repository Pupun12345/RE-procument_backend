const express = require("express");
const router = express.Router();
const { getStock } = require("../../controllers/mechanicalStockController");

router.get("/", getStock);

module.exports = router;
