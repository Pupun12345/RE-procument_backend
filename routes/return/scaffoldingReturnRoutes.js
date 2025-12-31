const express = require("express");
const router = express.Router();

const {
  createScaffoldingReturn,
  getScaffoldingReturns,
  deleteScaffoldingReturn,
  updateScaffoldingReturn,
} = require("../../controllers/scaffoldingReturnController");

router.post("/", createScaffoldingReturn);
router.get("/", getScaffoldingReturns);
router.put("/:id", updateScaffoldingReturn);
router.delete("/:id", deleteScaffoldingReturn);

module.exports = router;
