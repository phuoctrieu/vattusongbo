const express = require('express');
const router = express.Router();
const borrowReturnController = require('../controllers/borrowReturnController');

router.post('/borrow', borrowReturnController.borrowItem);
router.post('/return', borrowReturnController.returnItem);
router.get('/', borrowReturnController.getAllBorrowRecords);
router.get('/:id', borrowReturnController.getBorrowRecordById);
router.get('/pending', borrowReturnController.getPendingReturns);

module.exports = router;

