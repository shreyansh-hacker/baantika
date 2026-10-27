import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useTheme } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import {
  getGroupApi,
  listExpensesApi,
  getGroupBalancesApi,
  getSettlementSuggestionsApi,
  listSettlementsApi,
  updateSettlementStatusApi,
} from '../api/endpoints';
import {
  Group,
  Expense,
  MemberBalance,
  SettlementSuggestion,
  Settlement,
} from '../types';
import {
  Card,
  CurrencyText,
  Badge,
  Button,
  Icon,
  Header,
  EmptyState,
  ConfirmationModal,
} from '../components/common';

type TabKey = 'expenses' | 'balances' | 'settlements' | 'members';

export function GroupDetailScreen({ route, navigation }: any) {
  const { groupId, groupName } = route.params;
  const theme = useTheme();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<TabKey>('expenses');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Group Data
  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<MemberBalance[]>([]);
  const [suggestions, setSuggestions] = useState<SettlementSuggestion[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [groupTotalSpent, setGroupTotalSpent] = useState(0);

  // Settlement completion modal state
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadAllGroupData = useCallback(async () => {
    try {
      const [groupData, expensesRes, balanceData, suggestData, settlementData] =
        await Promise.all([
          getGroupApi(groupId),
          listExpensesApi(groupId, 1, 50),
          getGroupBalancesApi(groupId),
          getSettlementSuggestionsApi(groupId),
          listSettlementsApi(groupId),
        ]);

      setGroup(groupData);
      setExpenses(expensesRes.expenses);
      setBalances(balanceData.balances);
      setGroupTotalSpent(balanceData.groupTotalExpensesPaise);
      setSuggestions(suggestData.suggestions);
      setSettlements(settlementData);
    } catch {
      // Handled gracefully
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [groupId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadAllGroupData();
    });
    return unsubscribe;
  }, [navigation, loadAllGroupData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAllGroupData();
  };

  const handleConfirmSettlementCompletion = async () => {
    if (!selectedSettlement) return;
    try {
      setActionLoading(true);
      await updateSettlementStatusApi(groupId, selectedSettlement.id, 'COMPLETED');
      setCompleteModalVisible(false);
      setSelectedSettlement(null);
      loadAllGroupData();
    } catch {
      // Retain modal
    } finally {
      setActionLoading(false);
    }
  };

  const currentUserBalance =
    balances.find((b) => b.userId === user?.id)?.netBalancePaise ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Header
        title={group?.name ?? groupName}
        subtitle={`${group?.members?.length ?? 0} members`}
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('ManageMembers', {
                groupId,
                groupName: group?.name ?? groupName,
              })
            }
            style={styles.settingsBtn}
          >
            <Icon name="settings" size={22} color={theme.colors.text.primary} />
          </TouchableOpacity>
        }
      />

      {/* Group Header Hero Summary */}
      <View
        style={[
          styles.groupHero,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.heroColumn}>
          <Text style={[styles.heroStatLabel, { color: theme.colors.text.secondary }]}>
            Total Group Spending
          </Text>
          <CurrencyText amountPaise={groupTotalSpent} size="large" />
        </View>

        <View style={styles.heroColumnRight}>
          <Text style={[styles.heroStatLabel, { color: theme.colors.text.secondary }]}>
            Your Group Balance
          </Text>
          <CurrencyText
            amountPaise={currentUserBalance}
            type="balance"
            size="large"
          />
        </View>
      </View>

      {/* Tab Segment Controls */}
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        {(['expenses', 'balances', 'settlements', 'members'] as TabKey[]).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[
                styles.tabItem,
                isActive && {
                  borderBottomColor: theme.colors.primary[900],
                  borderBottomWidth: 3,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: isActive
                      ? theme.colors.primary[900]
                      : theme.colors.text.secondary,
                    fontWeight: isActive ? '700' : '500',
                  },
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Tab Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary[900]} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* TAB 1: EXPENSES */}
          {activeTab === 'expenses' && (
            <View>
              {expenses.length === 0 ? (
                <EmptyState
                  icon="receipt"
                  title="No Expenses Yet"
                  description="Be the first to record an expense for this group."
                  actionTitle="Add First Expense"
                  onAction={() => navigation.navigate('AddExpense', { groupId })}
                />
              ) : (
                expenses.map((item) => {
                  const mySplit = item.splits.find((s) => s.userId === user?.id);
                  const isPayer = item.payers.some((p) => p.userId === user?.id);

                  return (
                    <Card
                      key={item.id}
                      onPress={() =>
                        navigation.navigate('ExpenseDetail', {
                          groupId,
                          expenseId: item.id,
                        })
                      }
                    >
                      <View style={styles.expenseRow}>
                        <View
                          style={[
                            styles.categoryCircle,
                            { backgroundColor: theme.colors.neutral[100] },
                          ]}
                        >
                          <Icon name="receipt" size={20} color={theme.colors.primary[900]} />
                        </View>

                        <View style={{ flex: 1, marginRight: 12 }}>
                          <Text
                            style={[
                              styles.expenseDesc,
                              { color: theme.colors.text.primary },
                            ]}
                            numberOfLines={1}
                          >
                            {item.description}
                          </Text>
                          <Text
                            style={[
                              styles.expensePayerText,
                              { color: theme.colors.text.secondary },
                            ]}
                          >
                            Paid by{' '}
                            {item.payers.map((p) => p.user?.displayName).join(', ')} •{' '}
                            {new Date(item.expenseDate).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </Text>
                        </View>

                        <View style={{ alignItems: 'flex-end' }}>
                          <CurrencyText amountPaise={item.amountPaise} size="medium" />
                          {mySplit && (
                            <Text
                              style={[
                                styles.myShareText,
                                {
                                  color: isPayer
                                    ? theme.colors.success[700]
                                    : theme.colors.error[600],
                                },
                              ]}
                            >
                              {isPayer ? 'you lent' : 'your share'}:{' '}
                              ₹{(mySplit.amountPaise / 100).toFixed(2)}
                            </Text>
                          )}
                        </View>
                      </View>
                    </Card>
                  );
                })
              )}
            </View>
          )}

          {/* TAB 2: BALANCES */}
          {activeTab === 'balances' && (
            <View>
              {/* Settle Up Suggestions Card */}
              {suggestions.length > 0 && (
                <View
                  style={[
                    styles.suggestionsCard,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.accent[400],
                    },
                  ]}
                >
                  <View style={styles.suggestionsHeader}>
                    <Icon name="check-circle" size={20} color={theme.colors.accent[700]} />
                    <Text
                      style={[
                        styles.suggestionsTitle,
                        { color: theme.colors.accent[800] },
                      ]}
                    >
                      Suggested Settlements (Min. Transfers)
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.suggestionsDisclaimer,
                      { color: theme.colors.text.secondary },
                    ]}
                  >
                    Status is based on user confirmation; Baantika does not verify actual money transfers.
                  </Text>

                  {suggestions.map((sug, i) => (
                    <View key={i} style={styles.suggestionRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.sugText, { color: theme.colors.text.primary }]}>
                          <Text style={{ fontWeight: '700' }}>{sug.fromDisplayName}</Text> pays{' '}
                          <Text style={{ fontWeight: '700' }}>{sug.toDisplayName}</Text>
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <CurrencyText amountPaise={sug.amountPaise} size="medium" />
                        <Button
                          title="Settle"
                          size="small"
                          onPress={() =>
                            navigation.navigate('CreateSettlement', {
                              groupId,
                              payerId: sug.fromUserId,
                              payeeId: sug.toUserId,
                              amountPaise: sug.amountPaise,
                            })
                          }
                        />
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* All Member Balances */}
              <Text
                style={[
                  styles.sectionHeading,
                  { color: theme.colors.text.primary, marginTop: 16 },
                ]}
              >
                Member Balances
              </Text>

              {balances.map((m) => (
                <Card key={m.userId}>
                  <View style={styles.balanceMemberRow}>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.memberName,
                          { color: theme.colors.text.primary },
                        ]}
                      >
                        {m.displayName}{' '}
                        {m.userId === user?.id && (
                          <Text style={{ color: theme.colors.accent[600] }}>(You)</Text>
                        )}
                      </Text>
                      <Text
                        style={[
                          styles.memberSubText,
                          { color: theme.colors.text.secondary },
                        ]}
                      >
                        Paid ₹{(m.totalPaidPaise / 100).toFixed(2)} • Share ₹
                        {(m.totalOwedPaise / 100).toFixed(2)}
                      </Text>
                    </View>

                    <CurrencyText
                      amountPaise={m.netBalancePaise}
                      type="balance"
                      size="medium"
                    />
                  </View>
                </Card>
              ))}
            </View>
          )}

          {/* TAB 3: SETTLEMENTS */}
          {activeTab === 'settlements' && (
            <View>
              {settlements.length === 0 ? (
                <EmptyState
                  icon="check-circle"
                  title="No Settlements Yet"
                  description="When members settle debts, recorded settlements will appear here."
                  actionTitle="Record a Settlement"
                  onAction={() =>
                    navigation.navigate('CreateSettlement', { groupId })
                  }
                />
              ) : (
                settlements.map((item) => (
                  <Card key={item.id}>
                    <View style={styles.settlementRow}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Badge
                            label={item.status}
                            variant={
                              item.status === 'COMPLETED'
                                ? 'success'
                                : item.status === 'CANCELLED'
                                ? 'danger'
                                : 'warning'
                            }
                          />
                          <Text style={[styles.settleDate, { color: theme.colors.text.secondary }]}>
                            {new Date(item.createdAt).toLocaleDateString('en-IN')}
                          </Text>
                        </View>

                        <Text style={[styles.settleDescription, { color: theme.colors.text.primary }]}>
                          <Text style={{ fontWeight: '700' }}>{item.payer.displayName}</Text> paid{' '}
                          <Text style={{ fontWeight: '700' }}>{item.payee.displayName}</Text>
                        </Text>

                        {item.note && (
                          <Text style={[styles.settleNote, { color: theme.colors.text.secondary }]}>
                            "{item.note}"
                          </Text>
                        )}
                      </View>

                      <View style={{ alignItems: 'flex-end', gap: 6 }}>
                        <CurrencyText amountPaise={item.amountPaise} size="medium" />

                        {item.status === 'PENDING' &&
                          (user?.id === item.payerId || user?.id === item.payeeId) && (
                            <Button
                              title="Confirm"
                              size="small"
                              variant="secondary"
                              onPress={() => {
                                setSelectedSettlement(item);
                                setCompleteModalVisible(true);
                              }}
                            />
                          )}
                      </View>
                    </View>
                  </Card>
                ))
              )}
            </View>
          )}

          {/* TAB 4: MEMBERS */}
          {activeTab === 'members' && (
            <View>
              <View style={styles.memberTopRow}>
                <Text style={[styles.sectionHeading, { color: theme.colors.text.primary }]}>
                  Group Members ({group?.members?.length ?? 0})
                </Text>
                <Button
                  title="Manage / Invite"
                  size="small"
                  variant="outline"
                  onPress={() =>
                    navigation.navigate('ManageMembers', {
                      groupId,
                      groupName: group?.name ?? groupName,
                    })
                  }
                />
              </View>

              {group?.members?.map((m) => (
                <Card key={m.id}>
                  <View style={styles.memberItemRow}>
                    <View
                      style={[
                        styles.memberAvatar,
                        { backgroundColor: theme.colors.primary[900] },
                      ]}
                    >
                      <Text style={styles.memberAvatarText}>
                        {m.user.displayName.charAt(0).toUpperCase()}
                      </Text>
                    </View>

                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text
                        style={[
                          styles.memberName,
                          { color: theme.colors.text.primary },
                        ]}
                      >
                        {m.user.displayName}{' '}
                        {m.userId === user?.id && '(You)'}
                      </Text>
                      <Text
                        style={[
                          styles.memberEmail,
                          { color: theme.colors.text.secondary },
                        ]}
                      >
                        {m.user.email}
                      </Text>
                    </View>

                    <Badge
                      label={m.role}
                      variant={m.role === 'OWNER' ? 'info' : 'neutral'}
                    />
                  </View>
                </Card>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* Floating Action Button: Add Expense */}
      {activeTab === 'expenses' && (
        <TouchableOpacity
          style={[
            styles.fab,
            { backgroundColor: theme.colors.primary[900] },
          ]}
          onPress={() => navigation.navigate('AddExpense', { groupId })}
          accessibilityLabel="Add Expense"
          accessibilityRole="button"
        >
          <Icon name="plus" size={26} color="#FFFFFF" />
          <Text style={styles.fabText}>Add Expense</Text>
        </TouchableOpacity>
      )}

      {/* Manual Settlement Completion Modal */}
      <ConfirmationModal
        visible={completeModalVisible}
        title="Confirm Settlement Completion"
        message={`Confirm that ₹${((selectedSettlement?.amountPaise ?? 0) / 100).toFixed(2)} was settled between ${selectedSettlement?.payer?.displayName} and ${selectedSettlement?.payee?.displayName}?`}
        disclaimer="Status is based on user confirmation; Baantika does not verify actual money transfers."
        confirmText="Confirm Settlement"
        onConfirm={handleConfirmSettlementCompletion}
        onCancel={() => {
          setCompleteModalVisible(false);
          setSelectedSettlement(null);
        }}
        loading={actionLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  settingsBtn: {
    padding: 6,
  },
  groupHero: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    justifyContent: 'space-between',
  },
  heroColumn: {
    flex: 1,
  },
  heroColumnRight: {
    alignItems: 'flex-end',
  },
  heroStatLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 13,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 90,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    elevation: 6,
    gap: 8,
  },
  fabText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  expenseDesc: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },
  expensePayerText: {
    fontSize: 12,
  },
  myShareText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  suggestionsCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  suggestionsTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  suggestionsDisclaimer: {
    fontSize: 11,
    marginBottom: 12,
    lineHeight: 15,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEEDE8',
  },
  sugText: {
    fontSize: 13,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  balanceMemberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  memberSubText: {
    fontSize: 12,
  },
  settlementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  settleDate: {
    fontSize: 11,
  },
  settleDescription: {
    fontSize: 14,
    marginTop: 6,
  },
  settleNote: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
  },
  memberTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  memberEmail: {
    fontSize: 12,
  },
});
