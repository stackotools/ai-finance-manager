const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/pdf',
    'application/x-pdf'
  ];
  if (allowedMimeTypes.includes(file.mimetype) || file.originalname.match(/\.(csv|xls|xlsx|pdf)$/i)) {
    cb(null, true);
  } else {
    cb(new Error('Only .csv, .xls, .xlsx, and .pdf files are allowed'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB to accommodate PDFs
  fileFilter
});

module.exports = upload;
