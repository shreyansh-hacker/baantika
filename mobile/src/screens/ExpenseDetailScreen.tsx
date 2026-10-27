import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { getExpenseApi, deleteExpenseApi } from '../api/endpoints';
import { Expense } from '../types';
import {
  Header,
  Card,
  CurrencyText,
  Badge,
  Button,
  Icon,
  ConfirmationModal,
} from '../components/common';

export function ExpenseDetailScreen({ route, navigation }: any) {
  const { groupId, expenseId } = route.params;
  const theme = useTheme();
  const { user } = useAuth();

  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchExpense = useCallback(async () => {
    try {
      const data = await getExpenseApi(groupId, expenseId);
      setExpense(data);
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  }, [groupId, expenseId]);

  useEffect(() => {
    fetchExpense();
  }, [fetchExpense]);

  const handleDeleteExpense = async () => {
    try {
      setDeleting(true);
      await deleteExpenseApi(groupId, expenseId);
      setDeleteModalVisible(false);
      navigation.goBack();
    } catch {
      // Keep modal open
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary[900]} />
      </View>
    );
  }

  if (!expense) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.text.secondary }}>Expense not found</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Header
        title="Expense Details"
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            onPress={() => setDeleteModalVisible(true)}
            style={{ padding: 6 }}
          >
            <Icon name="trash" size={20} color={theme.colors.error[500]} />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.container}>
        {/* Main Expense Banner */}
        <View
          style={[
            styles.bannerCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.bannerTop}>
            <View
              style={[
                styles.categoryCircle,
                { backgroundColor: theme.colors.neutral[100] },
              ]}
            >
              <Icon name="receipt" size={24} color={theme.colors.primary[900]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: theme.colors.text.primary }]}>
                {expense.description}
              </Text>
              <Text style={[styles.dateText, { color: theme.colors.text.secondary }]}>
                {new Date(expense.expenseDate).toLocaleDateString('en-IN', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>

          <View style={styles.amountBox}>
            <CurrencyText amountPaise={expense.amountPaise} size="display" />
            <Badge label={expense.splitMethod + ' SPLIT'} variant="info" />
          </View>

          {expense.notes && (
            <View style={styles.notesBox}>
              <Text style={[styles.notesText, { color: theme.colors.text.secondary }]}>
                "{expense.notes}"
              </Text>
            </View>
          )}
        </View>

        {/* Payer Breakdown */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          Who Paid ({expense.payers.length})
        </Text>
        {expense.payers.map((p) => (
          <Card key={p.id}>
            <View style={styles.breakdownRow}>
              <View>
                <Text style={[styles.personName, { color: theme.colors.text.primary }]}>
                  {p.user?.displayName}{' '}
                  {p.userId === user?.id && <Text style={{ color: theme.colors.accent[700] }}>(You)</Text>}
                </Text>
                <Text style={[styles.subNote, { color: theme.colors.text.secondary }]}>
                  Paid full or partial contribution
                </Text>
              </View>
              <CurrencyText amountPaise={p.amountPaise} size="medium" />
            </View>
          </Card>
        ))}

        {/* Participant Share Breakdown */}
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.colors.text.primary, marginTop: 16 },
          ]}
        >
          Split Breakdown ({expense.splits.length})
        </Text>
        {expense.splits.map((s) => (
          <Card key={s.id}>
            <View style={styles.breakdownRow}>
              <View>
                <Text style={[styles.personName, { color: theme.colors.text.primary }]}>
                  {s.user?.displayName}{' '}
                  {s.userId === user?.id && <Text style={{ color: theme.colors.accent[700] }}>(You)</Text>}
                </Text>
                {s.shareValue ? (
                  <Text style={[styles.subNote, { color: theme.colors.text.secondary }]}>
                    {expense.splitMethod === 'PERCENTAGE'
                      ? `${s.shareValue}% share`
                      : `${s.shareValue} shares`}
                  </Text>
                ) : null}
              </View>
              <CurrencyText amountPaise={s.amountPaise} size="medium" />
            </View>
          </Card>
        ))}
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={deleteModalVisible}
        title="Delete Expense"
        message={`Are you sure you want to delete "${expense.description}"? Group balances will be automatically recalculated.`}
        confirmText="Delete"
        isDestructive
        onConfirm={handleDeleteExpense}
        onCancel={() => setDeleteModalVisible(false)}
        loading={deleting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerCard: {
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  bannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 12,
  },
  amountBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEEDE8',
  },
  notesBox: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEEDE8',
  },
  notesText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  personName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  subNote: {
    fontSize: 12,
  },
});
