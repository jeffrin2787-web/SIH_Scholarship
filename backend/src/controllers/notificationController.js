const { query } = require('../config/db');

class NotificationController {
  static async getMyNotifications(req, res) {
    try {
      const notifications = await query.all(
        `SELECT * FROM notifications
         WHERE user_id = ?
         ORDER BY created_at DESC`,
        [req.user.id]
      );

      const unreadCount = notifications.filter(n => !n.is_read).length;

      return res.json({
        notifications,
        unreadCount
      });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  }

  static async markAsRead(req, res) {
    try {
      const { id } = req.params;
      await query.run(
        `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
        [id, req.user.id]
      );
      return res.json({ message: 'Marked as read' });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to update notification' });
    }
  }

  static async markAllAsRead(req, res) {
    try {
      await query.run(
        `UPDATE notifications SET is_read = 1 WHERE user_id = ?`,
        [req.user.id]
      );
      return res.json({ message: 'All notifications marked as read' });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to update notifications' });
    }
  }
}

module.exports = NotificationController;
