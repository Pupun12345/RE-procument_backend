const Employee = require("../models/Employee");

/* ================= CREATE EMPLOYEE ================= */
exports.createEmployee = async (req, res) => {
  try {
    const {
      employeeName,
      employeeCode,
      spNumber,
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
      epfoNumber,
      esiNumber,
      address,
    } = req.body;

    // 🔐 Required validation
    if (
      !employeeName ||
      !employeeCode ||
      !spNumber ||
      !designation ||
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

    // 🚫 Prevent duplicate SP Number
    const spExists = await Employee.findOne({ spNumber });
    if (spExists) {
      return res.status(409).json({ message: "SP Number already exists" });
    }

    const finalDesignation = designation.trim();

    const employee = await Employee.create({
      employeeName,
      employeeCode,
      spNumber,
      designation: finalDesignation,
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
      epfoNumber,
      esiNumber,
      address,
      employeePhoto: req.file
        ? `/uploads/employees/${req.file.filename}`
        : "",
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

// Get employee by employeeCode
exports.getEmployeeByCode = async (req, res) => {
  try {
    const employee = await Employee.findOne({ employeeCode: req.params.employeeCode });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get employee by ID
exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update employee
exports.updateEmployee = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file) {
      updateData.employeePhoto = `/uploads/employees/${req.file.filename}`;
    }
    
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete employee
exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= SHIFT MANAGEMENT ================= */

// Update employee shift
exports.updateEmployeeShift = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { currentShift, shiftDuration } = req.body;

    if (!currentShift || !["day", "night"].includes(currentShift)) {
      return res.status(400).json({ message: "Invalid shift type. Must be 'day' or 'night'" });
    }

    const employee = await Employee.findByIdAndUpdate(
      employeeId,
      { 
        currentShift, 
        shiftDuration: shiftDuration || 8,
        lastShiftUpdate: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json(employee);
  } catch (error) {
    console.error("UPDATE SHIFT ERROR:", error);
    res.status(500).json({ message: 'Failed to update shift' });
  }
};

// Bulk assign shifts
exports.bulkAssignShift = async (req, res) => {
  try {
    const { employeeIds, currentShift, shiftDuration } = req.body;

    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).json({ message: "Employee IDs array is required" });
    }

    if (!currentShift || !["day", "night"].includes(currentShift)) {
      return res.status(400).json({ message: "Invalid shift type. Must be 'day' or 'night'" });
    }

    const result = await Employee.updateMany(
      { _id: { $in: employeeIds } },
      { 
        currentShift, 
        shiftDuration: shiftDuration || 8,
        lastShiftUpdate: new Date()
      }
    );

    res.json({ 
      message: 'Shifts updated successfully',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error("BULK ASSIGN ERROR:", error);
    res.status(500).json({ message: 'Failed to bulk assign shifts' });
  }
};

// Get shift statistics
exports.getShiftStats = async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments();
    const dayShiftCount = await Employee.countDocuments({ currentShift: "day" });
    const nightShiftCount = await Employee.countDocuments({ currentShift: "night" });
    
    const shiftCompliance = totalEmployees > 0 
      ? ((dayShiftCount + nightShiftCount) / totalEmployees * 100).toFixed(1)
      : 0;

    res.json({
      totalEmployees,
      totalDayShift: dayShiftCount,
      totalNightShift: nightShiftCount,
      shiftCompliance: parseFloat(shiftCompliance)
    });
  } catch (error) {
    console.error("GET SHIFT STATS ERROR:", error);
    res.status(500).json({ message: 'Failed to fetch shift statistics' });
  }
};
