import { Router } from 'express';
import {
  getProfileController,
  updateProfileController,
  deleteAccountController,
  getDashboardController,
} from './controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/me', getProfileController);
router.patch('/me', updateProfileController);
router.delete('/me', deleteAccountController);
router.get('/me/dashboard', getDashboardController);

export default router;
