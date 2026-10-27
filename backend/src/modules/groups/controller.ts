import { Request, Response, NextFunction } from 'express';
import {
  createGroupSchema,
  updateGroupSchema,
  addMemberSchema,
  createInvitationSchema,
} from './schema';
import * as groupService from './service';
import { AuthenticationError } from '../../lib/errors';

export async function createGroupController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AuthenticationError();
    const input = createGroupSchema.parse(req.body);
    const group = await groupService.createGroup(req.user.id, input);

    res.status(201).json({
      success: true,
      data: group,
    });
  } catch (error) {
    next(error);
  }
}

export async function listGroupsController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AuthenticationError();
    const groups = await groupService.listGroups(req.user.id);

    res.status(200).json({
      success: true,
      data: groups,
    });
  } catch (error) {
    next(error);
  }
}

export async function getGroupController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AuthenticationError();
    const group = await groupService.getGroup(req.params.id, req.user.id);

    res.status(200).json({
      success: true,
      data: group,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateGroupController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AuthenticationError();
    const input = updateGroupSchema.parse(req.body);
    const group = await groupService.updateGroup(req.params.id, req.user.id, input);

    res.status(200).json({
      success: true,
      data: group,
    });
  } catch (error) {
    next(error);
  }
}

export async function addMemberController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AuthenticationError();
    const input = addMemberSchema.parse(req.body);
    const member = await groupService.addMember(req.params.id, req.user.id, input);

    res.status(201).json({
      success: true,
      data: member,
    });
  } catch (error) {
    next(error);
  }
}

export async function removeMemberController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AuthenticationError();
    const result = await groupService.removeMember(req.params.id, req.user.id, req.params.userId);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
}

export async function createInvitationController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AuthenticationError();
    const input = createInvitationSchema.parse(req.body);
    const invitation = await groupService.createInvitation(req.params.id, req.user.id, input);

    res.status(201).json({
      success: true,
      data: invitation,
    });
  } catch (error) {
    next(error);
  }
}

export async function acceptInvitationController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AuthenticationError();
    const result = await groupService.acceptInvitation(req.params.code, req.user.id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
