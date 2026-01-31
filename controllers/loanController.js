const Loan = require('../models/Loan');
const Stats = require('../models/Stats');

// Get all loans
exports.getAllLoans = async (req, res) => {
  try {
    const loans = await Loan.find().sort({ createdAt: -1 });
    res.json(loans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single loan
exports.getLoanById = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ message: 'Loan not found' });
    res.json(loan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new loan
exports.createLoan = async (req, res) => {
  try {
    const { employeeName, employeeId, loanType, originalAmount } = req.body;
    
    // Validate required fields
    if (!employeeName || !employeeId || !loanType || !originalAmount) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Validate amount
    if (originalAmount < 1000) {
      return res.status(400).json({ message: 'Loan amount must be at least ₹1000' });
    }
    
    // Only check for pending loans if it's NOT an emergency loan
    if (loanType !== 'Emergency Loan') {
      const existingPendingLoan = await Loan.findOne({ 
        employeeId, 
        status: 'pending' 
      });
      
      if (existingPendingLoan) {
        return res.status(400).json({ 
          message: 'Employee already has a pending loan. Please clear existing loans before applying for a new one.' 
        });
      }
    }
    
    let loanRef;
    let attempts = 0;
    const maxAttempts = 5;
    
    // Generate unique loanRef
    while (attempts < maxAttempts) {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      loanRef = `#LN-${timestamp}${random}`;
      
      // Check if this loanRef already exists
      const existing = await Loan.findOne({ loanRef });
      if (!existing) break;
      
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      return res.status(500).json({ message: 'Unable to generate unique loan reference' });
    }

    const loan = new Loan({
      employeeName: employeeName.trim(),
      employeeId: employeeId.trim(),
      loanType,
      loanRef,
      originalAmount: Number(originalAmount),
      paidAmount: 0,
      outstanding: Number(originalAmount),
      status: 'pending'
    });

    const newLoan = await loan.save();
    res.status(201).json(newLoan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update loan
exports.updateLoan = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ message: 'Loan not found' });

    const { paymentAmount, loanType, originalAmount } = req.body;

    // Validate inputs
    if (paymentAmount !== undefined && paymentAmount < 0) {
      return res.status(400).json({ message: 'Payment amount cannot be negative' });
    }

    if (originalAmount !== undefined && originalAmount < 1000) {
      return res.status(400).json({ message: 'Original amount must be at least ₹1000' });
    }

    if (loanType) loan.loanType = loanType;
    if (originalAmount) {
      loan.originalAmount = originalAmount;
      loan.outstanding = originalAmount - loan.paidAmount;
      
      // Ensure outstanding doesn't go negative
      if (loan.outstanding < 0) {
        loan.outstanding = 0;
        loan.paidAmount = originalAmount;
        loan.status = 'paid';
      }
    }

    if (paymentAmount !== undefined && paymentAmount > 0) {
      if (paymentAmount > loan.outstanding) {
        return res.status(400).json({ message: 'Payment amount cannot exceed outstanding amount' });
      }
      loan.paidAmount += paymentAmount;
      loan.outstanding -= paymentAmount;
      
      if (loan.outstanding <= 0) {
        loan.outstanding = 0;
        loan.status = 'paid';
      }
    }

    const updatedLoan = await loan.save();
    res.json(updatedLoan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete loan
exports.deleteLoan = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ message: 'Loan not found' });

    await loan.deleteOne();
    res.json({ message: 'Loan deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get statistics
exports.getStats = async (req, res) => {
  try {
    const loans = await Loan.find();
    
    const currentStats = {
      totalOutstanding: loans.reduce((sum, loan) => sum + loan.outstanding, 0),
      pendingLoans: loans.filter(loan => loan.status === 'pending').length,
      paidLoans: loans.filter(loan => loan.status === 'paid').length,
      recoveredThisMonth: loans.reduce((sum, loan) => sum + loan.paidAmount, 0)
    };

    // Get baseline stats
    let baselineStats = await Stats.findOne({ isBaseline: true });
    
    if (!baselineStats) {
      baselineStats = await Stats.create({ ...currentStats, isBaseline: true });
      return res.json({
        ...currentStats,
        outstandingChange: 0,
        pendingChange: 0,
        paidChange: 0,
        recoveredChange: 0,
        outstandingTrend: 'neutral',
        pendingTrend: 'neutral',
        paidTrend: 'neutral',
        recoveredTrend: 'neutral'
      });
    }

    // Calculate percentage changes
    const calculateChange = (current, previous) => {
      if (current === previous) return 0;
      if (previous === 0) return current > 0 ? 100 : 0;
      const change = Math.round(((current - previous) / previous) * 100);
      return Math.max(-100, Math.min(100, change));
    };

    const getTrend = (change) => change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';

    const outstandingChange = calculateChange(currentStats.totalOutstanding, baselineStats.totalOutstanding);
    const pendingChange = calculateChange(currentStats.pendingLoans, baselineStats.pendingLoans);
    const paidChange = calculateChange(currentStats.paidLoans, baselineStats.paidLoans);
    const recoveredChange = calculateChange(currentStats.recoveredThisMonth, baselineStats.recoveredThisMonth);

    // Update baseline after calculating changes
    const hasChanged = 
      currentStats.totalOutstanding !== baselineStats.totalOutstanding ||
      currentStats.pendingLoans !== baselineStats.pendingLoans ||
      currentStats.paidLoans !== baselineStats.paidLoans ||
      currentStats.recoveredThisMonth !== baselineStats.recoveredThisMonth;
    
    if (hasChanged) {
      await Stats.updateOne({ isBaseline: true }, { $set: currentStats });
    }

    res.json({
      ...currentStats,
      outstandingChange,
      pendingChange,
      paidChange,
      recoveredChange,
      outstandingTrend: getTrend(outstandingChange),
      pendingTrend: getTrend(pendingChange),
      paidTrend: getTrend(paidChange),
      recoveredTrend: getTrend(recoveredChange)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
