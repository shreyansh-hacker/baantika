import { prisma } from '../../lib/prisma';
import {
  ValidationError,
  NotFoundError,
  AuthorizationError,
} from '../../lib/errors';
import { verifyMembership } from '../groups/service';
import { CreateSettlementInput, UpdateSettlementStatusInput } from './schema';

export async function createSettlement(groupId: string, userId: string, input: CreateSettlementInput) {
  await verifyMembership(groupId, userId);

  // Verify that payer and payee are active group members
  const members = await prisma.groupMember.findMany({
    where: {
      groupId,
      userId: { in: [input.payerId, input.payeeId] },
      removedAt: null,
    },
  });

  if (members.length < 2) {
    throw new ValidationError('Both payer and payee must be active members of this group');
  }

  return prisma.$transaction(async (tx) => {
    const settlement = await tx.settlement.create({
      data: {
        groupId,
        payerId: input.payerId,
        payeeId: input.payeeId,
        amountPaise: input.amountPaise,
        status: 'PENDING',
        createdById: userId,
        note: input.note ?? null,
      },
      include: {
        payer: { select: { id: true, displayName: true, avatarUrl: true } },
        payee: { select: { id: true, displayName: true, avatarUrl: true } },
        createdBy: { select: { id: true, displayName: true } },
      },
    });

    await tx.activityEvent.create({
      data: {
        groupId,
        actorId: userId,
        action: 'SETTLEMENT_CREATED',
        entityType: 'SETTLEMENT',
        entityId: settlement.id,
        metadata: {
          payerId: input.payerId,
          payeeId: input.payeeId,
          amountPaise: input.amountPaise,
          status: 'PENDING',
        },
      },
    });

    return settlement;
  });
}

export async function getSettlement(groupId: string, settlementId: string, userId: string) {
  await verifyMembership(groupId, userId);

  const settlement = await prisma.settlement.findFirst({
    where: { id: settlementId, groupId },
    include: {
      payer: { select: { id: true, displayName: true, avatarUrl: true, email: true } },
      payee: { select: { id: true, displayName: true, avatarUrl: true, email: true } },
      createdBy: { select: { id: true, displayName: true } },
      completedBy: { select: { id: true, displayName: true } },
    },
  });

  if (!settlement) {
    throw new NotFoundError('Settlement not found');
  }

  return settlement;
}

export async function updateSettlementStatus(
  groupId: string,
  settlementId: string,
  userId: string,
  input: UpdateSettlementStatusInput
) {
  const member = await verifyMembership(groupId, userId);

  const settlement = await prisma.settlement.findFirst({
    where: { id: settlementId, groupId },
  });

  if (!settlement) {
    throw new NotFoundError('Settlement not found');
  }

  // Idempotency: if already in requested state, return successfully
  if (settlement.status === input.status) {
    return settlement;
  }

  // Cannot transition from terminal states
  if (settlement.status === 'COMPLETED') {
    throw new ValidationError('A completed settlement cannot be altered');
  }
  if (settlement.status === 'CANCELLED') {
    throw new ValidationError('A cancelled settlement cannot be reopened');
  }

  // Permission checks
  if (input.status === 'COMPLETED') {
    // Only payer or payee can confirm completion
    if (userId !== settlement.payerId && userId !== settlement.payeeId) {
      throw new AuthorizationError('Only the payer or payee can mark a settlement as completed');
    }
  } else if (input.status === 'CANCELLED') {
    // Payer, payee, creator, or admin can cancel
    const isPayerOrPayee = userId === settlement.payerId || userId === settlement.payeeId;
    const isCreator = userId === settlement.createdById;
    const isAdmin = member.role === 'OWNER' || member.role === 'ADMIN';

    if (!isPayerOrPayee && !isCreator && !isAdmin) {
      throw new AuthorizationError('Insufficient permissions to cancel this settlement');
    }
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.settlement.update({
      where: { id: settlementId },
      data: {
        status: input.status,
        ...(input.status === 'COMPLETED'
          ? {
              completedById: userId,
              completedAt: new Date(),
            }
          : {}),
      },
      include: {
        payer: { select: { id: true, displayName: true } },
        payee: { select: { id: true, displayName: true } },
        completedBy: { select: { id: true, displayName: true } },
      },
    });

    await tx.activityEvent.create({
      data: {
        groupId,
        actorId: userId,
        action: input.status === 'COMPLETED' ? 'SETTLEMENT_COMPLETED' : 'SETTLEMENT_CANCELLED',
        entityType: 'SETTLEMENT',
        entityId: settlementId,
        metadata: {
          previousStatus: settlement.status,
          newStatus: input.status,
          amountPaise: settlement.amountPaise,
        },
      },
    });

    return updated;
  });
}

export async function listSettlements(groupId: string, userId: string) {
  await verifyMembership(groupId, userId);

  return prisma.settlement.findMany({
    where: { groupId },
    include: {
      payer: { select: { id: true, displayName: true, avatarUrl: true } },
      payee: { select: { id: true, displayName: true, avatarUrl: true } },
      createdBy: { select: { id: true, displayName: true } },
      completedBy: { select: { id: true, displayName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}
