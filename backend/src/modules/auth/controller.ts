import { Request, Response, NextFunction } from 'express';
import * as authService from './service';
import { registerInputSchema, loginInputSchema, refreshInputSchema } from './schema';

export async function registerController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = registerInputSchema.parse(req.body);
    const result = await authService.register(input);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function loginController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = loginInputSchema.parse(req.body);
    const result = await authService.login(input);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function refreshController(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = refreshInputSchema.parse(req.body);
    const result = await authService.refreshSession(refreshToken);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function logoutController(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = refreshInputSchema.parse(req.body);
    await authService.logout(refreshToken);
    res.status(200).json({ success: true, data: { message: 'Logged out successfully' } });
  } catch (error) {
    next(error);
  }
}
