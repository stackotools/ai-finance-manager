const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.get('/summary', analyticsController.getSummary);
router.get('/category-split', analyticsController.getCategorySplit);
router.get('/monthly-trend', analyticsController.getMonthlyTrend);
router.get('/dashboard', analyticsController.getDashboard);

module.exports = router;
