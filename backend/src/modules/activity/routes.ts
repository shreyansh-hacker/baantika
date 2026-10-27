import { Router } from 'express';
import { getGroupActivityController, getUserActivityController } from './controller';
import { authenticate } from '../../middleware/auth';

const router = Router({ mergeParams: true });

router.use(authenticate);

// When mounted under /groups/:groupId/activity
router.get('/', getGroupActivityController);

// When mounted under /activity/me
router.get('/me', getUserActivityController);

export default router;
