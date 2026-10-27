import { apiClient } from './client';
import {
  User,
  AuthTokens,
  Group,
  Expense,
  MemberBalance,
  SettlementSuggestion,
  Settlement,
  ActivityEvent,
  DashboardSummary,
  Invitation,
  SplitMethod,
} from '../types';

// ==================== AUTH ====================
export async function registerApi(data: {
  email: string;
  password: string;
  displayName: string;
}): Promise<{ user: User; tokens: AuthTokens }> {
  const res = await apiClient.post('/api/v1/auth/register', data);
  return res.data.data;
}

export async function loginApi(data: {
  email: string;
  password: string;
}): Promise<{ user: User; tokens: AuthTokens }> {
  const res = await apiClient.post('/api/v1/auth/login', data);
  return res.data.data;
}

export async function logoutApi(refreshToken: string): Promise<void> {
  await apiClient.post('/api/v1/auth/logout', { refreshToken });
}

// ==================== USERS ====================
export async function getProfileApi(): Promise<User> {
  const res = await apiClient.get('/api/v1/users/me');
  return res.data.data;
}

export async function updateProfileApi(data: {
  displayName?: string;
  avatarUrl?: string | null;
  currency?: string;
}): Promise<User> {
  const res = await apiClient.patch('/api/v1/users/me', data);
  return res.data.data;
}

export async function deleteAccountApi(): Promise<void> {
  await apiClient.delete('/api/v1/users/me');
}

export async function getDashboardApi(): Promise<DashboardSummary> {
  const res = await apiClient.get('/api/v1/users/me/dashboard');
  return res.data.data;
}

// ==================== GROUPS ====================
export async function listGroupsApi(): Promise<Group[]> {
  const res = await apiClient.get('/api/v1/groups');
  return res.data.data;
}

export async function createGroupApi(data: {
  name: string;
  description?: string | null;
  currency?: string;
}): Promise<Group> {
  const res = await apiClient.post('/api/v1/groups', data);
  return res.data.data;
}

export async function getGroupApi(groupId: string): Promise<Group> {
  const res = await apiClient.get(`/api/v1/groups/${groupId}`);
  return res.data.data;
}

export async function updateGroupApi(
  groupId: string,
  data: { name?: string; description?: string | null; currency?: string }
): Promise<Group> {
  const res = await apiClient.patch(`/api/v1/groups/${groupId}`, data);
  return res.data.data;
}

export async function addMemberApi(
  groupId: string,
  email: string,
  role: 'ADMIN' | 'MEMBER' = 'MEMBER'
): Promise<any> {
  const res = await apiClient.post(`/api/v1/groups/${groupId}/members`, { email, role });
  return res.data.data;
}

export async function removeMemberApi(groupId: string, userId: string): Promise<void> {
  await apiClient.delete(`/api/v1/groups/${groupId}/members/${userId}`);
}

export async function createInvitationApi(
  groupId: string,
  inviteEmail?: string
): Promise<Invitation> {
  const res = await apiClient.post(`/api/v1/groups/${groupId}/invitations`, { inviteEmail });
  return res.data.data;
}

export async function acceptInvitationApi(inviteCode: string): Promise<any> {
  const res = await apiClient.post(`/api/v1/groups/invitations/${inviteCode}/accept`);
  return res.data.data;
}

// ==================== EXPENSES ====================
export async function listExpensesApi(
  groupId: string,
  page = 1,
  limit = 20,
  category?: string
): Promise<{ expenses: Expense[]; pagination: any }> {
  const res = await apiClient.get(`/api/v1/groups/${groupId}/expenses`, {
    params: { page, limit, category },
  });
  return { expenses: res.data.data, pagination: res.data.pagination };
}

export async function getExpenseApi(groupId: string, expenseId: string): Promise<Expense> {
  const res = await apiClient.get(`/api/v1/groups/${groupId}/expenses/${expenseId}`);
  return res.data.data;
}

export async function createExpenseApi(
  groupId: string,
  data: {
    description: string;
    amountPaise: number;
    expenseDate: string;
    category?: string | null;
    splitMethod: SplitMethod;
    payers: { userId: string; amountPaise: number }[];
    splits: { userId: string; amountPaise?: number; percentage?: number; shares?: number }[];
    notes?: string | null;
    idempotencyKey?: string;
  }
): Promise<Expense> {
  const res = await apiClient.post(`/api/v1/groups/${groupId}/expenses`, data);
  return res.data.data;
}

export async function updateExpenseApi(
  groupId: string,
  expenseId: string,
  data: {
    description?: string;
    amountPaise?: number;
    expenseDate?: string;
    category?: string | null;
    splitMethod?: SplitMethod;
    payers?: { userId: string; amountPaise: number }[];
    splits?: { userId: string; amountPaise?: number; percentage?: number; shares?: number }[];
    notes?: string | null;
  }
): Promise<Expense> {
  const res = await apiClient.patch(`/api/v1/groups/${groupId}/expenses/${expenseId}`, data);
  return res.data.data;
}

export async function deleteExpenseApi(groupId: string, expenseId: string): Promise<void> {
  await apiClient.delete(`/api/v1/groups/${groupId}/expenses/${expenseId}`);
}

// ==================== BALANCES & SETTLEMENTS ====================
export async function getGroupBalancesApi(groupId: string): Promise<{
  balances: MemberBalance[];
  integrityCheck: boolean;
  groupTotalExpensesPaise: number;
}> {
  const res = await apiClient.get(`/api/v1/groups/${groupId}/balances`);
  return res.data.data;
}

export async function getSettlementSuggestionsApi(
  groupId: string
): Promise<{ suggestions: SettlementSuggestion[]; disclaimer: string }> {
  const res = await apiClient.get(`/api/v1/groups/${groupId}/balances/suggestions`);
  return res.data.data;
}

export async function listSettlementsApi(groupId: string): Promise<Settlement[]> {
  const res = await apiClient.get(`/api/v1/groups/${groupId}/settlements`);
  return res.data.data;
}

export async function getSettlementApi(groupId: string, settlementId: string): Promise<Settlement> {
  const res = await apiClient.get(`/api/v1/groups/${groupId}/settlements/${settlementId}`);
  return res.data.data;
}

export async function createSettlementApi(
  groupId: string,
  data: {
    payerId: string;
    payeeId: string;
    amountPaise: number;
    note?: string | null;
  }
): Promise<Settlement> {
  const res = await apiClient.post(`/api/v1/groups/${groupId}/settlements`, data);
  return res.data.data;
}

export async function updateSettlementStatusApi(
  groupId: string,
  settlementId: string,
  status: 'COMPLETED' | 'CANCELLED'
): Promise<Settlement> {
  const res = await apiClient.patch(`/api/v1/groups/${groupId}/settlements/${settlementId}`, { status });
  return res.data.data;
}

// ==================== ACTIVITY ====================
export async function getGroupActivityApi(
  groupId: string,
  page = 1,
  limit = 30
): Promise<{ events: ActivityEvent[]; pagination: any }> {
  const res = await apiClient.get(`/api/v1/groups/${groupId}/activity`, {
    params: { page, limit },
  });
  return { events: res.data.data, pagination: res.data.pagination };
}

export async function getUserActivityApi(
  page = 1,
  limit = 30
): Promise<{ events: ActivityEvent[]; pagination: any }> {
  const res = await apiClient.get('/api/v1/activity/me', {
    params: { page, limit },
  });
  return { events: res.data.data, pagination: res.data.pagination };
}
