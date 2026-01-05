const express = require("express");
const router = express.Router();
const controller = require("../../controllers/scaffoldingPurchaseController");
const auth = require("../../middleware/auth");
const adminOnly = require("../../middleware/adminOnly");

// 🔐 Protect ALL routes below
router.use(auth);
router.use(adminOnly);
router.post("/", controller.createPurchase);
router.get("/", controller.getPurchases);
router.delete("/:id", controller.deletePurchase);
router.put("/:id", controller.updatePurchase);
module.exports = router;
