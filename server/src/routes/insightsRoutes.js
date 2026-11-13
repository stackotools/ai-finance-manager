const express = require('express');
const router = express.Router();
const insightsController = require('../controllers/insightsController');

router.get('/', insightsController.getInsights);
router.post('/regenerate', insightsController.regenerateInsights);
router.get('/prediction', insightsController.getPrediction);

module.exports = router;
