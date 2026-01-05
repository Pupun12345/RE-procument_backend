const express = require("express");
const router = express.Router();
const controller = require("../../controllers/mechanicalPurchaseController");
const auth = require("../../middleware/auth");
const adminOnly = require("../../middleware/adminOnly");

router.use(auth);
router.use(adminOnly);
router.post("/", controller.createPurchase);
router.get("/", controller.getPurchases);
router.delete("/:id", controller.deletePurchase);
router.put("/:id", controller.updatePurchase);
module.exports = router;
