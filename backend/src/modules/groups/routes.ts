import { Router } from 'express';
import {
  createGroupController,
  listGroupsController,
  getGroupController,
  updateGroupController,
  addMemberController,
  removeMemberController,
  createInvitationController,
  acceptInvitationController,
} from './controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', listGroupsController);
router.post('/', createGroupController);
router.get('/:id', getGroupController);
router.patch('/:id', updateGroupController);
router.post('/:id/members', addMemberController);
router.delete('/:id/members/:userId', removeMemberController);
router.post('/:id/invitations', createInvitationController);
router.post('/invitations/:code/accept', acceptInvitationController);

export default router;
