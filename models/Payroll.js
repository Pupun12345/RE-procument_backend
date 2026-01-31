const mongoose = require("mongoose");

const PayrollSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    employeeCode: {
      type: String,
      required: true,
    },
    employeeName: {
      type: String,
      required: true,
    },
    designation: {
      type: String,
      required: true,
    },
    month: {
      type: String,
      required: true, // e.g., "April 2023"
    },
    year: {
      type: Number,
      required: true,
    },
    monthNumber: {
      type: Number,
      required: true, // 1-12
    },
    fiscalYear: {
      type: String,
      required: true, // e.g., "FY 2023-2024"
    },
    
    // Salary Components
    basicPay: {
      type: Number,
      required: true,
      default: 0,
    },
    hra: {
      type: Number,
      default: 0,
    },
    allowances: {
      type: Number,
      default: 0,
    },
    grossSalary: {
      type: Number,
      required: true,
      default: 0,
    },
    
    // Deductions
    pfEmployee: {
      type: Number,
      default: 0,
    },
    esiEmployee: {
      type: Number,
      default: 0,
    },
    professionalTax: {
      type: Number,
      default: 0,
    },
    incomeTax: {
      type: Number,
      default: 0,
    },
    otherDeductions: {
      type: Number,
      default: 0,
    },
    totalDeductions: {
      type: Number,
      default: 0,
    },
    
    // Net Salary
    netSalary: {
      type: Number,
      required: true,
      default: 0,
    },
    
    // Status
    status: {
      type: String,
      enum: ["pending", "processed", "paid", "cleared"],
      default: "pending",
    },
    
    // Payment Details
    paymentDate: {
      type: Date,
    },
    paymentMode: {
      type: String,
      enum: ["bank_transfer", "cash", "cheque"],
    },
    
    // Additional Info
    workingDays: {
      type: Number,
      default: 0,
    },
    presentDays: {
      type: Number,
      default: 0,
    },
    leaves: {
      type: Number,
      default: 0,
    },
    overtime: {
      type: Number,
      default: 0,
    },
    
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique payroll per employee per month
PayrollSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

// Calculate totals before saving
PayrollSchema.pre("save", function (next) {
  // Calculate gross salary
  this.grossSalary = this.basicPay + this.hra + this.allowances;
  
  // Calculate total deductions
  this.totalDeductions = 
    this.pfEmployee + 
    this.esiEmployee + 
    this.professionalTax + 
    this.incomeTax + 
    this.otherDeductions;
  
  // Calculate net salary
  this.netSalary = this.grossSalary - this.totalDeductions;
  
  next();
});

module.exports = mongoose.model("Payroll", PayrollSchema);
