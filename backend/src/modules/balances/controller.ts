import { Request, Response, NextFunction } from 'express';
import * as balanceService from './service';
import { AuthenticationError } from '../../lib/errors';

export async function getBalancesController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AuthenticationError();
    const result = await balanceService.getGroupBalances(req.params.groupId, req.user.id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSettlementSuggestionsController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new AuthenticationError();
    const result = await balanceService.getSettlementSuggestions(req.params.groupId, req.user.id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
