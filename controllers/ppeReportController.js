const PPEIssue = require("../models/ppe/issue");
const PPEReturn = require("../models/ppe/Return");
const PPEStock = require("../models/ppe/Stock");

exports.getPPEFinalReport = async (req, res) => {
  try {
    const [issues, returns, stock] = await Promise.all([
      PPEIssue.find().sort({ createdAt: -1 }).lean(),
      PPEReturn.find().sort({ createdAt: -1 }).lean(),
      PPEStock.find().lean()
    ]);

    const stockMap = {};
    stock.forEach(item => {
      stockMap[item.itemName.toLowerCase()] = {
        currentStock: item.qty || 0,
        unit: item.unit
      };
    });

    const reportMap = {};

    issues.forEach(issue => {
      issue.items.forEach(item => {
        const key = item.itemName.toLowerCase();
        if (!reportMap[key]) {
          reportMap[key] = {
            itemName: item.itemName,
            unit: item.unit || stockMap[key]?.unit || '',
            totalIssued: 0,
            totalReturned: 0,
            currentStock: stockMap[key]?.currentStock || 0,
            issues: [],
            returns: []
          };
        }
        reportMap[key].totalIssued += item.qty || 0;
        reportMap[key].issues.push({
          date: issue.issueDate,
          issuedTo: issue.issuedTo,
          location: issue.location,
          quantity: item.qty,
          id: issue._id
        });
      });
    });

    returns.forEach(returnDoc => {
      returnDoc.items.forEach(item => {
        const key = item.itemName.toLowerCase();
        if (!reportMap[key]) {
          reportMap[key] = {
            itemName: item.itemName,
            unit: item.unit || stockMap[key]?.unit || '',
            totalIssued: 0,
            totalReturned: 0,
            currentStock: stockMap[key]?.currentStock || 0,
            issues: [],
            returns: []
          };
        }
        reportMap[key].totalReturned += item.quantity || 0;
        reportMap[key].returns.push({
          date: returnDoc.returnDate,
          personName: returnDoc.personName,
          location: returnDoc.location,
          quantity: item.quantity,
          id: returnDoc._id
        });
      });
    });

    stock.forEach(item => {
      const key = item.itemName.toLowerCase();
      if (!reportMap[key]) {
        reportMap[key] = {
          itemName: item.itemName,
          unit: item.unit,
          totalIssued: 0,
          totalReturned: 0,
          currentStock: item.qty || 0,
          issues: [],
          returns: []
        };
      }
    });

    const reportData = Object.values(reportMap).map(item => ({
      ...item,
      netIssued: item.totalIssued - item.totalReturned,
      inField: Math.max(0, item.totalIssued - item.totalReturned)
    }));

    reportData.sort((a, b) => a.itemName.localeCompare(b.itemName));

    const summary = {
      totalItems: reportData.length,
      totalIssued: reportData.reduce((sum, item) => sum + item.totalIssued, 0),
      totalReturned: reportData.reduce((sum, item) => sum + item.totalReturned, 0),
      totalInField: reportData.reduce((sum, item) => sum + item.inField, 0),
      totalCurrentStock: reportData.reduce((sum, item) => sum + item.currentStock, 0)
    };

    res.json({
      success: true,
      summary,
      data: reportData
    });

  } catch (error) {
    console.error("Error generating PPE final report:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to generate PPE final report",
      error: error.message 
    });
  }
};

exports.getPPEReportByItem = async (req, res) => {
  try {
    const { itemName } = req.params;

    const [issues, returns, stock] = await Promise.all([
      PPEIssue.find({ 
        "items.itemName": { $regex: new RegExp(itemName, 'i') }
      }).sort({ createdAt: -1 }).lean(),
      PPEReturn.find({ 
        "items.itemName": { $regex: new RegExp(itemName, 'i') }
      }).sort({ createdAt: -1 }).lean(),
      PPEStock.findOne({ 
        itemName: { $regex: new RegExp(`^${itemName}$`, 'i') }
      }).lean()
    ]);

    let totalIssued = 0;
    let totalReturned = 0;

    const issueDetails = [];
    issues.forEach(issue => {
      const item = issue.items.find(i => 
        i.itemName.toLowerCase() === itemName.toLowerCase()
      );
      if (item) {
        totalIssued += item.qty || 0;
        issueDetails.push({
          date: issue.issueDate,
          issuedTo: issue.issuedTo,
          location: issue.location,
          quantity: item.qty,
          id: issue._id
        });
      }
    });

    const returnDetails = [];
    returns.forEach(returnDoc => {
      const item = returnDoc.items.find(i => 
        i.itemName.toLowerCase() === itemName.toLowerCase()
      );
      if (item) {
        totalReturned += item.quantity || 0;
        returnDetails.push({
          date: returnDoc.returnDate,
          personName: returnDoc.personName,
          location: returnDoc.location,
          quantity: item.quantity,
          id: returnDoc._id
        });
      }
    });

    res.json({
      success: true,
      itemName,
      unit: stock?.unit || '',
      currentStock: stock?.qty || 0,
      totalIssued,
      totalReturned,
      netIssued: totalIssued - totalReturned,
      inField: Math.max(0, totalIssued - totalReturned),
      issueDetails,
      returnDetails
    });

  } catch (error) {
    console.error("Error fetching PPE item report:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch PPE item report",
      error: error.message 
    });
  }
};
