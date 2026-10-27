import { Request, Response, NextFunction } from 'express';
import {
  createExpenseSchema,
  updateExpenseSchema,
  listExpensesQuerySchema,
} from './schema';
import * as expenseService from './service';
import { AuthenticationError } from '../../lib/errors';

export async function createExpenseController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AuthenticationError();
    const input = createExpenseSchema.parse(req.body);
    const expense = await expenseService.createExpense(req.params.groupId, req.user.id, input);

    res.status(201).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    next(error);
  }
}

export async function getExpenseController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AuthenticationError();
    const expense = await expenseService.getExpense(req.params.groupId, req.params.expenseId, req.user.id);

    res.status(200).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateExpenseController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AuthenticationError();
    const input = updateExpenseSchema.parse(req.body);
    const expense = await expenseService.updateExpense(
      req.params.groupId,
      req.params.expenseId,
      req.user.id,
      input
    );

    res.status(200).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteExpenseController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AuthenticationError();
    const result = await expenseService.deleteExpense(req.params.groupId, req.params.expenseId, req.user.id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
}

export async function listExpensesController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AuthenticationError();
    const query = listExpensesQuerySchema.parse(req.query);
    const result = await expenseService.listExpenses(req.params.groupId, req.user.id, query);

    res.status(200).json({
      success: true,
      data: result.expenses,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}
