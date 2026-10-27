import { Request, Response, NextFunction } from 'express';
import { updateProfileSchema } from './schema';
import * as userService from './service';
import { AuthenticationError } from '../../lib/errors';

export async function getProfileController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AuthenticationError();
    const user = await userService.getProfile(req.user.id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProfileController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AuthenticationError();
    const input = updateProfileSchema.parse(req.body);
    const updatedUser = await userService.updateProfile(req.user.id, input);

    res.status(200).json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteAccountController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AuthenticationError();
    const result = await userService.softDeleteAccount(req.user.id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
}

export async function getDashboardController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AuthenticationError();
    const dashboard = await userService.getDashboard(req.user.id);

    res.status(200).json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    next(error);
  }
}
