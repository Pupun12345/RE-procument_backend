require("dotenv").config();
const mongoose = require("mongoose");
const Payroll = require("./models/Payroll");
const Employee = require("./models/Employee");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

const months = [
  { name: "April 2023", monthNumber: 4, year: 2023, fiscalYear: "FY 2023-2024" },
  { name: "May 2023", monthNumber: 5, year: 2023, fiscalYear: "FY 2023-2024" },
  { name: "June 2023", monthNumber: 6, year: 2023, fiscalYear: "FY 2023-2024" },
  { name: "July 2023", monthNumber: 7, year: 2023, fiscalYear: "FY 2023-2024" },
  { name: "August 2023", monthNumber: 8, year: 2023, fiscalYear: "FY 2023-2024" },
  { name: "September 2023", monthNumber: 9, year: 2023, fiscalYear: "FY 2023-2024" },
  { name: "October 2023", monthNumber: 10, year: 2023, fiscalYear: "FY 2023-2024" },
  { name: "November 2023", monthNumber: 11, year: 2023, fiscalYear: "FY 2023-2024" },
  { name: "December 2023", monthNumber: 12, year: 2023, fiscalYear: "FY 2023-2024" },
  { name: "January 2024", monthNumber: 1, year: 2024, fiscalYear: "FY 2023-2024" },
  { name: "February 2024", monthNumber: 2, year: 2024, fiscalYear: "FY 2023-2024" },
  { name: "March 2024", monthNumber: 3, year: 2024, fiscalYear: "FY 2023-2024" },
];

const seedPayrollData = async () => {
  try {
    await connectDB();

    console.log("🔄 Fetching employees...");
    const employees = await Employee.find().limit(150);

    if (employees.length === 0) {
      console.log("⚠️ No employees found. Please create employees first.");
      process.exit(1);
    }

    console.log(`✅ Found ${employees.length} employees`);

    // Clear existing payroll data
    console.log("🗑️ Clearing existing payroll data...");
    await Payroll.deleteMany({});

    console.log("📝 Creating payroll entries...");
    let createdCount = 0;

    for (const month of months) {
      for (const employee of employees) {
        // Generate realistic salary data with some variation
        const baseBasicPay = 25000 + Math.random() * 20000;
        const basicPay = Math.round(baseBasicPay);
        const hra = Math.round(basicPay * 0.4); // 40% of basic pay
        const allowances = Math.round(1000 + Math.random() * 5000);
        
        const grossSalary = basicPay + hra + allowances;
        
        // Calculate deductions
        const pfEmployee = Math.round(basicPay * 0.12); // 12% of basic pay
        const esiEmployee = grossSalary <= 21000 ? Math.round(grossSalary * 0.0075) : 0; // 0.75% if gross <= 21k
        const professionalTax = grossSalary > 20000 ? 200 : 0;
        const incomeTax = grossSalary > 50000 ? Math.round(grossSalary * 0.1) : 0;
        
        const totalDeductions = pfEmployee + esiEmployee + professionalTax + incomeTax;
        const netSalary = grossSalary - totalDeductions;

        const payrollEntry = new Payroll({
          employeeId: employee._id,
          employeeCode: employee.employeeCode,
          employeeName: employee.employeeName,
          designation: employee.designation || "Staff",
          month: month.name,
          year: month.year,
          monthNumber: month.monthNumber,
          fiscalYear: month.fiscalYear,
          basicPay,
          hra,
          allowances,
          grossSalary,
          pfEmployee,
          esiEmployee,
          professionalTax,
          incomeTax,
          otherDeductions: 0,
          totalDeductions,
          netSalary,
          status: "cleared",
          workingDays: 26,
          presentDays: 24 + Math.floor(Math.random() * 3),
          leaves: Math.floor(Math.random() * 3),
          overtime: Math.floor(Math.random() * 10),
        });

        await payrollEntry.save();
        createdCount++;

        if (createdCount % 50 === 0) {
          console.log(`✅ Created ${createdCount} payroll entries...`);
        }
      }
    }

    console.log(`\n✅ Successfully created ${createdCount} payroll entries!`);
    console.log(`📊 Payroll data for ${months.length} months and ${employees.length} employees`);
    
    // Display summary
    const summary = await Payroll.aggregate([
      {
        $group: {
          _id: "$fiscalYear",
          totalGross: { $sum: "$grossSalary" },
          totalNet: { $sum: "$netSalary" },
          count: { $sum: 1 },
        },
      },
    ]);

    console.log("\n📈 Summary:");
    summary.forEach((s) => {
      console.log(`  ${s._id}: ${s.count} entries, Total Gross: $${s.totalGross.toLocaleString()}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding payroll data:", error);
    process.exit(1);
  }
};

seedPayrollData();
