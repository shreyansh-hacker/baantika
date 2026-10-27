import { z } from 'zod';

export const splitMethodEnum = z.enum(['EQUAL', 'EXACT', 'PERCENTAGE', 'SHARES']);
export type SplitMethodType = z.infer<typeof splitMethodEnum>;

export const expensePayerInputSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  amountPaise: z.number().int().positive('Payer amount must be positive integer paise'),
});

export const expenseSplitInputSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  amountPaise: z.number().int().positive().optional(),
  percentage: z.number().positive().max(100).optional(),
  shares: z.number().positive().optional(),
});

export const createExpenseSchema = z
  .object({
    description: z
      .string()
      .min(1, 'Description is required')
      .max(255, 'Description must be at most 255 characters')
      .trim(),
    amountPaise: z
      .number()
      .int()
      .positive('Expense amount must be positive integer paise')
      .max(100_000_000, 'Expense amount exceeds maximum limit of ₹10,00,000'),
    expenseDate: z.string().or(z.date()).transform((val) => new Date(val)),
    category: z.string().max(50).optional().nullable(),
    splitMethod: splitMethodEnum,
    payers: z.array(expensePayerInputSchema).min(1, 'At least one payer is required'),
    splits: z.array(expenseSplitInputSchema).min(1, 'At least one participant is required'),
    notes: z.string().max(1000).optional().nullable(),
    idempotencyKey: z.string().max(100).optional().nullable(),
  })
  .refine(
    (data) => {
      const payerTotal = data.payers.reduce((sum, p) => sum + p.amountPaise, 0);
      return payerTotal === data.amountPaise;
    },
    {
      message: 'Sum of payer amounts must equal total expense amount',
      path: ['payers'],
    }
  );

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export const updateExpenseSchema = z
  .object({
    description: z.string().min(1).max(255).trim().optional(),
    amountPaise: z.number().int().positive().max(100_000_000).optional(),
    expenseDate: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
    category: z.string().max(50).optional().nullable(),
    splitMethod: splitMethodEnum.optional(),
    payers: z.array(expensePayerInputSchema).min(1).optional(),
    splits: z.array(expenseSplitInputSchema).min(1).optional(),
    notes: z.string().max(1000).optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.amountPaise !== undefined && data.payers !== undefined) {
        const payerTotal = data.payers.reduce((sum, p) => sum + p.amountPaise, 0);
        return payerTotal === data.amountPaise;
      }
      return true;
    },
    {
      message: 'Sum of payer amounts must equal total expense amount',
      path: ['payers'],
    }
  );

export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

export const listExpensesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  category: z.string().optional(),
  search: z.string().optional(),
});

export type ListExpensesQuery = z.infer<typeof listExpensesQuerySchema>;
