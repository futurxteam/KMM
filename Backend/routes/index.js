import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { adminLogin, paLogin, me, logout, setupAdmin } from '../controllers/authController.js';
import { createEnquiry } from '../controllers/enquiryController.js';
import { listPublic } from '../controllers/courseController.js';
import adminRoutes from './adminRoutes.js';
import paRoutes from './paRoutes.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

const limiter = (max, windowMs = 15 * 60 * 1000) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'test',
    message: { success: false, message: 'Too many requests, please try again later' },
  });

router.get('/health', (_req, res) => res.json({ success: true, message: 'OK' }));

router.post('/auth/setup-admin', limiter(10, 60 * 60 * 1000), setupAdmin);
router.post('/auth/admin/login', limiter(20), adminLogin);
router.post('/auth/pa/login', limiter(20), paLogin);
router.get('/auth/me', authenticate, me);
router.post('/auth/logout', authenticate, logout);

router.get('/courses', listPublic);
router.post('/enquiries', limiter(30, 60 * 60 * 1000), createEnquiry);

router.use('/admin', adminRoutes);

router.use('/pa', paRoutes);

export default router;

