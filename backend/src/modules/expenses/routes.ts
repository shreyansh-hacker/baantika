import { Router } from 'express';
import {
  createExpenseController,
  getExpenseController,
  updateExpenseController,
  deleteExpenseController,
  listExpensesController,
} from './controller';
import { authenticate } from '../../middleware/auth';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/', listExpensesController);
router.post('/', createExpenseController);
router.get('/:expenseId', getExpenseController);
router.patch('/:expenseId', updateExpenseController);
router.delete('/:expenseId', deleteExpenseController);

export default router;
