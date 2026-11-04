import { Router } from 'express';
import * as admin from '../controllers/adminController.js';
import * as analytics from '../controllers/analyticsController.js';
import * as pa from '../controllers/paController.js';
import * as courses from '../controllers/courseController.js';
import { listAdmin, enquiryCourseNames } from '../controllers/enquiryController.js';
import { getDetails } from '../controllers/contactController.js';
import { authenticate, authorize, ROLES } from '../middleware/auth.js';

const router = Router();

// Every route below requires a valid ADMIN token.
router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/ping', admin.ping);

router.get('/dashboard/stats', analytics.stats);
router.get('/dashboard/enquiries-trend', analytics.enquiriesTrend);
router.get('/dashboard/course-stats', analytics.courseStats);
router.get('/dashboard/contact-stats', analytics.contactStats);
router.get('/dashboard/monthly-trends', analytics.monthlyTrends);
router.get('/dashboard/recent-activity', analytics.recentActivity);
router.get('/dashboard/pa-performance', analytics.paPerformance);

router.get('/enquiries', listAdmin);
router.get('/enquiries/courses', enquiryCourseNames);
router.get('/enquiries/:id', getDetails);

router.get('/pa', pa.list);
router.post('/pa', pa.create);
router.put('/pa/:id', pa.update);
router.delete('/pa/:id', pa.remove);

router.get('/courses', courses.list);
router.post('/courses', courses.create);
router.put('/courses/:id', courses.update);
router.delete('/courses/:id', courses.remove);

export default router;


