import { Router } from 'express';
import { registerController, loginController, refreshController, logoutController } from './controller';
import { authRateLimiter } from '../../middleware/rateLimit';

const router = Router();

router.post('/register', authRateLimiter, registerController);
router.post('/login', authRateLimiter, loginController);
router.post('/refresh', refreshController);
router.post('/logout', logoutController);

export default router;
