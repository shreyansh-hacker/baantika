import { Request, Response, NextFunction } from 'express';
import { createSettlementSchema, updateSettlementStatusSchema } from './schema';
import * as settlementService from './service';
import { AuthenticationError } from '../../lib/errors';

export async function createSettlementController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AuthenticationError();
    const input = createSettlementSchema.parse(req.body);
    const settlement = await settlementService.createSettlement(req.params.groupId, req.user.id, input);

    res.status(201).json({
      success: true,
      data: settlement,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSettlementController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AuthenticationError();
    const settlement = await settlementService.getSettlement(
      req.params.groupId,
      req.params.settlementId,
      req.user.id
    );

    res.status(200).json({
      success: true,
      data: settlement,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSettlementStatusController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new AuthenticationError();
    const input = updateSettlementStatusSchema.parse(req.body);
    const settlement = await settlementService.updateSettlementStatus(
      req.params.groupId,
      req.params.settlementId,
      req.user.id,
      input
    );

    res.status(200).json({
      success: true,
      data: settlement,
    });
  } catch (error) {
    next(error);
  }
}

export async function listSettlementsController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AuthenticationError();
    const settlements = await settlementService.listSettlements(req.params.groupId, req.user.id);

    res.status(200).json({
      success: true,
      data: settlements,
    });
  } catch (error) {
    next(error);
  }
}
