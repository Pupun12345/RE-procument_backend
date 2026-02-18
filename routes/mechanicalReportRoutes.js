const express = require("express");
const router = express.Router();
const {
  getMechanicalFinalReport,
  getMechanicalReportByItem
} = require("../controllers/mechanicalReportController");

// Get complete mechanical final report
router.get("/", getMechanicalFinalReport);

// Get report for specific item
router.get("/item/:itemName", getMechanicalReportByItem);

module.exports = router;
