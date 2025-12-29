const express = require("express");
const router = express.Router();

const {
  createScaffoldingReturn,
  getScaffoldingReturns,
  deleteScaffoldingReturn,
} = require("../../controllers/scaffoldingReturnController");

router.post("/", createScaffoldingReturn);
router.get("/", getScaffoldingReturns);
router.delete("/:id", deleteScaffoldingReturn);

module.exports = router;
