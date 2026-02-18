const Payroll = require("../models/Payroll");
const Employee = require("../models/Employee");

/* ================= CREATE PAYROLL ENTRY ================= */
exports.createPayroll = async (req, res) => {
  try {
    const {
      employeeId,
      month,
      year,
      monthNumber,
      fiscalYear,
      basicPay,
      hra,
      allowances,
      pfEmployee,
      esiEmployee,
      professionalTax,
      incomeTax,
      otherDeductions,
      workingDays,
      presentDays,
      leaves,
      overtime,
      notes,
    } = req.body;

    // Validate required fields
    if (!employeeId || !month || !year || !monthNumber || !fiscalYear || !basicPay) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Get employee details
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Check if payroll already exists for this employee and month
    const existingPayroll = await Payroll.findOne({
      employeeId,
      month,
      year,
    });

    if (existingPayroll) {
      return res.status(409).json({
        message: "Payroll for this employee and month already exists",
      });
    }

    // Create new payroll entry
    const payroll = new Payroll({
      employeeId,
      employeeCode: employee.employeeCode,
      employeeName: employee.employeeName,
      designation: employee.designation,
      month,
      year,
      monthNumber,
      fiscalYear,
      basicPay,
      hra: hra || 0,
      allowances: allowances || 0,
      pfEmployee: pfEmployee || 0,
      esiEmployee: esiEmployee || 0,
      professionalTax: professionalTax || 0,
      incomeTax: incomeTax || 0,
      otherDeductions: otherDeductions || 0,
      workingDays: workingDays || 0,
      presentDays: presentDays || 0,
      leaves: leaves || 0,
      overtime: overtime || 0,
      notes,
    });

    await payroll.save();

    res.status(201).json({
      message: "Payroll entry created successfully",
      payroll,
    });
  } catch (error) {
    console.error("Error creating payroll:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* ================= BULK CREATE PAYROLL ================= */
exports.bulkCreatePayroll = async (req, res) => {
  try {
    const { payrolls } = req.body;

    if (!payrolls || !Array.isArray(payrolls) || payrolls.length === 0) {
      return res.status(400).json({ message: "Invalid payroll data" });
    }

    const results = {
      success: [],
      failed: [],
    };

    for (const payrollData of payrolls) {
      try {
        const employee = await Employee.findById(payrollData.employeeId);
        if (!employee) {
          results.failed.push({
            employeeId: payrollData.employeeId,
            reason: "Employee not found",
          });
          continue;
        }

        const payroll = new Payroll({
          ...payrollData,
          employeeCode: employee.employeeCode,
          employeeName: employee.employeeName,
          designation: employee.designation,
        });

        await payroll.save();
        results.success.push(payroll);
      } catch (error) {
        results.failed.push({
          employeeId: payrollData.employeeId,
          reason: error.message,
        });
      }
    }

    res.status(201).json({
      message: `Bulk payroll creation completed. Success: ${results.success.length}, Failed: ${results.failed.length}`,
      results,
    });
  } catch (error) {
    console.error("Error bulk creating payroll:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* ================= GET YEARLY REPORT ================= */
exports.getYearlyReport = async (req, res) => {
  try {
    const { fiscalYear } = req.params;

    if (!fiscalYear) {
      return res.status(400).json({ message: "Fiscal year is required" });
    }

    // Get all payroll entries for the fiscal year
    const payrolls = await Payroll.find({ fiscalYear }).sort({ year: 1, monthNumber: 1 });

    if (payrolls.length === 0) {
      return res.status(404).json({
        message: "No payroll data found for this fiscal year",
      });
    }

    // Calculate yearly totals
    const yearlyTotals = {
      totalGrossSalary: 0,
      totalDeductions: 0,
      totalNetSalary: 0,
      totalBasicPay: 0,
      totalHRA: 0,
      totalAllowances: 0,
      totalPF: 0,
      totalESI: 0,
    };

    // Group by month
    const monthlyData = {};

    payrolls.forEach((payroll) => {
      const monthKey = payroll.month;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: payroll.month,
          monthNumber: payroll.monthNumber,
          year: payroll.year,
          headcount: 0,
          basicPay: 0,
          hra: 0,
          allowances: 0,
          grossSalary: 0,
          pfEmp: 0,
          esiEmp: 0,
          netSalary: 0,
        };
      }

      monthlyData[monthKey].headcount += 1;
      monthlyData[monthKey].basicPay += payroll.basicPay;
      monthlyData[monthKey].hra += payroll.hra;
      monthlyData[monthKey].allowances += payroll.allowances;
      monthlyData[monthKey].grossSalary += payroll.grossSalary;
      monthlyData[monthKey].pfEmp += payroll.pfEmployee;
      monthlyData[monthKey].esiEmp += payroll.esiEmployee;
      monthlyData[monthKey].netSalary += payroll.netSalary;

      // Add to yearly totals
      yearlyTotals.totalGrossSalary += payroll.grossSalary;
      yearlyTotals.totalDeductions += payroll.totalDeductions;
      yearlyTotals.totalNetSalary += payroll.netSalary;
      yearlyTotals.totalBasicPay += payroll.basicPay;
      yearlyTotals.totalHRA += payroll.hra;
      yearlyTotals.totalAllowances += payroll.allowances;
      yearlyTotals.totalPF += payroll.pfEmployee;
      yearlyTotals.totalESI += payroll.esiEmployee;
    });

    // Convert monthlyData object to array and sort by month
    const monthlyDataArray = Object.values(monthlyData).sort(
      (a, b) => a.monthNumber - b.monthNumber
    );

    // Calculate trends (compare with previous year if available)
    const previousFiscalYear = getPreviousFiscalYear(fiscalYear);
    const previousYearData = await Payroll.find({ fiscalYear: previousFiscalYear });

    let grossSalaryChange = 0;
    if (previousYearData.length > 0) {
      const previousYearTotal = previousYearData.reduce(
        (sum, p) => sum + p.grossSalary,
        0
      );
      grossSalaryChange =
        ((yearlyTotals.totalGrossSalary - previousYearTotal) / previousYearTotal) * 100;
    }

    res.status(200).json({
      fiscalYear,
      yearlyData: {
        totalGrossSalary: yearlyTotals.totalGrossSalary,
        totalDeductions: yearlyTotals.totalDeductions,
        totalWagesAccrued: yearlyTotals.totalNetSalary - yearlyTotals.totalGrossSalary + yearlyTotals.totalDeductions,
        netPayableSalary: yearlyTotals.totalNetSalary,
        grossSalaryChange: parseFloat(grossSalaryChange.toFixed(2)),
        deductionsStatus: "consistent",
        wagesAccruedChange: -5,
        salaryStatus: "cleared",
      },
      monthlyData: monthlyDataArray,
      totals: {
        basicPay: yearlyTotals.totalBasicPay,
        hra: yearlyTotals.totalHRA,
        allowances: yearlyTotals.totalAllowances,
        grossSalary: yearlyTotals.totalGrossSalary,
        pfEmp: yearlyTotals.totalPF,
        esiEmp: yearlyTotals.totalESI,
        netSalary: yearlyTotals.totalNetSalary,
      },
    });
  } catch (error) {
    console.error("Error getting yearly report:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* ================= GET MONTHLY REPORT ================= */
exports.getMonthlyReport = async (req, res) => {
  try {
    const { month, year } = req.params;

    if (!month || !year) {
      return res.status(400).json({ message: "Month and year are required" });
    }

    const payrolls = await Payroll.find({ month, year }).populate(
      "employeeId",
      "employeeName employeeCode designation"
    );

    if (payrolls.length === 0) {
      return res.status(404).json({
        message: "No payroll data found for this month",
      });
    }

    // Calculate monthly totals
    const totals = {
      totalEmployees: payrolls.length,
      totalBasicPay: 0,
      totalHRA: 0,
      totalAllowances: 0,
      totalGrossSalary: 0,
      totalPF: 0,
      totalESI: 0,
      totalDeductions: 0,
      totalNetSalary: 0,
    };

    payrolls.forEach((payroll) => {
      totals.totalBasicPay += payroll.basicPay;
      totals.totalHRA += payroll.hra;
      totals.totalAllowances += payroll.allowances;
      totals.totalGrossSalary += payroll.grossSalary;
      totals.totalPF += payroll.pfEmployee;
      totals.totalESI += payroll.esiEmployee;
      totals.totalDeductions += payroll.totalDeductions;
      totals.totalNetSalary += payroll.netSalary;
    });

    res.status(200).json({
      month,
      year,
      payrolls,
      totals,
    });
  } catch (error) {
    console.error("Error getting monthly report:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* ================= GET EMPLOYEE PAYROLL HISTORY ================= */
exports.getEmployeePayrollHistory = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID is required" });
    }

    const payrolls = await Payroll.find({ employeeId }).sort({
      year: -1,
      monthNumber: -1,
    });

    if (payrolls.length === 0) {
      return res.status(404).json({
        message: "No payroll history found for this employee",
      });
    }

    res.status(200).json({
      employeeId,
      payrolls,
    });
  } catch (error) {
    console.error("Error getting employee payroll history:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* ================= UPDATE PAYROLL STATUS ================= */
exports.updatePayrollStatus = async (req, res) => {
  try {
    const { payrollId } = req.params;
    const { status, paymentDate, paymentMode } = req.body;

    if (!payrollId) {
      return res.status(400).json({ message: "Payroll ID is required" });
    }

    const payroll = await Payroll.findById(payrollId);
    if (!payroll) {
      return res.status(404).json({ message: "Payroll not found" });
    }

    if (status) payroll.status = status;
    if (paymentDate) payroll.paymentDate = paymentDate;
    if (paymentMode) payroll.paymentMode = paymentMode;

    await payroll.save();

    res.status(200).json({
      message: "Payroll status updated successfully",
      payroll,
    });
  } catch (error) {
    console.error("Error updating payroll status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* ================= GET ALL FISCAL YEARS ================= */
exports.getAllFiscalYears = async (req, res) => {
  try {
    const fiscalYears = await Payroll.distinct("fiscalYear");
    
    res.status(200).json({
      fiscalYears: fiscalYears.sort().reverse(),
    });
  } catch (error) {
    console.error("Error getting fiscal years:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* ================= DELETE PAYROLL ================= */
exports.deletePayroll = async (req, res) => {
  try {
    const { payrollId } = req.params;

    if (!payrollId) {
      return res.status(400).json({ message: "Payroll ID is required" });
    }

    const payroll = await Payroll.findByIdAndDelete(payrollId);
    if (!payroll) {
      return res.status(404).json({ message: "Payroll not found" });
    }

    res.status(200).json({
      message: "Payroll deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting payroll:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* ================= HELPER FUNCTION ================= */
function getPreviousFiscalYear(fiscalYear) {
  // Example: "FY 2023-2024" -> "FY 2022-2023"
  const match = fiscalYear.match(/FY (\d{4})-(\d{4})/);
  if (match) {
    const startYear = parseInt(match[1]) - 1;
    const endYear = parseInt(match[2]) - 1;
    return `FY ${startYear}-${endYear}`;
  }
  return null;
}
