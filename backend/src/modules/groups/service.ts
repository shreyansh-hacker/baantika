import crypto from 'crypto';
import { prisma } from '../../lib/prisma';
import {
  NotFoundError,
  AuthorizationError,
  ConflictError,
  ValidationError,
} from '../../lib/errors';
import {
  CreateGroupInput,
  UpdateGroupInput,
  AddMemberInput,
  CreateInvitationInput,
} from './schema';

export async function verifyMembership(groupId: string, userId: string) {
  const member = await prisma.groupMember.findFirst({
    where: {
      groupId,
      userId,
      removedAt: null,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
  });

  if (!member) {
    throw new AuthorizationError('You are not a member of this group');
  }

  return member;
}

export async function verifyAdminAccess(groupId: string, userId: string) {
  const member = await verifyMembership(groupId, userId);
  if (member.role !== 'OWNER' && member.role !== 'ADMIN') {
    throw new AuthorizationError('Admin or owner permissions required');
  }
  return member;
}

export async function createGroup(userId: string, input: CreateGroupInput) {
  return prisma.$transaction(async (tx) => {
    const group = await tx.group.create({
      data: {
        name: input.name,
        description: input.description,
        currency: input.currency ?? 'INR',
        createdById: userId,
      },
    });

    await tx.groupMember.create({
      data: {
        groupId: group.id,
        userId,
        role: 'OWNER',
      },
    });

    await tx.activityEvent.create({
      data: {
        groupId: group.id,
        actorId: userId,
        action: 'GROUP_CREATED',
        entityType: 'GROUP',
        entityId: group.id,
        metadata: { groupName: group.name },
      },
    });

    return group;
  });
}

export async function listGroups(userId: string) {
  const members = await prisma.groupMember.findMany({
    where: {
      userId,
      removedAt: null,
      group: { archived: false },
    },
    include: {
      group: {
        include: {
          members: {
            where: { removedAt: null },
            include: {
              user: {
                select: {
                  id: true,
                  displayName: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
          },
          _count: {
            select: {
              expenses: { where: { isDeleted: false } },
            },
          },
        },
      },
    },
    orderBy: {
      joinedAt: 'desc',
    },
  });

  return members.map((m) => ({
    ...m.group,
    role: m.role,
    joinedAt: m.joinedAt,
    memberCount: m.group.members.length,
    expenseCount: m.group._count.expenses,
  }));
}

export async function getGroup(groupId: string, userId: string) {
  await verifyMembership(groupId, userId);

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        where: { removedAt: null },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              displayName: true,
              avatarUrl: true,
              currency: true,
            },
          },
        },
      },
      createdBy: {
        select: {
          id: true,
          displayName: true,
        },
      },
    },
  });

  if (!group || group.archived) {
    throw new NotFoundError('Group not found');
  }

  return group;
}

export async function updateGroup(groupId: string, userId: string, input: UpdateGroupInput) {
  await verifyAdminAccess(groupId, userId);

  const updated = await prisma.group.update({
    where: { id: groupId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.currency !== undefined && { currency: input.currency }),
    },
  });

  await prisma.activityEvent.create({
    data: {
      groupId,
      actorId: userId,
      action: 'GROUP_UPDATED',
      entityType: 'GROUP',
      entityId: groupId,
      metadata: input,
    },
  });

  return updated;
}

export async function addMember(groupId: string, userId: string, input: AddMemberInput) {
  await verifyAdminAccess(groupId, userId);

  const targetUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!targetUser || targetUser.isDeleted) {
    throw new NotFoundError('No registered user found with this email. You can generate an invite link for them.');
  }

  const existingMember = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId: targetUser.id,
      },
    },
  });

  if (existingMember && !existingMember.removedAt) {
    throw new ConflictError('User is already a member of this group');
  }

  const member = existingMember
    ? await prisma.groupMember.update({
        where: { id: existingMember.id },
        data: {
          removedAt: null,
          role: input.role,
        },
        include: { user: true },
      })
    : await prisma.groupMember.create({
        data: {
          groupId,
          userId: targetUser.id,
          role: input.role,
        },
        include: { user: true },
      });

  await prisma.activityEvent.create({
    data: {
      groupId,
      actorId: userId,
      action: 'MEMBER_ADDED',
      entityType: 'USER',
      entityId: targetUser.id,
      metadata: {
        targetName: targetUser.displayName,
        targetEmail: targetUser.email,
        role: input.role,
      },
    },
  });

  return member;
}

export async function removeMember(groupId: string, userId: string, targetUserId: string) {
  const actor = await verifyMembership(groupId, userId);

  // Only OWNER can remove other members, or user can remove themselves (leave)
  if (actor.userId !== targetUserId && actor.role !== 'OWNER') {
    throw new AuthorizationError('Only group owner can remove other members');
  }

  // Check if target is the last owner
  if (actor.userId === targetUserId && actor.role === 'OWNER') {
    const ownerCount = await prisma.groupMember.count({
      where: { groupId, role: 'OWNER', removedAt: null },
    });
    if (ownerCount <= 1) {
      throw new ValidationError('Group owner cannot leave without transferring ownership');
    }
  }

  const targetMember = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId: targetUserId,
      },
    },
  });

  if (!targetMember || targetMember.removedAt) {
    throw new NotFoundError('Member not found in group');
  }

  await prisma.groupMember.update({
    where: { id: targetMember.id },
    data: { removedAt: new Date() },
  });

  await prisma.activityEvent.create({
    data: {
      groupId,
      actorId: userId,
      action: actor.userId === targetUserId ? 'MEMBER_LEFT' : 'MEMBER_REMOVED',
      entityType: 'USER',
      entityId: targetUserId,
    },
  });

  return { message: 'Member removed successfully' };
}

export async function createInvitation(groupId: string, userId: string, input: CreateInvitationInput) {
  await verifyAdminAccess(groupId, userId);

  const inviteCode = crypto.randomBytes(6).toString('hex').toUpperCase(); // 12-char clean alphanumeric
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7-day expiry

  const invitation = await prisma.invitation.create({
    data: {
      groupId,
      invitedById: userId,
      inviteEmail: input.inviteEmail ?? null,
      inviteCode,
      expiresAt,
    },
    include: {
      group: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  await prisma.activityEvent.create({
    data: {
      groupId,
      actorId: userId,
      action: 'INVITATION_CREATED',
      entityType: 'INVITATION',
      entityId: invitation.id,
      metadata: { inviteCode, inviteEmail: input.inviteEmail },
    },
  });

  return invitation;
}

export async function acceptInvitation(inviteCode: string, userId: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { inviteCode },
    include: { group: true },
  });

  if (!invitation) {
    throw new NotFoundError('Invalid invitation code');
  }

  if (invitation.status !== 'PENDING') {
    throw new ValidationError(`Invitation is already ${invitation.status.toLowerCase()}`);
  }

  if (invitation.expiresAt < new Date()) {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'EXPIRED' },
    });
    throw new ValidationError('Invitation code has expired');
  }

  // Check if user is already a member
  const existingMember = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId: invitation.groupId,
        userId,
      },
    },
  });

  if (existingMember && !existingMember.removedAt) {
    throw new ConflictError('You are already a member of this group');
  }

  return prisma.$transaction(async (tx) => {
    const member = existingMember
      ? await tx.groupMember.update({
          where: { id: existingMember.id },
          data: { removedAt: null, role: 'MEMBER' },
        })
      : await tx.groupMember.create({
          data: {
            groupId: invitation.groupId,
            userId,
            role: 'MEMBER',
          },
        });

    await tx.invitation.update({
      where: { id: invitation.id },
      data: { status: 'ACCEPTED' },
    });

    const user = await tx.user.findUnique({ where: { id: userId } });

    await tx.activityEvent.create({
      data: {
        groupId: invitation.groupId,
        actorId: userId,
        action: 'INVITATION_ACCEPTED',
        entityType: 'USER',
        entityId: userId,
        metadata: {
          userName: user?.displayName,
          inviteCode,
        },
      },
    });

    return {
      message: 'Joined group successfully',
      group: invitation.group,
      member,
    };
  });
}
