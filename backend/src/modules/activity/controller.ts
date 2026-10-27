import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as activityService from './service';
import { AuthenticationError } from '../../lib/errors';

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(30),
});

export async function getGroupActivityController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new AuthenticationError();
    const pagination = paginationQuerySchema.parse(req.query);
    const result = await activityService.getGroupActivity(
      req.params.groupId,
      req.user.id,
      pagination
    );

    res.status(200).json({
      success: true,
      data: result.events,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function getUserActivityController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new AuthenticationError();
    const pagination = paginationQuerySchema.parse(req.query);
    const result = await activityService.getUserActivity(req.user.id, pagination);

    res.status(200).json({
      success: true,
      data: result.events,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}
