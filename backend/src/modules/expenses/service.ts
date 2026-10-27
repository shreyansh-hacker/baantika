import { prisma } from '../../lib/prisma';
import {
  ValidationError,
  NotFoundError,
  AuthorizationError,
} from '../../lib/errors';
import { verifyMembership } from '../groups/service';
import {
  CreateExpenseInput,
  UpdateExpenseInput,
  ListExpensesQuery,
  SplitMethodType,
} from './schema';

export interface CalculatedSplit {
  userId: string;
  amountPaise: number;
  shareValue?: number | null;
}

/**
 * Deterministic integer-paise split calculation engine.
 * Never uses floating point for persisted results.
 * Sum of all split amounts ALWAYS equals totalPaise exactly.
 */
export function calculateSplits(
  totalPaise: number,
  splitMethod: SplitMethodType,
  splits: { userId: string; amountPaise?: number; percentage?: number; shares?: number }[]
): CalculatedSplit[] {
  if (splits.length === 0) {
    throw new ValidationError('At least one participant is required for split');
  }

  // Check for duplicate participant user IDs
  const userIds = new Set<string>();
  for (const s of splits) {
    if (userIds.has(s.userId)) {
      throw new ValidationError(`Duplicate participant in split: ${s.userId}`);
    }
    userIds.add(s.userId);
  }

  switch (splitMethod) {
    case 'EQUAL': {
      const n = splits.length;
      const base = Math.floor(totalPaise / n);
      const remainder = totalPaise - base * n;

      // Deterministic order by userId
      const sorted = [...splits].sort((a, b) => a.userId.localeCompare(b.userId));

      return sorted.map((s, idx) => ({
        userId: s.userId,
        amountPaise: base + (idx < remainder ? 1 : 0),
        shareValue: null,
      }));
    }

    case 'EXACT': {
      let sum = 0;
      for (const s of splits) {
        if (s.amountPaise === undefined || s.amountPaise <= 0 || !Number.isInteger(s.amountPaise)) {
          throw new ValidationError(`Exact split for user ${s.userId} must have a positive integer amount in paise`);
        }
        sum += s.amountPaise;
      }

      if (sum !== totalPaise) {
        throw new ValidationError(
          `Sum of exact splits (${sum} paise) does not equal expense total (${totalPaise} paise)`
        );
      }

      return splits.map((s) => ({
        userId: s.userId,
        amountPaise: s.amountPaise!,
        shareValue: null,
      }));
    }

    case 'PERCENTAGE': {
      const totalPercentage = splits.reduce((acc, s) => acc + (s.percentage ?? 0), 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        throw new ValidationError(
          `Split percentages must total exactly 100% (currently ${totalPercentage.toFixed(2)}%)`
        );
      }

      // Largest-Remainder Method (Hare-Niemeyer Method)
      let allocatedPaise = 0;
      const items = splits.map((s) => {
        const pct = s.percentage ?? 0;
        if (pct <= 0) {
          throw new ValidationError(`Percentage for user ${s.userId} must be greater than 0%`);
        }
        const raw = (totalPaise * pct) / 100;
        const floorVal = Math.floor(raw);
        allocatedPaise += floorVal;
        return {
          userId: s.userId,
          base: floorVal,
          fraction: raw - floorVal,
          percentage: pct,
        };
      });

      const remainder = totalPaise - allocatedPaise;
      // Sort by fraction descending, tie-break by userId ascending
      items.sort((a, b) => b.fraction - a.fraction || a.userId.localeCompare(b.userId));

      for (let i = 0; i < remainder; i++) {
        items[i].base += 1;
      }

      return items.map((item) => ({
        userId: item.userId,
        amountPaise: item.base,
        shareValue: item.percentage,
      }));
    }

    case 'SHARES': {
      const totalShares = splits.reduce((acc, s) => acc + (s.shares ?? 0), 0);
      if (totalShares <= 0) {
        throw new ValidationError('Total shares must be greater than 0');
      }

      let allocatedPaise = 0;
      const items = splits.map((s) => {
        const shares = s.shares ?? 1;
        if (shares <= 0) {
          throw new ValidationError(`Shares for user ${s.userId} must be positive`);
        }
        const raw = (totalPaise * shares) / totalShares;
        const floorVal = Math.floor(raw);
        allocatedPaise += floorVal;
        return {
          userId: s.userId,
          base: floorVal,
          fraction: raw - floorVal,
          shares,
        };
      });

      const remainder = totalPaise - allocatedPaise;
      items.sort((a, b) => b.fraction - a.fraction || a.userId.localeCompare(b.userId));

      for (let i = 0; i < remainder; i++) {
        items[i].base += 1;
      }

      return items.map((item) => ({
        userId: item.userId,
        amountPaise: item.base,
        shareValue: item.shares,
      }));
    }

    default:
      throw new ValidationError(`Unsupported split method: ${splitMethod}`);
  }
}

export async function createExpense(groupId: string, userId: string, input: CreateExpenseInput) {
  await verifyMembership(groupId, userId);

  // Idempotency check
  if (input.idempotencyKey) {
    const existing = await prisma.expense.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: {
        payers: { include: { user: { select: { id: true, displayName: true } } } },
        splits: { include: { user: { select: { id: true, displayName: true } } } },
      },
    });

    if (existing) {
      return existing;
    }
  }

  // Verify that all payers and split participants belong to the group
  const participantIds = Array.from(
    new Set([...input.payers.map((p) => p.userId), ...input.splits.map((s) => s.userId)])
  );

  const activeMembers = await prisma.groupMember.findMany({
    where: {
      groupId,
      userId: { in: participantIds },
      removedAt: null,
    },
    select: { userId: true },
  });

  const activeMemberIds = new Set(activeMembers.map((m) => m.userId));
  for (const pid of participantIds) {
    if (!activeMemberIds.has(pid)) {
      throw new ValidationError(`User ${pid} is not an active member of this group`);
    }
  }

  // Calculate deterministic splits
  const calculatedSplits = calculateSplits(input.amountPaise, input.splitMethod, input.splits);

  // Atomic database transaction
  return prisma.$transaction(async (tx) => {
    const expense = await tx.expense.create({
      data: {
        groupId,
        description: input.description,
        amountPaise: input.amountPaise,
        expenseDate: input.expenseDate,
        category: input.category ?? null,
        splitMethod: input.splitMethod,
        createdById: userId,
        notes: input.notes ?? null,
        idempotencyKey: input.idempotencyKey ?? null,
        payers: {
          create: input.payers.map((p) => ({
            userId: p.userId,
            amountPaise: p.amountPaise,
          })),
        },
        splits: {
          create: calculatedSplits.map((s) => ({
            userId: s.userId,
            amountPaise: s.amountPaise,
            shareValue: s.shareValue ?? null,
          })),
        },
      },
      include: {
        payers: {
          include: {
            user: { select: { id: true, displayName: true, email: true } },
          },
        },
        splits: {
          include: {
            user: { select: { id: true, displayName: true, email: true } },
          },
        },
        createdBy: {
          select: { id: true, displayName: true },
        },
      },
    });

    await tx.activityEvent.create({
      data: {
        groupId,
        actorId: userId,
        action: 'EXPENSE_CREATED',
        entityType: 'EXPENSE',
        entityId: expense.id,
        metadata: {
          description: expense.description,
          amountPaise: expense.amountPaise,
          splitMethod: expense.splitMethod,
        },
      },
    });

    return expense;
  });
}

export async function getExpense(groupId: string, expenseId: string, userId: string) {
  await verifyMembership(groupId, userId);

  const expense = await prisma.expense.findFirst({
    where: {
      id: expenseId,
      groupId,
      isDeleted: false,
    },
    include: {
      payers: {
        include: {
          user: { select: { id: true, displayName: true, email: true, avatarUrl: true } },
        },
      },
      splits: {
        include: {
          user: { select: { id: true, displayName: true, email: true, avatarUrl: true } },
        },
      },
      createdBy: {
        select: { id: true, displayName: true },
      },
    },
  });

  if (!expense) {
    throw new NotFoundError('Expense not found');
  }

  return expense;
}

export async function updateExpense(
  groupId: string,
  expenseId: string,
  userId: string,
  input: UpdateExpenseInput
) {
  const member = await verifyMembership(groupId, userId);

  const existingExpense = await prisma.expense.findFirst({
    where: { id: expenseId, groupId, isDeleted: false },
    include: { payers: true, splits: true },
  });

  if (!existingExpense) {
    throw new NotFoundError('Expense not found');
  }

  // Only creator or group owner/admin can edit expense
  if (existingExpense.createdById !== userId && member.role !== 'OWNER' && member.role !== 'ADMIN') {
    throw new AuthorizationError('Only expense creator or group admin can edit this expense');
  }

  const finalAmountPaise = input.amountPaise ?? existingExpense.amountPaise;
  const finalSplitMethod = input.splitMethod ?? existingExpense.splitMethod;

  let calculatedSplits: CalculatedSplit[] | null = null;
  if (input.splits !== undefined || input.amountPaise !== undefined || input.splitMethod !== undefined) {
    const rawSplits = input.splits ?? existingExpense.splits;
    calculatedSplits = calculateSplits(finalAmountPaise, finalSplitMethod, rawSplits);
  }

  return prisma.$transaction(async (tx) => {
    // If payers or splits changed, recreate them
    if (input.payers !== undefined) {
      await tx.expensePayer.deleteMany({ where: { expenseId } });
      await tx.expensePayer.createMany({
        data: input.payers.map((p) => ({
          expenseId,
          userId: p.userId,
          amountPaise: p.amountPaise,
        })),
      });
    }

    if (calculatedSplits !== null) {
      await tx.expenseSplit.deleteMany({ where: { expenseId } });
      await tx.expenseSplit.createMany({
        data: calculatedSplits.map((s) => ({
          expenseId,
          userId: s.userId,
          amountPaise: s.amountPaise,
          shareValue: s.shareValue ?? null,
        })),
      });
    }

    const updated = await tx.expense.update({
      where: { id: expenseId },
      data: {
        ...(input.description !== undefined && { description: input.description }),
        ...(input.amountPaise !== undefined && { amountPaise: input.amountPaise }),
        ...(input.expenseDate !== undefined && { expenseDate: input.expenseDate }),
        ...(input.category !== undefined && { category: input.category }),
        ...(input.splitMethod !== undefined && { splitMethod: input.splitMethod }),
        ...(input.notes !== undefined && { notes: input.notes }),
      },
      include: {
        payers: { include: { user: { select: { id: true, displayName: true } } } },
        splits: { include: { user: { select: { id: true, displayName: true } } } },
        createdBy: { select: { id: true, displayName: true } },
      },
    });

    await tx.activityEvent.create({
      data: {
        groupId,
        actorId: userId,
        action: 'EXPENSE_UPDATED',
        entityType: 'EXPENSE',
        entityId: expenseId,
        metadata: {
          description: updated.description,
          amountPaise: updated.amountPaise,
        },
      },
    });

    return updated;
  });
}

export async function deleteExpense(groupId: string, expenseId: string, userId: string) {
  const member = await verifyMembership(groupId, userId);

  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, groupId, isDeleted: false },
  });

  if (!expense) {
    throw new NotFoundError('Expense not found');
  }

  if (expense.createdById !== userId && member.role !== 'OWNER' && member.role !== 'ADMIN') {
    throw new AuthorizationError('Only expense creator or group admin can delete this expense');
  }

  // Soft delete to preserve balance and audit integrity
  await prisma.$transaction([
    prisma.expense.update({
      where: { id: expenseId },
      data: { isDeleted: true },
    }),
    prisma.activityEvent.create({
      data: {
        groupId,
        actorId: userId,
        action: 'EXPENSE_DELETED',
        entityType: 'EXPENSE',
        entityId: expenseId,
        metadata: {
          description: expense.description,
          amountPaise: expense.amountPaise,
        },
      },
    }),
  ]);

  return { message: 'Expense deleted successfully' };
}

export async function listExpenses(groupId: string, userId: string, query: ListExpensesQuery) {
  await verifyMembership(groupId, userId);

  const where = {
    groupId,
    isDeleted: false,
    ...(query.category ? { category: query.category } : {}),
    ...(query.search
      ? {
          OR: [
            { description: { contains: query.search, mode: 'insensitive' as const } },
            { notes: { contains: query.search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [total, expenses] = await Promise.all([
    prisma.expense.count({ where }),
    prisma.expense.findMany({
      where,
      include: {
        payers: {
          include: {
            user: { select: { id: true, displayName: true, avatarUrl: true } },
          },
        },
        splits: {
          include: {
            user: { select: { id: true, displayName: true, avatarUrl: true } },
          },
        },
        createdBy: {
          select: { id: true, displayName: true },
        },
      },
      orderBy: { expenseDate: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
  ]);

  return {
    expenses,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}
