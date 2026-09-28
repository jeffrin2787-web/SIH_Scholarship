const JagoService = require('../services/JagoService');

class JagoController {
  static async chat(req, res) {
    try {
      const { message, language = 'en' } = req.body;

      if (!message || message.trim() === '') {
        return res.status(400).json({ error: 'Message cannot be empty.' });
      }

      const response = await JagoService.handleStudentMessage(req.user.id, message, language);
      return res.json({
        success: true,
        ...response
      });
    } catch (err) {
      console.error('Jago chat error:', err);
      return res.status(500).json({
        reply: 'Sorry, I encountered an issue accessing scholarship records. Please try again.',
        actions: []
      });
    }
  }
}

module.exports = JagoController;
