const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const {
  createEmployee,
  getEmployees,
  getEmployeeByCode,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  updateEmployeeShift,
  bulkAssignShift,
  getShiftStats
} = require("../controllers/employeeController");

// 🔹 Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/employees");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage });

router.post("/", upload.single("employeePhoto"), createEmployee);
router.get("/", getEmployees);

// Shift Management Routes (place before :id routes to avoid conflicts)
router.get("/shift/stats", getShiftStats);
router.put("/shift/:employeeId", updateEmployeeShift);
router.post("/shift/bulk-assign", bulkAssignShift);

router.get("/code/:employeeCode", getEmployeeByCode);
router.get("/:id", getEmployeeById);
router.put("/:id", upload.single("employeePhoto"), updateEmployee);
router.delete("/:id", deleteEmployee);

module.exports = router;
