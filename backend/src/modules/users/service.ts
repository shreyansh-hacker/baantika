import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../lib/errors';
import { UpdateProfileInput } from './schema';

/**
 * Get user profile by ID.
 */
export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId, isDeleted: false },
    select: {
      id: true,
      email: true,
      displayName: true,
      avatarUrl: true,
      currency: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
}

/**
 * Update user profile.
 */
export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const user = await prisma.user.findUnique({
    where: { id: userId, isDeleted: false },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.displayName !== undefined && { displayName: input.displayName }),
      ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl }),
      ...(input.currency !== undefined && { currency: input.currency }),
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      avatarUrl: true,
      currency: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updated;
}

/**
 * Soft delete account, anonymizing display name to 'Deleted User' and revoking sessions.
 */
export async function softDeleteAccount(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId, isDeleted: false },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        isDeleted: true,
        displayName: 'Deleted User',
        avatarUrl: null,
      },
    }),
    prisma.refreshSession.updateMany({
      where: { userId },
      data: { revoked: true },
    }),
  ]);

  return { message: 'Account deactivated and anonymized successfully' };
}

/**
 * Get dashboard data: total balance across all groups.
 */
export async function getDashboard(userId: string) {
  // Get all groups where user is an active member
  const memberships = await prisma.groupMember.findMany({
    where: { userId, removedAt: null },
    select: { groupId: true },
  });

  const groupIds = memberships.map((m) => m.groupId);

  if (groupIds.length === 0) {
    return {
      totalBalancePaise: 0,
      totalToReceivePaise: 0,
      totalOwedPaise: 0,
      groupCount: 0,
    };
  }

  // Total paid by user across all groups (non-deleted expenses)
  const paidResult = await prisma.expensePayer.aggregate({
    _sum: { amountPaise: true },
    where: {
      userId,
      expense: {
        groupId: { in: groupIds },
        isDeleted: false,
      },
    },
  });
  const totalPaid = paidResult._sum.amountPaise ?? 0;

  // Total owed by user across all groups (non-deleted expenses)
  const owedResult = await prisma.expenseSplit.aggregate({
    _sum: { amountPaise: true },
    where: {
      userId,
      expense: {
        groupId: { in: groupIds },
        isDeleted: false,
      },
    },
  });
  const totalOwed = owedResult._sum.amountPaise ?? 0;

  // Settlements received (completed, user is payee)
  const settlementsReceived = await prisma.settlement.aggregate({
    _sum: { amountPaise: true },
    where: {
      payeeId: userId,
      groupId: { in: groupIds },
      status: 'COMPLETED',
    },
  });
  const totalSettlementsReceived = settlementsReceived._sum.amountPaise ?? 0;

  // Settlements paid (completed, user is payer)
  const settlementsPaid = await prisma.settlement.aggregate({
    _sum: { amountPaise: true },
    where: {
      payerId: userId,
      groupId: { in: groupIds },
      status: 'COMPLETED',
    },
  });
  const totalSettlementsPaid = settlementsPaid._sum.amountPaise ?? 0;

  // Net balance = totalPaid - totalOwed + settlementsReceived - settlementsPaid
  const netBalance = totalPaid - totalOwed + totalSettlementsReceived - totalSettlementsPaid;

  const totalToReceive = netBalance > 0 ? netBalance : 0;
  const totalOwedAmount = netBalance < 0 ? Math.abs(netBalance) : 0;

  return {
    totalBalancePaise: netBalance,
    totalToReceivePaise: totalToReceive,
    totalOwedPaise: totalOwedAmount,
    groupCount: groupIds.length,
  };
}
