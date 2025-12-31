const express = require("express");
const router = express.Router();
const {
  createIssue,
  getIssues,
  deleteIssue,
  updateIssue,
} = require("../../controllers/scaffoldingIssueController");

router.post("/", createIssue);
router.get("/", getIssues);
router.put("/:id", updateIssue);
router.delete("/:id", deleteIssue);

module.exports = router;
