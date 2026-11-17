import { db } from '../models/db.js';

export function getMyNotifications(req, res) {
  try {
    const userId = req.user ? req.user.id : 'usr-citizen-1';
    const notifs = db.notifications.getByUserId(userId);
    return res.json({ notifications: notifs });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
}

export function markAsRead(req, res) {
  try {
    const { id } = req.params;
    db.notifications.markRead(id);
    return res.json({ message: 'Notification marked as read' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update notification' });
  }
}
