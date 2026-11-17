import { Router } from 'express';
import { scanImage, calculatePriority, copilotChat } from '../controllers/aiController.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = Router();

router.post('/scan', upload.single('image'), scanImage);
router.post('/calculate-priority', calculatePriority);
router.post('/copilot', copilotChat);

export default router;
