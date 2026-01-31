const mongoose = require('mongoose');

const statsSchema = new mongoose.Schema({
  totalOutstanding: { type: Number, default: 0 },
  pendingLoans: { type: Number, default: 0 },
  paidLoans: { type: Number, default: 0 },
  recoveredThisMonth: { type: Number, default: 0 },
  isBaseline: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Stats', statsSchema);