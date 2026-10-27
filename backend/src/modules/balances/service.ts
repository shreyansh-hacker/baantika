import { prisma } from '../../lib/prisma';
import { verifyMembership } from '../groups/service';
import { logger } from '../../lib/logger';
import { AppError } from '../../lib/errors';

export interface MemberBalance {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  totalPaidPaise: number;
  totalOwedPaise: number;
  settlementsPaidPaise: number;
  settlementsReceivedPaise: number;
  netBalancePaise: number;
}

export interface SettlementSuggestion {
  fromUserId: string;
  fromDisplayName: string;
  toUserId: string;
  toDisplayName: string;
  amountPaise: number;
}

/**
 * Computes all member net balances for a group.
 * Verifies the financial integrity invariant: sum(netBalances) === 0.
 */
export async function getGroupBalances(groupId: string, userId: string): Promise<{
  balances: MemberBalance[];
  integrityCheck: boolean;
  groupTotalExpensesPaise: number;
}> {
  await verifyMembership(groupId, userId);

  // Get all active members of the group
  const members = await prisma.groupMember.findMany({
    where: { groupId, removedAt: null },
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
  });

  // Get sum paid per member for non-deleted expenses
  const paidByMember = await prisma.expensePayer.groupBy({
    by: ['userId'],
    where: {
      expense: {
        groupId,
        isDeleted: false,
      },
    },
    _sum: {
      amountPaise: true,
    },
  });

  const paidMap = new Map<string, number>();
  let groupTotalExpensesPaise = 0;
  for (const p of paidByMember) {
    const amt = p._sum.amountPaise ?? 0;
    paidMap.set(p.userId, amt);
    groupTotalExpensesPaise += amt;
  }

  // Get sum owed per member for non-deleted expenses
  const owedByMember = await prisma.expenseSplit.groupBy({
    by: ['userId'],
    where: {
      expense: {
        groupId,
        isDeleted: false,
      },
    },
    _sum: {
      amountPaise: true,
    },
  });

  const owedMap = new Map<string, number>();
  for (const o of owedByMember) {
    owedMap.set(o.userId, o._sum.amountPaise ?? 0);
  }

  // Get completed settlements paid out by member (settlement payer = paid back debt)
  const settlementsPaid = await prisma.settlement.groupBy({
    by: ['payerId'],
    where: {
      groupId,
      status: 'COMPLETED',
    },
    _sum: {
      amountPaise: true,
    },
  });

  const sPaidMap = new Map<string, number>();
  for (const s of settlementsPaid) {
    sPaidMap.set(s.payerId, s._sum.amountPaise ?? 0);
  }

  // Get completed settlements received by member (settlement payee = credit satisfied)
  const settlementsReceived = await prisma.settlement.groupBy({
    by: ['payeeId'],
    where: {
      groupId,
      status: 'COMPLETED',
    },
    _sum: {
      amountPaise: true,
    },
  });

  const sRecvMap = new Map<string, number>();
  for (const s of settlementsReceived) {
    sRecvMap.set(s.payeeId, s._sum.amountPaise ?? 0);
  }

  // Build balance objects for all members
  let sumOfAllNetBalances = 0;
  const balances: MemberBalance[] = members.map((m) => {
    const totalPaidPaise = paidMap.get(m.userId) ?? 0;
    const totalOwedPaise = owedMap.get(m.userId) ?? 0;
    const settlementsPaidPaise = sPaidMap.get(m.userId) ?? 0;
    const settlementsReceivedPaise = sRecvMap.get(m.userId) ?? 0;

    // Net balance = (totalPaid - totalOwed) + settlementsPaid - settlementsReceived
    // Positive means group owes member. Negative means member owes group.
    const netBalancePaise =
      totalPaidPaise - totalOwedPaise + settlementsPaidPaise - settlementsReceivedPaise;

    sumOfAllNetBalances += netBalancePaise;

    return {
      userId: m.userId,
      displayName: m.user.displayName,
      avatarUrl: m.user.avatarUrl,
      totalPaidPaise,
      totalOwedPaise,
      settlementsPaidPaise,
      settlementsReceivedPaise,
      netBalancePaise,
    };
  });

  // Financial integrity check: sum of all net balances in a closed group ledger must equal 0
  if (sumOfAllNetBalances !== 0) {
    logger.error(
      { groupId, sumOfAllNetBalances, balances },
      'Financial integrity invariant violated: sum of net balances does not equal zero'
    );
    throw new AppError(
      `Ledger integrity check failed: sum of group net balances is ${sumOfAllNetBalances} paise instead of 0`,
      500,
      false
    );
  }

  return {
    balances,
    integrityCheck: true,
    groupTotalExpensesPaise,
  };
}

/**
 * Pure function: Deterministic Greedy Settlement Suggestion Algorithm.
 * Minimizes unnecessary transactions.
 * Balances must sum to 0.
 */
export function computeSettlementSuggestions(
  balances: { userId: string; displayName: string; netBalancePaise: number }[]
): SettlementSuggestion[] {
  // Creditors: netBalance > 0
  const creditors = balances
    .filter((b) => b.netBalancePaise > 0)
    .map((b) => ({ ...b, remaining: b.netBalancePaise }))
    .sort((a, b) => b.remaining - a.remaining || a.userId.localeCompare(b.userId));

  // Debtors: netBalance < 0
  const debtors = balances
    .filter((b) => b.netBalancePaise < 0)
    .map((b) => ({ ...b, remaining: Math.abs(b.netBalancePaise) }))
    .sort((a, b) => b.remaining - a.remaining || a.userId.localeCompare(b.userId));

  const suggestions: SettlementSuggestion[] = [];
  let cIdx = 0;
  let dIdx = 0;

  while (cIdx < creditors.length && dIdx < debtors.length) {
    const creditor = creditors[cIdx];
    const debtor = debtors[dIdx];

    const transfer = Math.min(creditor.remaining, debtor.remaining);

    if (transfer > 0) {
      suggestions.push({
        fromUserId: debtor.userId,
        fromDisplayName: debtor.displayName,
        toUserId: creditor.userId,
        toDisplayName: creditor.displayName,
        amountPaise: transfer,
      });

      creditor.remaining -= transfer;
      debtor.remaining -= transfer;
    }

    if (creditor.remaining === 0) {
      cIdx++;
    }
    if (debtor.remaining === 0) {
      dIdx++;
    }
  }

  return suggestions;
}

export async function getSettlementSuggestions(groupId: string, userId: string) {
  const { balances } = await getGroupBalances(groupId, userId);
  const suggestions = computeSettlementSuggestions(balances);

  return {
    suggestions,
    disclaimer: 'Status is based on user confirmation; Baantika does not verify actual money transfers.',
  };
}
