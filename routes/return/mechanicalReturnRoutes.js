const express = require("express");
const router = express.Router();

const {
  createMechanicalReturn,
  getMechanicalReturns,
  getMechanicalReturnById,
  updateMechanicalReturn,
  deleteMechanicalReturn,
} = require("../../controllers/mechanicalReturnController");

router.post("/", createMechanicalReturn);
router.get("/", getMechanicalReturns);
router.get("/:id", getMechanicalReturnById);
router.put("/:id", updateMechanicalReturn);
router.delete("/:id", deleteMechanicalReturn);

module.exports = router;
