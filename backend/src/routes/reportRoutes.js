const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/inventory-summary', reportController.getInventorySummary);
router.get('/stock-movements', reportController.getStockMovements);
router.get('/low-stock', reportController.getLowStockItems);
router.get('/borrow-return-summary', reportController.getBorrowReturnSummary);

module.exports = router;

