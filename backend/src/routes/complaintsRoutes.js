import { Router } from 'express';
import {
  createComplaint,
  listComplaints,
  getComplaint,
  assignWorker,
  updateStatus,
  submitResolutionProof,
  citizenConfirmResolution,
  toggleEmergencyEscalation
} from '../controllers/complaintsController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = Router();

// Public / Semi-public listing & details
router.get('/', listComplaints);
router.get('/:id', getComplaint);

// Create complaint (supports optional token, so citizens can test easily)
router.post('/', (req, res, next) => {
  if (req.headers.authorization) {
    return authenticate(req, res, next);
  }
  next();
}, upload.single('image'), createComplaint);

// Admin actions
router.post('/:id/assign', authenticate, assignWorker);
router.post('/:id/emergency', authenticate, toggleEmergencyEscalation);

// Status updates
router.patch('/:id/status', authenticate, updateStatus);

// Worker resolution proof submission (Before vs After dual image)
router.post('/:id/resolve', authenticate, upload.single('resolution_image'), submitResolutionProof);

// Citizen feedback & confirmation loop (thumbs up -> VERIFIED / thumbs down -> REOPENED)
router.post('/:id/confirm', (req, res, next) => {
  if (req.headers.authorization) {
    return authenticate(req, res, next);
  }
  next();
}, citizenConfirmResolution);

export default router;
