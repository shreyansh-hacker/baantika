import { Router } from 'express';
import { getBalancesController, getSettlementSuggestionsController } from './controller';
import { authenticate } from '../../middleware/auth';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/', getBalancesController);
router.get('/suggestions', getSettlementSuggestionsController);

export default router;
