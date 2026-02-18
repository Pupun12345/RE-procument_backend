const express = require("express");
const router = express.Router();

const {
  createPayroll,
  bulkCreatePayroll,
  getYearlyReport,
  getMonthlyReport,
  getEmployeePayrollHistory,
  updatePayrollStatus,
  getAllFiscalYears,
  deletePayroll,
} = require("../controllers/payrollController");

// Create routes
router.post("/", createPayroll);
router.post("/bulk", bulkCreatePayroll);

// Report routes
router.get("/report/yearly/:fiscalYear", getYearlyReport);
router.get("/report/monthly/:month/:year", getMonthlyReport);
router.get("/fiscal-years", getAllFiscalYears);

// Employee specific
router.get("/employee/:employeeId", getEmployeePayrollHistory);

// Update and delete
router.put("/:payrollId/status", updatePayrollStatus);
router.delete("/:payrollId", deletePayroll);

module.exports = router;
