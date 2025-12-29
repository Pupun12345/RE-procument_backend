const express = require("express");
const router = express.Router();

const {
  createPPEIssue,
  getPPEIssues,
  getPPEIssueById,
  updatePPEIssue,
  deletePPEIssue,
} = require("../../controllers/ppeIssueController");

router.post("/", createPPEIssue);
router.get("/", getPPEIssues);
router.get("/:id", getPPEIssueById);
router.put("/:id", updatePPEIssue);
router.delete("/:id", deletePPEIssue);

module.exports = router;
