const express = require("express");
const router = express.Router();
const controller = require("../../controllers/oldReturnController");

/* ================= READ ALL (GET) ================= */
router.get("/", controller.getReturns);

/* ================= READ ONE (GET BY ID) ================= */
router.get("/:id", controller.getReturnById);

/* ================= CREATE ================= */
router.post("/", controller.createReturn);

/* ================= UPDATE ================= */
router.put("/:id", controller.updateReturn);

/* ================= DELETE ================= */
router.delete("/:id", controller.deleteReturn);

module.exports = router;
