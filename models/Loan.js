const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  employeeName: {
    type: String,
    required: true
  },
  employeeId: {
    type: String,
    required: true
  },
  loanType: {
    type: String,
    required: true,
    enum: ['Personal Loan', 'Salary Advance', 'Emergency Loan', 'Home Loan']
  },
  loanRef: {
    type: String,
    required: true,
    unique: true
  },
  originalAmount: {
    type: Number,
    required: true,
    min: 1000
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  outstanding: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['paid', 'pending'],
    default: 'pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Loan', loanSchema);