import { Router } from 'express';
import { getAnalytics, getHealthScore, getDepartments } from '../controllers/analyticsController.js';

const router = Router();

router.get('/', getAnalytics);
router.get('/health', getHealthScore);
router.get('/departments', getDepartments);

export default router;
