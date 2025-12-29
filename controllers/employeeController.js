const Employee = require("../models/Employee");

/* ================= CREATE EMPLOYEE ================= */
exports.createEmployee = async (req, res) => {
  try {
    const {
      employeeName,
      employeeCode,
      designation,
      emailId,
      mobileNumber,
      panCardNumber,
      aadharCardNumber,
      safetyPassNumber,
      emergencyContactNumber,
      dateOfJoining,
      dateOfBirth,
      fatherName,
      fatherContactNumber,
      bankName,
      bankAccountNumber,
      bankIfscCode,
      address,
    } = req.body;

    // 🔐 Required validation
    if (
      !employeeName ||
      !employeeCode ||
      !emailId ||
      !mobileNumber ||
      !dateOfJoining ||
      !address
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 🚫 Prevent duplicate employee code
    const exists = await Employee.findOne({ employeeCode });
    if (exists) {
      return res.status(409).json({ message: "Employee code already exists" });
    }

    const employee = await Employee.create({
      employeeName,
      employeeCode,
      designation,
      emailId,
      mobileNumber,
      panCardNumber,
      aadharCardNumber,
      safetyPassNumber,
      emergencyContactNumber,
      dateOfJoining,
      dateOfBirth,
      fatherName,
      fatherContactNumber,
      bankName,
      bankAccountNumber,
      bankIfscCode,
      address,
      employeePhoto: req.file ? `/uploads/employees/${req.file.filename}` : "",
    });

    res.status(201).json(employee);
  } catch (err) {
    console.error("EMPLOYEE CREATE ERROR:", err);
    res.status(500).json({ message: "Failed to register employee" });
  }
};

/* ================= GET EMPLOYEES ================= */
exports.getEmployees = async (req, res) => {
  try {
    const { designation } = req.query;

    const filter = designation
      ? { designation: designation }
      : {};

    const data = await Employee.find(filter).sort({ createdAt: -1 });

    res.json(data);
  } catch (err) {
    console.error("GET EMPLOYEES ERROR:", err);
    res.status(500).json({ message: "Failed to fetch employees" });
  }
};

