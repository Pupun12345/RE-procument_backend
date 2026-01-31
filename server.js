require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const connectDB = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const vendorRoutes = require("./routes/vendorRoutes");
const itemRoutes = require("./routes/itemRoutes");
const oldItemRoutes = require("./routes/olditemRoutes");
const loanRoutes = require('./routes/loanRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const payrollRoutes = require('./routes/payrollRoutes');

const app = express();

/* ---- MIDDLEWARE FIRST ---- */
app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(cookieParser());

/* ---- DATABASE ---- */
connectDB();

/* ---- ROUTES ---- */
app.use("/api/auth", authRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/old-items", oldItemRoutes);
app.use("/api/purchases/ppe", require("./routes/purchase/ppePurchaseRoutes"));
app.use("/api/purchases/mechanical",require("./routes/purchase/mechanicalPurchaseRoutes"));
app.use("/api/purchases/scaffolding",require("./routes/purchase/scaffoldingPurchaseRoutes"));
app.use("/api/stock", require("./routes/stock/stockRoutes"));
app.use("/api/stock/mechanical",require("./routes/stock/mechanicalStockRoutes"));
app.use("/api/stock/scaffolding",require("./routes/stock/scaffoldingStockRoutes"));
app.use("/api/issue/scaffolding",require("./routes/issue/scaffoldingIssueRoutes"));
app.use("/api/issue/ppe", require("./routes/issue/ppeIssueRoutes"));
app.use("/api/issue/mechanical", require("./routes/issue/mechanicalIssueRoutes"));
app.use("/api/returns/mechanical",require("./routes/return/mechanicalReturnRoutes"));
app.use("/api/returns/scaffolding",require("./routes/return/scaffoldingReturnRoutes"));
app.use("/api/returns/old", require("./routes/return/oldReturnRoutes"));
app.use("/api/returns", require("./routes/return/returnRoutes"));
app.use("/uploads", express.static("uploads"));
app.use("/api/scaffolding/orders", require("./routes/order/ScaffoldingOrderRoutes"));
app.use("/api/purchases/old",require("./routes/purchase/oldPurchaseRoutes"));
app.use("/api/old-stock", require("./routes/stock/oldStockRoutes"));
app.use("/api/issue/old", require("./routes/issue/oldIssueRoutes"));
app.use('/api/loans', loanRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/reports/mechanical', require('./routes/mechanicalReportRoutes'));
app.use('/api/reports/ppe', require('./routes/ppeReportRoutes'));
app.use('/api/reports/scaffolding', require('./routes/scaffoldingReportRoutes'));

/* ---- SERVER ---- */
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
