const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loanController');

router.get('/', loanController.getAllLoans);
router.get('/stats', loanController.getStats);
router.get('/:id', loanController.getLoanById);
router.post('/', loanController.createLoan);
router.put('/:id', loanController.updateLoan);
router.delete('/:id', loanController.deleteLoan);

module.exports = router;