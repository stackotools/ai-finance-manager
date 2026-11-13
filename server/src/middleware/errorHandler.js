const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error(err);

  if (err.name === 'MulterError' || err.message?.includes('Only .csv')) {
    return res.status(400).json({ success: false, message: err.message });
  }

  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message };
    return res.status(404).json({ success: false, message });
  }

  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message };
    return res.status(400).json({ success: false, message });
  }

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message };
    return res.status(400).json({ success: false, message });
  }

  if (err.name === 'JsonWebTokenError') {
    const message = 'Token is invalid';
    error = { message };
    return res.status(401).json({ success: false, message });
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token has expired';
    error = { message };
    return res.status(401).json({ success: false, message });
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error'
  });
};

module.exports = errorHandler;
