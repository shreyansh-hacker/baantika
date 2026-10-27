import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { getDashboardApi } from '../api/endpoints';
import { DashboardSummary } from '../types';
import {
  Card,
  CurrencyText,
  Button,
  Icon,
  EmptyState,
  ErrorState,
} from '../components/common';

export function DashboardScreen({ navigation }: any) {
  const theme = useTheme();
  const { user } = useAuth();

  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setError(null);
      const data = await getDashboardApi();
      setDashboard(data);
    } catch (err: any) {
      setError(err.message || 'Unable to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary[900]} />
        <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
          Loading your balances...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ErrorState message={error} onRetry={fetchDashboard} />
      </View>
    );
  }

  const netBalance = dashboard?.totalNetBalancePaise ?? 0;
  const toReceive = dashboard?.totalToReceivePaise ?? 0;
  const toOwe = dashboard?.totalOwedPaise ?? 0;
  const groups = dashboard?.groups ?? [];
  const recentActivity = dashboard?.recentActivity ?? [];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Top Welcome Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={[styles.greeting, { color: theme.colors.text.secondary }]}>
            Namaste,
          </Text>
          <Text style={[styles.userName, { color: theme.colors.text.primary }]}>
            {user?.displayName ?? 'Friend'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('Profile')}
          style={[
            styles.avatarBadge,
            { backgroundColor: theme.colors.primary[900] },
          ]}
        >
          <Text style={styles.avatarInitial}>
            {user?.displayName?.charAt(0).toUpperCase() ?? 'U'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Net Balance Hero Card */}
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: theme.colors.primary[900],
            borderRadius: theme.radii.xl,
          },
        ]}
      >
        <Text style={styles.heroLabel}>Total Net Balance</Text>
        <CurrencyText
          amountPaise={netBalance}
          size="display"
          type="balance"
          style={{ color: netBalance >= 0 ? '#81C784' : '#FF8A80' }}
        />
        <Text style={styles.heroSubtext}>
          {netBalance > 0
            ? 'Overall, groups owe you money'
            : netBalance < 0
            ? 'Overall, you owe money to groups'
            : 'You are completely settled up! 🎉'}
        </Text>

        {/* Receive / Owe Sub-row */}
        <View style={styles.heroSubRow}>
          <View style={styles.heroSubCol}>
            <Text style={styles.subColLabel}>You are owed</Text>
            <CurrencyText
              amountPaise={toReceive}
              size="medium"
              style={{ color: '#81C784' }}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.heroSubCol}>
            <Text style={styles.subColLabel}>You owe</Text>
            <CurrencyText
              amountPaise={toOwe}
              size="medium"
              style={{ color: '#FF8A80' }}
            />
          </View>
        </View>
      </View>

      {/* Quick Actions Row */}
      <View style={styles.quickActionsRow}>
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: theme.colors.surface }]}
          onPress={() => navigation.navigate('CreateGroup')}
        >
          <View
            style={[
              styles.actionIconCircle,
              { backgroundColor: theme.colors.accent[100] },
            ]}
          >
            <Icon name="plus" size={20} color={theme.colors.accent[700]} />
          </View>
          <Text style={[styles.actionCardText, { color: theme.colors.text.primary }]}>
            New Group
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: theme.colors.surface }]}
          onPress={() => {
            if (groups.length > 0) {
              navigation.navigate('AddExpense', { groupId: groups[0].groupId });
            } else {
              navigation.navigate('CreateGroup');
            }
          }}
        >
          <View
            style={[
              styles.actionIconCircle,
              { backgroundColor: theme.colors.primary[100] },
            ]}
          >
            <Icon name="receipt" size={20} color={theme.colors.primary[800]} />
          </View>
          <Text style={[styles.actionCardText, { color: theme.colors.text.primary }]}>
            Add Expense
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: theme.colors.surface }]}
          onPress={() => navigation.navigate('Groups')}
        >
          <View
            style={[
              styles.actionIconCircle,
              { backgroundColor: theme.colors.neutral[200] },
            ]}
          >
            <Icon name="group" size={20} color={theme.colors.neutral[800]} />
          </View>
          <Text style={[styles.actionCardText, { color: theme.colors.text.primary }]}>
            All Groups
          </Text>
        </TouchableOpacity>
      </View>

      {/* Your Groups Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Your Groups ({groups.length})
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Groups')}>
            <Text style={[styles.viewAllText, { color: theme.colors.accent[600] }]}>
              View All
            </Text>
          </TouchableOpacity>
        </View>

        {groups.length === 0 ? (
          <EmptyState
            icon="group"
            title="No Groups Yet"
            description="Create or join a group with flatmates, friends, or trip companions to start sharing."
            actionTitle="Create Your First Group"
            onAction={() => navigation.navigate('CreateGroup')}
          />
        ) : (
          groups.map((g) => (
            <Card
              key={g.groupId}
              onPress={() =>
                navigation.navigate('GroupDetail', {
                  groupId: g.groupId,
                  groupName: g.groupName,
                })
              }
            >
              <View style={styles.groupCardContent}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.groupName, { color: theme.colors.text.primary }]}
                  >
                    {g.groupName}
                  </Text>
                  <Text
                    style={[styles.groupSub, { color: theme.colors.text.secondary }]}
                  >
                    {g.currency} Group
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <CurrencyText
                    amountPaise={g.netBalancePaise}
                    type="balance"
                    size="medium"
                  />
                  <Text
                    style={[
                      styles.balanceLabel,
                      {
                        color:
                          g.netBalancePaise > 0
                            ? theme.colors.success[700]
                            : g.netBalancePaise < 0
                            ? theme.colors.error[600]
                            : theme.colors.text.secondary,
                      },
                    ]}
                  >
                    {g.netBalancePaise > 0
                      ? 'you are owed'
                      : g.netBalancePaise < 0
                      ? 'you owe'
                      : 'settled'}
                  </Text>
                </View>
              </View>
            </Card>
          ))
        )}
      </View>

      {/* Recent Activity Section */}
      {recentActivity.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Recent Activity
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Activity')}>
              <Text style={[styles.viewAllText, { color: theme.colors.accent[600] }]}>
                Full History
              </Text>
            </TouchableOpacity>
          </View>

          {recentActivity.slice(0, 5).map((item) => (
            <View
              key={item.id}
              style={[
                styles.activityRow,
                { borderBottomColor: theme.colors.border },
              ]}
            >
              <View
                style={[
                  styles.activityIconCircle,
                  { backgroundColor: theme.colors.neutral[100] },
                ]}
              >
                <Icon
                  name={
                    item.action.includes('EXPENSE')
                      ? 'receipt'
                      : item.action.includes('SETTLEMENT')
                      ? 'check-circle'
                      : 'group'
                  }
                  size={16}
                  color={theme.colors.primary[800]}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.activityAction, { color: theme.colors.text.primary }]}
                >
                  <Text style={{ fontWeight: '700' }}>
                    {item.actor.displayName}{' '}
                  </Text>
                  {formatActivityAction(item.action, item.metadata)}
                </Text>
                {item.group && (
                  <Text
                    style={[styles.activityGroup, { color: theme.colors.text.secondary }]}
                  >
                    in {item.group.name}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function formatActivityAction(action: string, metadata?: any): string {
  switch (action) {
    case 'EXPENSE_CREATED':
      return `added "${metadata?.description ?? 'an expense'}"`;
    case 'EXPENSE_UPDATED':
      return `updated "${metadata?.description ?? 'an expense'}"`;
    case 'EXPENSE_DELETED':
      return `deleted "${metadata?.description ?? 'an expense'}"`;
    case 'SETTLEMENT_CREATED':
      return 'recorded a settlement';
    case 'SETTLEMENT_COMPLETED':
      return 'confirmed settlement completion';
    case 'MEMBER_ADDED':
      return `added ${metadata?.targetName ?? 'a new member'}`;
    case 'INVITATION_ACCEPTED':
      return 'joined the group';
    default:
      return action.replace(/_/g, ' ').toLowerCase();
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
  },
  avatarBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  heroCard: {
    padding: 24,
    marginBottom: 20,
    elevation: 4,
  },
  heroLabel: {
    color: '#C5CAD9',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  heroSubtext: {
    color: '#E0DED8',
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
  heroSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  heroSubCol: {
    flex: 1,
  },
  subColLabel: {
    color: '#C5CAD9',
    fontSize: 12,
    marginBottom: 2,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 16,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0DED8',
  },
  actionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionCardText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  groupCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  groupSub: {
    fontSize: 12,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 12,
  },
  activityIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityAction: {
    fontSize: 13,
  },
  activityGroup: {
    fontSize: 11,
    marginTop: 1,
  },
});
