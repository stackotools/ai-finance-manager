const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const upload = require('../middleware/upload');

const handleUpload = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

router.post('/parse', handleUpload, uploadController.parseUpload);
router.post('/import', uploadController.importTransactions);

module.exports = router;
