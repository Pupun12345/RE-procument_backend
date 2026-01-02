const express = require("express");
const router = express.Router();
const controller = require("../../controllers/oldIssueController");

router.post("/", controller.createIssue);
router.get("/", controller.getIssues);
router.put("/:id", controller.updateIssue);
router.delete("/:id", controller.deleteIssue);

module.exports = router;
