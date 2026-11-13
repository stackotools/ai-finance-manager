const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');

router.get('/', budgetController.getBudgets);
router.post('/recommend', budgetController.recommendBudgets);
router.put('/', budgetController.saveBudgets);

module.exports = router;
