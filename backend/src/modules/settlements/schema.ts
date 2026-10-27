import { z } from 'zod';

export const createSettlementSchema = z
  .object({
    payerId: z.string().uuid('Invalid debtor/payer ID'),
    payeeId: z.string().uuid('Invalid creditor/payee ID'),
    amountPaise: z
      .number()
      .int()
      .positive('Settlement amount must be positive integer paise')
      .max(100_000_000, 'Settlement amount exceeds maximum limit of ₹10,00,000'),
    note: z.string().max(500).optional().nullable(),
  })
  .refine((data) => data.payerId !== data.payeeId, {
    message: 'Payer and payee cannot be the same user',
    path: ['payeeId'],
  });

export type CreateSettlementInput = z.infer<typeof createSettlementSchema>;

export const updateSettlementStatusSchema = z.object({
  status: z.enum(['COMPLETED', 'CANCELLED']),
});

export type UpdateSettlementStatusInput = z.infer<typeof updateSettlementStatusSchema>;
