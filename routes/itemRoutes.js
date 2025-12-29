const express = require("express");
const router = express.Router();

const { getItems, createItem } = require("../controllers/itemController");

// /api/items/:type
router.get("/:type", getItems);
router.post("/:type", createItem);

module.exports = router;
