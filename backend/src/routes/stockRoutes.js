const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');

// Stock In/Out routes
router.post('/in', stockController.stockIn);
router.post('/out', stockController.stockOut);
router.get('/history', stockController.getStockHistory);
router.get('/history/:id', stockController.getStockHistoryById);

module.exports = router;

