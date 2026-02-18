const ScaffoldingIssue = require("../models/scaffolding/Issue");
const ScaffoldingReturn = require("../models/scaffolding/Return");
const ScaffoldingStock = require("../models/scaffolding/Stock");

/**
 * Get comprehensive scaffolding final report
 * Aggregates data from Issues, Returns, and Stock
 */
exports.getScaffoldingFinalReport = async (req, res) => {
  try {
    // Fetch all data in parallel
    const [issues, returns, stockItems] = await Promise.all([
      ScaffoldingIssue.find({}).lean(),
      ScaffoldingReturn.find({}).lean(),
      ScaffoldingStock.find({}).lean(),
    ]);

    // Create a stock map for quick lookup
    const stockMap = {};
    stockItems.forEach((item) => {
      stockMap[item.itemName.toLowerCase().trim()] = {
        qty: item.qty || 0,
        unit: item.unit,
      };
    });

    // Aggregate data by item name
    const itemMap = {};

    // Process issues - items going out
    issues.forEach((issue) => {
      issue.items.forEach((item) => {
        const itemKey = item.itemName.toLowerCase().trim();
        if (!itemMap[itemKey]) {
          itemMap[itemKey] = {
            itemName: item.itemName,
            unit: item.unit,
            totalIssued: 0,
            totalReturned: 0,
            inField: 0,
            currentStock: stockMap[itemKey]?.qty || 0,
          };
        }
        itemMap[itemKey].totalIssued += item.qty || 0;
        // Track returned quantity from the issue itself
        itemMap[itemKey].totalReturned += item.returnedQty || 0;
      });
    });

    // Process returns - items coming back
    returns.forEach((returnDoc) => {
      returnDoc.items.forEach((item) => {
        const itemKey = item.itemName.toLowerCase().trim();
        if (!itemMap[itemKey]) {
          itemMap[itemKey] = {
            itemName: item.itemName,
            unit: item.unit,
            totalIssued: 0,
            totalReturned: 0,
            inField: 0,
            currentStock: stockMap[itemKey]?.qty || 0,
          };
        }
        // Add to total returned
        itemMap[itemKey].totalReturned += item.quantity || 0;
      });
    });

    // Calculate in field and net issued for each item
    Object.keys(itemMap).forEach((key) => {
      const item = itemMap[key];
      item.netIssued = item.totalIssued - item.totalReturned;
      item.inField = item.netIssued;

      // Determine status based on stock levels
      if (item.currentStock === 0) {
        item.status = "Critical";
      } else if (item.totalIssued > 0) {
        const stockRatio = item.currentStock / item.totalIssued;
        if (stockRatio < 0.2) {
          item.status = "Low Stock";
        } else {
          item.status = "Healthy";
        }
      } else {
        item.status = "Healthy";
      }
    });

    // Convert to array and sort by item name
    const reportData = Object.values(itemMap).sort((a, b) =>
      a.itemName.localeCompare(b.itemName)
    );

    // Calculate summary statistics
    const summary = {
      totalItems: reportData.length,
      totalIssued: reportData.reduce((sum, item) => sum + item.totalIssued, 0),
      totalReturned: reportData.reduce(
        (sum, item) => sum + item.totalReturned,
        0
      ),
      totalInField: reportData.reduce((sum, item) => sum + item.inField, 0),
      totalStock: reportData.reduce(
        (sum, item) => sum + item.currentStock,
        0
      ),
      criticalItems: reportData.filter((item) => item.status === "Critical")
        .length,
      lowStockItems: reportData.filter((item) => item.status === "Low Stock")
        .length,
    };

    res.status(200).json({
      success: true,
      summary,
      data: reportData,
    });
  } catch (error) {
    console.error("Error generating scaffolding final report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate scaffolding final report",
      error: error.message,
    });
  }
};

/**
 * Get final report for a specific scaffolding item
 */
exports.getScaffoldingItemReport = async (req, res) => {
  try {
    const { itemName } = req.params;
    const itemKey = itemName.toLowerCase().trim();

    // Fetch data for the specific item
    const [issues, returns, stockItem] = await Promise.all([
      ScaffoldingIssue.find({
        "items.itemName": new RegExp(`^${itemName}$`, "i"),
      }).lean(),
      ScaffoldingReturn.find({
        "items.itemName": new RegExp(`^${itemName}$`, "i"),
      }).lean(),
      ScaffoldingStock.findOne({
        itemName: new RegExp(`^${itemName}$`, "i"),
      }).lean(),
    ]);

    let totalIssued = 0;
    let totalReturned = 0;
    const issueHistory = [];
    const returnHistory = [];

    // Process issues
    issues.forEach((issue) => {
      issue.items.forEach((item) => {
        if (item.itemName.toLowerCase().trim() === itemKey) {
          totalIssued += item.qty || 0;
          totalReturned += item.returnedQty || 0;
          issueHistory.push({
            date: issue.issueDate,
            issuedTo: issue.issuedTo,
            location: issue.location,
            woNumber: issue.woNumber,
            supervisorName: issue.supervisorName,
            tslName: issue.tslName,
            quantity: item.qty,
            unit: item.unit,
          });
        }
      });
    });

    // Process returns
    returns.forEach((returnDoc) => {
      returnDoc.items.forEach((item) => {
        if (item.itemName.toLowerCase().trim() === itemKey) {
          totalReturned += item.quantity || 0;
          returnHistory.push({
            date: returnDoc.returnDate,
            personName: returnDoc.personName,
            location: returnDoc.location,
            woNumber: returnDoc.woNumber,
            supervisorName: returnDoc.supervisorName,
            tslName: returnDoc.tslName,
            quantity: item.quantity,
            unit: item.unit,
          });
        }
      });
    });

    const currentStock = stockItem?.qty || 0;
    const netIssued = totalIssued - totalReturned;
    const inField = netIssued;

    let status = "Healthy";
    if (currentStock === 0) {
      status = "Critical";
    } else if (totalIssued > 0) {
      const stockRatio = currentStock / totalIssued;
      if (stockRatio < 0.2) {
        status = "Low Stock";
      }
    }

    res.status(200).json({
      success: true,
      itemName: itemName,
      unit: stockItem?.unit || issueHistory[0]?.unit || returnHistory[0]?.unit || "N/A",
      summary: {
        totalIssued,
        totalReturned,
        netIssued,
        inField,
        currentStock,
        status,
      },
      issueHistory: issueHistory.sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      ),
      returnHistory: returnHistory.sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      ),
    });
  } catch (error) {
    console.error("Error generating scaffolding item report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate scaffolding item report",
      error: error.message,
    });
  }
};
