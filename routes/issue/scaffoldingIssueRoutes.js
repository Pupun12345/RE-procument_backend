const express = require("express");
const router = express.Router();
const {
  createIssue,
  getIssues,
  deleteIssue,
} = require("../../controllers/scaffoldingIssueController");

router.post("/", createIssue);
router.get("/", getIssues);
router.delete("/:id", deleteIssue);

module.exports = router;
