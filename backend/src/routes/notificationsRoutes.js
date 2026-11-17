import { Router } from 'express';
import { getMyNotifications, markAsRead } from '../controllers/notificationsController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', (req, res, next) => {
  if (req.headers.authorization) {
    return authenticate(req, res, next);
  }
  next();
}, getMyNotifications);

router.patch('/:id/read', markAsRead);

export default router;
