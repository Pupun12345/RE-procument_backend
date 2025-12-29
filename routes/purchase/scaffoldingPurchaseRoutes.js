const express = require("express");
const router = express.Router();
const controller = require("../../controllers/scaffoldingPurchaseController");

router.post("/", controller.createPurchase);
router.get("/", controller.getPurchases);
router.delete("/:id", controller.deletePurchase);

module.exports = router;
