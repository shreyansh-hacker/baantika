import { Router } from 'express';
import {
  createSettlementController,
  getSettlementController,
  updateSettlementStatusController,
  listSettlementsController,
} from './controller';
import { authenticate } from '../../middleware/auth';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/', listSettlementsController);
router.post('/', createSettlementController);
router.get('/:settlementId', getSettlementController);
router.patch('/:settlementId', updateSettlementStatusController);

export default router;
