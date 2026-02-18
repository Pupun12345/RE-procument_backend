const mongoose = require("mongoose");

const EmployeeSchema = new mongoose.Schema(
  {
    employeeName: { type: String, required: true },
    employeeCode: { type: String, required: true, unique: true },
    spNumber: {
      type: String,
      required: true,
      trim: true,
    },
    designation: String,

    emailId: { type: String, required: true },
    mobileNumber: { type: String, required: true },

    panCardNumber: String,
    aadharCardNumber: String,
    safetyPassNumber: String,

    emergencyContactNumber: String,

    dateOfJoining: { type: Date, required: true },
    dateOfBirth: Date,

    fatherName: String,
    fatherContactNumber: String,

    bankName: String,
    bankAccountNumber: String,
    bankIfscCode: String,
    epfoNumber: {
      type: String,
      trim: true,
    },

    esiNumber: {
      type: String,
      trim: true,
    },

    address: { type: String, required: true },

    employeePhoto: String, // file path

    // Shift Management
    currentShift: { 
      type: String, 
      enum: ["day", "night"], 
      default: "day" 
    },
    shiftDuration: { 
      type: Number, 
      default: 8 
    },
    lastShiftUpdate: { 
      type: Date 
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Employee", EmployeeSchema);
