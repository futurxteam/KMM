import { Router } from 'express';
import { authenticate, authorize, ROLES } from '../middleware/auth.js';
import { listEnquiries, enquiryCourseNames } from '../controllers/enquiryController.js';
import { changeStatus, dashboardStats, getDetails } from '../controllers/contactController.js';
import { ok } from '../utils/response.js';

const router = Router();

// PA-only. `authenticate` re-checks the account in MongoDB, so inactive/deleted PAs are rejected.
router.use(authenticate, authorize(ROLES.PA));

router.get('/ping', (req, res) => ok(res, { user: req.user }, 'PA access granted'));
router.get('/dashboard/stats', dashboardStats);
router.get('/enquiries', listEnquiries);
router.get('/enquiries/courses', enquiryCourseNames);
router.get('/enquiries/:id', getDetails);
router.patch('/enquiries/:id/status', changeStatus);

export default router;

