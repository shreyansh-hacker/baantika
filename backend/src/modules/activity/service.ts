import { prisma } from '../../lib/prisma';
import { verifyMembership } from '../groups/service';

export async function logActivity(
  groupId: string | null,
  actorId: string,
  action: string,
  entityType: string,
  entityId?: string,
  metadata?: Record<string, unknown>
) {
  return prisma.activityEvent.create({
    data: {
      groupId,
      actorId,
      action,
      entityType,
      entityId: entityId ?? null,
      metadata: metadata ? (metadata as any) : undefined,
    },
  });
}

export async function getGroupActivity(
  groupId: string,
  userId: string,
  pagination: { page: number; limit: number }
) {
  await verifyMembership(groupId, userId);

  const where = { groupId };

  const [total, events] = await Promise.all([
    prisma.activityEvent.count({ where }),
    prisma.activityEvent.findMany({
      where,
      include: {
        actor: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    }),
  ]);

  return {
    events,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
}

export async function getUserActivity(
  userId: string,
  pagination: { page: number; limit: number }
) {
  // Find all groups user belongs to
  const memberships = await prisma.groupMember.findMany({
    where: { userId, removedAt: null },
    select: { groupId: true },
  });

  const groupIds = memberships.map((m) => m.groupId);

  const where = {
    OR: [
      { groupId: { in: groupIds } },
      { actorId: userId },
    ],
  };

  const [total, events] = await Promise.all([
    prisma.activityEvent.count({ where }),
    prisma.activityEvent.findMany({
      where,
      include: {
        actor: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    }),
  ]);

  return {
    events,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
}
