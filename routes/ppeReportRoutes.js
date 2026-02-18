const express = require("express");
const router = express.Router();
const {
  getPPEFinalReport,
  getPPEReportByItem
} = require("../controllers/ppeReportController");

router.get("/", getPPEFinalReport);
router.get("/item/:itemName", getPPEReportByItem);

module.exports = router;
