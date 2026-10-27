// Baantika Shared Mobile Types

export type SplitMethod = 'EQUAL' | 'EXACT' | 'PERCENTAGE' | 'SHARES';
export type GroupRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type SettlementStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  currency: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: GroupRole;
  joinedAt: string;
  removedAt: string | null;
  user: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
    currency?: string;
  };
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  currency: string;
  createdById: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  role?: GroupRole;
  memberCount?: number;
  expenseCount?: number;
  members?: GroupMember[];
  createdBy?: {
    id: string;
    displayName: string;
  };
}

export interface ExpensePayer {
  id: string;
  expenseId: string;
  userId: string;
  amountPaise: number;
  user?: {
    id: string;
    displayName: string;
    email?: string;
    avatarUrl?: string | null;
  };
}

export interface ExpenseSplit {
  id: string;
  expenseId: string;
  userId: string;
  amountPaise: number;
  shareValue: number | null;
  user?: {
    id: string;
    displayName: string;
    email?: string;
    avatarUrl?: string | null;
  };
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amountPaise: number;
  expenseDate: string;
  category: string | null;
  splitMethod: SplitMethod;
  createdById: string;
  notes: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  payers: ExpensePayer[];
  splits: ExpenseSplit[];
  createdBy?: {
    id: string;
    displayName: string;
  };
}

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

export interface Settlement {
  id: string;
  groupId: string;
  payerId: string;
  payeeId: string;
  amountPaise: number;
  status: SettlementStatus;
  createdById: string;
  completedById: string | null;
  note: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  payer: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
    email?: string;
  };
  payee: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
    email?: string;
  };
  createdBy: {
    id: string;
    displayName: string;
  };
  completedBy?: {
    id: string;
    displayName: string;
  } | null;
}

export interface ActivityEvent {
  id: string;
  groupId: string | null;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata?: any;
  createdAt: string;
  actor: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
  };
  group?: {
    id: string;
    name: string;
  };
}

export interface DashboardSummary {
  totalNetBalancePaise: number;
  totalToReceivePaise: number;
  totalOwedPaise: number;
  groups: {
    groupId: string;
    groupName: string;
    currency: string;
    netBalancePaise: number;
  }[];
  recentActivity: ActivityEvent[];
}

export interface Invitation {
  id: string;
  groupId: string;
  invitedById: string;
  inviteEmail: string | null;
  inviteCode: string;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
  group?: {
    id: string;
    name: string;
  };
}

// Navigation Types
export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
  GroupDetail: { groupId: string; groupName: string };
  AddExpense: { groupId: string; expenseId?: string };
  ExpenseDetail: { groupId: string; expenseId: string };
  ManageMembers: { groupId: string; groupName: string };
  CreateSettlement: {
    groupId: string;
    payerId?: string;
    payeeId?: string;
    amountPaise?: number;
  };
  SettlementDetail: { groupId: string; settlementId: string };
  CreateGroup: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Groups: undefined;
  Activity: undefined;
  Profile: undefined;
};
