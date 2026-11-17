import { Router } from 'express';
import { register, login, getMe, getWorkers, demoLogin } from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/demo-login', demoLogin);
router.get('/me', authenticate, getMe);
router.get('/workers', authenticate, getWorkers);

export default router;
