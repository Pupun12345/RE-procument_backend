const express = require("express");
const router = express.Router();
const scaffoldingReportController = require("../controllers/scaffoldingReportController");

// Get complete scaffolding final report
router.get("/", scaffoldingReportController.getScaffoldingFinalReport);

// Get report for specific scaffolding item
router.get("/item/:itemName", scaffoldingReportController.getScaffoldingItemReport);

module.exports = router;
