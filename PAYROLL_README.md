# Payroll Report System

## Overview
The Payroll Report System provides comprehensive payroll management and reporting capabilities for the HRMS application. It tracks employee salaries, deductions, and generates detailed yearly and monthly reports.

## Features

### Backend Features
- **Payroll Entry Management**: Create and manage individual payroll entries
- **Bulk Operations**: Import multiple payroll entries at once
- **Yearly Reports**: Comprehensive fiscal year reports with trends
- **Monthly Reports**: Detailed monthly breakdowns
- **Employee History**: View complete payroll history for any employee
- **Status Tracking**: Track payment status (pending, processed, paid, cleared)

### Frontend Features
- **Interactive Dashboard**: View yearly data with visual charts
- **Fiscal Year Selector**: Switch between different fiscal years
- **Summary Cards**: Quick overview of key metrics
- **Salary Trends Chart**: Visual representation of annual trends
- **Detailed Table**: Monthly breakdown with all salary components
- **Export Functionality**: Export reports to Excel
- **Print Support**: Print-optimized layout

## Database Schema

### Payroll Model
```javascript
{
  employeeId: ObjectId (ref: Employee),
  employeeCode: String,
  employeeName: String,
  designation: String,
  month: String (e.g., "April 2023"),
  year: Number,
  monthNumber: Number (1-12),
  fiscalYear: String (e.g., "FY 2023-2024"),
  
  // Salary Components
  basicPay: Number,
  hra: Number,
  allowances: Number,
  grossSalary: Number (calculated),
  
  // Deductions
  pfEmployee: Number,
  esiEmployee: Number,
  professionalTax: Number,
  incomeTax: Number,
  otherDeductions: Number,
  totalDeductions: Number (calculated),
  
  // Net Salary
  netSalary: Number (calculated),
  
  // Status
  status: String (pending/processed/paid/cleared),
  paymentDate: Date,
  paymentMode: String,
  
  // Additional Info
  workingDays: Number,
  presentDays: Number,
  leaves: Number,
  overtime: Number,
  notes: String
}
```

## API Endpoints

### Create Payroll
```
POST /api/payroll
Body: {
  employeeId, month, year, monthNumber, fiscalYear,
  basicPay, hra, allowances, pfEmployee, esiEmployee, ...
}
```

### Bulk Create Payroll
```
POST /api/payroll/bulk
Body: { payrolls: [...] }
```

### Get Yearly Report
```
GET /api/payroll/report/yearly/:fiscalYear
Example: /api/payroll/report/yearly/FY%202023-2024
```

### Get Monthly Report
```
GET /api/payroll/report/monthly/:month/:year
Example: /api/payroll/report/monthly/April%202023/2023
```

### Get All Fiscal Years
```
GET /api/payroll/fiscal-years
```

### Get Employee Payroll History
```
GET /api/payroll/employee/:employeeId
```

### Update Payroll Status
```
PUT /api/payroll/:payrollId/status
Body: { status, paymentDate, paymentMode }
```

### Delete Payroll
```
DELETE /api/payroll/:payrollId
```

## Setup Instructions

### 1. Backend Setup

#### Install Dependencies
```bash
cd backend
npm install
```

#### Environment Variables
Ensure your `.env` file has:
```
MONGODB_URI=your_mongodb_connection_string
PORT=4000
```

#### Seed Sample Data
After creating employees, run:
```bash
node seedPayroll.js
```

This will create 12 months of payroll data for all existing employees.

### 2. Frontend Setup

#### Install Dependencies
```bash
cd frontend
npm install
```

#### Configure API
Make sure your `axios` configuration points to the backend:
```typescript
// src/api/axios.ts
baseURL: "http://localhost:4000/api"
```

### 3. Running the Application

#### Start Backend
```bash
cd backend
npm run dev
```

#### Start Frontend
```bash
cd frontend
npm run dev
```

## Usage Guide

### Accessing the Report
1. Navigate to HRMS section
2. Click on "Payroll" or "Reports"
3. Select desired fiscal year from dropdown
4. View yearly summary, trends, and monthly breakdown

### Creating Payroll Entries

#### Single Entry
```javascript
const payrollData = {
  employeeId: "employee_id_here",
  month: "April 2023",
  year: 2023,
  monthNumber: 4,
  fiscalYear: "FY 2023-2024",
  basicPay: 30000,
  hra: 12000,
  allowances: 3000,
  pfEmployee: 3600,
  esiEmployee: 337,
  // ... other fields
};

await createPayroll(payrollData);
```

#### Bulk Import
```javascript
const payrolls = [
  { employeeId: "...", month: "April 2023", ... },
  { employeeId: "...", month: "April 2023", ... },
  // ... more entries
];

await bulkCreatePayroll(payrolls);
```

### Exporting Reports
- Click "Export Excel" button to download report
- Use "Print" button for print-optimized view

## Salary Calculations

### Gross Salary
```
Gross Salary = Basic Pay + HRA + Allowances
```

### Deductions
- **PF (Provident Fund)**: Typically 12% of Basic Pay
- **ESI (Employee State Insurance)**: 0.75% of Gross (if Gross ≤ ₹21,000)
- **Professional Tax**: Fixed amount based on salary slab
- **Income Tax**: Based on tax brackets

### Net Salary
```
Net Salary = Gross Salary - Total Deductions
```

## Troubleshooting

### No Data Showing
1. Check if backend is running
2. Verify employees exist in database
3. Run seed script: `node seedPayroll.js`
4. Check browser console for errors

### API Errors
1. Verify MongoDB connection
2. Check API endpoint URLs
3. Ensure proper authentication if required
4. Check server logs for detailed errors

### Calculation Issues
The Payroll model has pre-save hooks that automatically calculate:
- Gross Salary
- Total Deductions
- Net Salary

If calculations seem wrong, verify the pre-save hook in `models/Payroll.js`.

## Future Enhancements

- [ ] Employee-wise payslip generation
- [ ] Tax calculation automation
- [ ] Bonus and incentive management
- [ ] Attendance integration
- [ ] Leave deduction automation
- [ ] Direct payment gateway integration
- [ ] Email notifications for payslips
- [ ] Advanced filtering and search
- [ ] Multi-currency support
- [ ] Custom salary components

## Support

For issues or questions:
1. Check the console logs (browser & server)
2. Verify data in MongoDB
3. Review API responses in Network tab
4. Check model validations

## License
Internal use only
