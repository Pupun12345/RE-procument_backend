const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const {
  createEmployee,
  getEmployees,
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

module.exports = router;
