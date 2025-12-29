const express = require("express");
const router = express.Router();
const { getStock } = require("../../controllers/scaffoldingStockController");

router.get("/", getStock);

module.exports = router;
