const express = require("express");
const router = express.Router();

const {
  createPPEReturn,
  getPPEReturns,
  getPPEReturnById,
  updatePPEReturn,
  deletePPEReturn,
} = require("../../controllers/returnController");

router.post("/", createPPEReturn);
router.get("/:id", getPPEReturnById);
router.get("/", getPPEReturns);
router.put("/:id", updatePPEReturn);
router.delete("/:id", deletePPEReturn);

module.exports = router;
