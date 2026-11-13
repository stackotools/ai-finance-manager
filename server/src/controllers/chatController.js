const asyncHandler = require('../middleware/asyncHandler');
const chatService = require('../services/chatService');

exports.chat = asyncHandler(async (req, res) => {
  const { message, history } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, message: 'Message is required' });
  }
  if (message.length > 1000) {
    return res.status(400).json({ success: false, message: 'Message is too long' });
  }

  const { reply, source } = await chatService.answer(message.trim(), req.user._id, Array.isArray(history) ? history : []);
  res.status(200).json({ success: true, data: { reply, source } });
});
