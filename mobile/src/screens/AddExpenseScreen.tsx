import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTheme } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { getGroupApi, createExpenseApi } from '../api/endpoints';
import { Group, SplitMethod } from '../types';
import {
  Header,
  Button,
  Input,
  CurrencyText,
  Icon,
} from '../components/common';

const CATEGORIES = [
  'Food & Dining',
  'Groceries',
  'Rent & Flat',
  'Utilities & Bills',
  'Travel & Transit',
  'Shopping',
  'Entertainment',
  'General',
];

export function AddExpenseScreen({ route, navigation }: any) {
  const { groupId } = route.params;
  const theme = useTheme();
  const { user } = useAuth();

  const [group, setGroup] = useState<Group | null>(null);
  const [description, setDescription] = useState('');
  const [amountRupees, setAmountRupees] = useState('');
  const [category, setCategory] = useState('Food & Dining');
  const [notes, setNotes] = useState('');
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('EQUAL');

  // Single vs Multiple Payers
  const [isMultiPayer, setIsMultiPayer] = useState(false);
  const [selectedPayerId, setSelectedPayerId] = useState<string>(user?.id ?? '');
  const [payerAmounts, setPayerAmounts] = useState<Record<string, string>>({});

  // Split participants
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());
  const [exactSplitAmounts, setExactSplitAmounts] = useState<Record<string, string>>({});
  const [percentageSplits, setPercentageSplits] = useState<Record<string, string>>({});
  const [shareSplits, setShareSplits] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadGroup() {
      try {
        const data = await getGroupApi(groupId);
        setGroup(data);
        const allMemberIds = new Set(data.members?.map((m) => m.userId) ?? []);
        setSelectedParticipants(allMemberIds);
      } catch {
        // Fallback
      }
    }
    loadGroup();
  }, [groupId]);

  const totalPaise = Math.round((parseFloat(amountRupees) || 0) * 100);

  // Compute live split preview
  const getComputedSplits = () => {
    const participantList = Array.from(selectedParticipants);
    if (participantList.length === 0 || totalPaise <= 0) return [];

    if (splitMethod === 'EQUAL') {
      const n = participantList.length;
      const base = Math.floor(totalPaise / n);
      const remainder = totalPaise - base * n;
      const sorted = [...participantList].sort();
      return sorted.map((uid, idx) => ({
        userId: uid,
        amountPaise: base + (idx < remainder ? 1 : 0),
      }));
    }

    if (splitMethod === 'EXACT') {
      return participantList.map((uid) => ({
        userId: uid,
        amountPaise: Math.round((parseFloat(exactSplitAmounts[uid] || '0') || 0) * 100),
      }));
    }

    if (splitMethod === 'PERCENTAGE') {
      return participantList.map((uid) => {
        const pct = parseFloat(percentageSplits[uid] || '0') || 0;
        return {
          userId: uid,
          percentage: pct,
          amountPaise: Math.round((totalPaise * pct) / 100),
        };
      });
    }

    if (splitMethod === 'SHARES') {
      const totalShares = participantList.reduce(
        (sum, uid) => sum + (parseFloat(shareSplits[uid] || '1') || 1),
        0
      );
      return participantList.map((uid) => {
        const weight = parseFloat(shareSplits[uid] || '1') || 1;
        return {
          userId: uid,
          shares: weight,
          amountPaise: totalShares > 0 ? Math.round((totalPaise * weight) / totalShares) : 0,
        };
      });
    }

    return [];
  };

  const computedSplits = getComputedSplits();
  const splitsSum = computedSplits.reduce((sum, s) => sum + s.amountPaise, 0);

  const toggleParticipant = (userId: string) => {
    setSelectedParticipants((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        if (next.size > 1) next.delete(userId); // Maintain at least 1 participant
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleSaveExpense = async () => {
    if (!description.trim()) {
      setErrorMessage('Please enter an expense title / description');
      return;
    }
    if (totalPaise <= 0) {
      setErrorMessage('Please enter a valid amount greater than ₹0');
      return;
    }

    // Build payers list
    let payers: { userId: string; amountPaise: number }[] = [];
    if (!isMultiPayer) {
      payers = [{ userId: selectedPayerId, amountPaise: totalPaise }];
    } else {
      payers = Object.entries(payerAmounts)
        .map(([userId, amt]) => ({
          userId,
          amountPaise: Math.round((parseFloat(amt) || 0) * 100),
        }))
        .filter((p) => p.amountPaise > 0);

      const totalPaid = payers.reduce((sum, p) => sum + p.amountPaise, 0);
      if (totalPaid !== totalPaise) {
        setErrorMessage(
          `Sum of payer contributions (₹${(totalPaid / 100).toFixed(2)}) must match total (₹${(totalPaise / 100).toFixed(2)})`
        );
        return;
      }
    }

    // Build splits list
    const participantList = Array.from(selectedParticipants);
    let splits: any[] = [];

    if (splitMethod === 'EQUAL') {
      splits = participantList.map((userId) => ({ userId }));
    } else if (splitMethod === 'EXACT') {
      splits = participantList.map((userId) => ({
        userId,
        amountPaise: Math.round((parseFloat(exactSplitAmounts[userId] || '0') || 0) * 100),
      }));
      const sum = splits.reduce((acc, s) => acc + s.amountPaise, 0);
      if (sum !== totalPaise) {
        setErrorMessage(
          `Exact shares sum to ₹${(sum / 100).toFixed(2)}, which does not equal ₹${(totalPaise / 100).toFixed(2)}`
        );
        return;
      }
    } else if (splitMethod === 'PERCENTAGE') {
      splits = participantList.map((userId) => ({
        userId,
        percentage: parseFloat(percentageSplits[userId] || '0') || 0,
      }));
      const totalPct = splits.reduce((acc, s) => acc + s.percentage, 0);
      if (Math.abs(totalPct - 100) > 0.01) {
        setErrorMessage(`Percentages must total 100% (currently ${totalPct.toFixed(1)}%)`);
        return;
      }
    } else if (splitMethod === 'SHARES') {
      splits = participantList.map((userId) => ({
        userId,
        shares: parseFloat(shareSplits[userId] || '1') || 1,
      }));
    }

    // Idempotency key prevents double submit
    const idempotencyKey = `exp_${groupId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    try {
      setLoading(true);
      setErrorMessage(null);
      await createExpenseApi(groupId, {
        description: description.trim(),
        amountPaise: totalPaise,
        expenseDate: new Date().toISOString(),
        category,
        splitMethod,
        payers,
        splits,
        notes: notes.trim() || null,
        idempotencyKey,
      });

      navigation.goBack();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Header title="Add Expense" onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {errorMessage && (
            <View
              style={[
                styles.errorBanner,
                {
                  backgroundColor: theme.colors.error[50],
                  borderColor: theme.colors.error[200],
                },
              ]}
            >
              <Icon name="alert-circle" size={18} color={theme.colors.error[600]} />
              <Text style={[styles.errorBannerText, { color: theme.colors.error[700] }]}>
                {errorMessage}
              </Text>
            </View>
          )}

          {/* Amount and Title */}
          <Input
            label="Amount (in Rupees) *"
            prefix="₹"
            placeholder="0.00"
            value={amountRupees}
            onChangeText={(text) => {
              // Allow numbers and single decimal point
              const sanitized = text.replace(/[^0-9.]/g, '');
              setAmountRupees(sanitized);
              setErrorMessage(null);
            }}
            keyboardType="decimal-pad"
            style={styles.amountInput}
          />

          <Input
            label="What was this for? *"
            placeholder="e.g. Dinner at Paradise, Zomato Order, Uber"
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              setErrorMessage(null);
            }}
          />

          {/* Category Horizontal Scroll */}
          <Text style={[styles.sectionLabel, { color: theme.colors.text.primary }]}>
            Category
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
          >
            {CATEGORIES.map((cat) => {
              const selected = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: selected
                        ? theme.colors.primary[900]
                        : theme.colors.surface,
                      borderColor: selected
                        ? theme.colors.primary[900]
                        : theme.colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      { color: selected ? '#FFFFFF' : theme.colors.text.primary },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Paid By Selection */}
          <View style={styles.sectionDivider} />
          <View style={styles.rowBetween}>
            <Text style={[styles.sectionLabel, { color: theme.colors.text.primary }]}>
              Paid By
            </Text>
            <TouchableOpacity onPress={() => setIsMultiPayer(!isMultiPayer)}>
              <Text style={[styles.togglePayerText, { color: theme.colors.accent[700] }]}>
                {isMultiPayer ? 'Single Payer' : 'Multiple Payers'}
              </Text>
            </TouchableOpacity>
          </View>

          {!isMultiPayer ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {group?.members?.map((m) => {
                const isSelected = selectedPayerId === m.userId;
                return (
                  <TouchableOpacity
                    key={m.userId}
                    onPress={() => setSelectedPayerId(m.userId)}
                    style={[
                      styles.payerChip,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.primary[900]
                          : theme.colors.surface,
                        borderColor: isSelected
                          ? theme.colors.primary[900]
                          : theme.colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: isSelected ? '#FFFFFF' : theme.colors.text.primary,
                        fontWeight: '600',
                      }}
                    >
                      {m.user.displayName} {m.userId === user?.id && '(You)'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.multiPayerContainer}>
              {group?.members?.map((m) => (
                <View key={m.userId} style={styles.multiPayerRow}>
                  <Text style={[styles.multiPayerName, { color: theme.colors.text.primary }]}>
                    {m.user.displayName}
                  </Text>
                  <Input
                    prefix="₹"
                    placeholder="0.00"
                    value={payerAmounts[m.userId] || ''}
                    onChangeText={(val) =>
                      setPayerAmounts((prev) => ({ ...prev, [m.userId]: val }))
                    }
                    keyboardType="decimal-pad"
                    containerStyle={{ width: 140, marginBottom: 0 }}
                  />
                </View>
              ))}
            </View>
          )}

          {/* Split Method Tabs */}
          <View style={styles.sectionDivider} />
          <Text style={[styles.sectionLabel, { color: theme.colors.text.primary }]}>
            Split Method
          </Text>
          <View style={styles.splitTabsRow}>
            {(['EQUAL', 'EXACT', 'PERCENTAGE', 'SHARES'] as SplitMethod[]).map((method) => {
              const active = splitMethod === method;
              return (
                <TouchableOpacity
                  key={method}
                  onPress={() => setSplitMethod(method)}
                  style={[
                    styles.splitTabBtn,
                    {
                      backgroundColor: active
                        ? theme.colors.primary[900]
                        : theme.colors.surface,
                      borderColor: active ? theme.colors.primary[900] : theme.colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.splitTabBtnText,
                      { color: active ? '#FFFFFF' : theme.colors.text.primary },
                    ]}
                  >
                    {method}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Participants Breakdown with Live Calculation */}
          <Text style={[styles.subSectionLabel, { color: theme.colors.text.secondary }]}>
            Split Amongst ({selectedParticipants.size} people)
          </Text>

          {group?.members?.map((m) => {
            const isSelected = selectedParticipants.has(m.userId);
            const userComputed = computedSplits.find((s) => s.userId === m.userId);

            return (
              <View
                key={m.userId}
                style={[
                  styles.participantCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={() => toggleParticipant(m.userId)}
                  style={styles.checkboxRow}
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.primary[900]
                          : 'transparent',
                        borderColor: isSelected
                          ? theme.colors.primary[900]
                          : theme.colors.neutral[400],
                      },
                    ]}
                  >
                    {isSelected && <Icon name="check" size={14} color="#FFFFFF" />}
                  </View>
                  <Text style={[styles.participantName, { color: theme.colors.text.primary }]}>
                    {m.user.displayName}
                  </Text>
                </TouchableOpacity>

                {isSelected && (
                  <View style={{ alignItems: 'flex-end' }}>
                    {splitMethod === 'EQUAL' && (
                      <CurrencyText
                        amountPaise={userComputed?.amountPaise ?? 0}
                        size="medium"
                      />
                    )}

                    {splitMethod === 'EXACT' && (
                      <Input
                        prefix="₹"
                        placeholder="0.00"
                        value={exactSplitAmounts[m.userId] || ''}
                        onChangeText={(val) =>
                          setExactSplitAmounts((prev) => ({ ...prev, [m.userId]: val }))
                        }
                        keyboardType="decimal-pad"
                        containerStyle={{ width: 110, marginBottom: 0 }}
                      />
                    )}

                    {splitMethod === 'PERCENTAGE' && (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Input
                          placeholder="0"
                          value={percentageSplits[m.userId] || ''}
                          onChangeText={(val) =>
                            setPercentageSplits((prev) => ({ ...prev, [m.userId]: val }))
                          }
                          keyboardType="decimal-pad"
                          containerStyle={{ width: 70, marginBottom: 0 }}
                        />
                        <Text style={{ marginLeft: 4, fontWeight: '700' }}>%</Text>
                      </View>
                    )}

                    {splitMethod === 'SHARES' && (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Input
                          placeholder="1"
                          value={shareSplits[m.userId] || ''}
                          onChangeText={(val) =>
                            setShareSplits((prev) => ({ ...prev, [m.userId]: val }))
                          }
                          keyboardType="numeric"
                          containerStyle={{ width: 60, marginBottom: 0 }}
                        />
                        <Text style={{ marginLeft: 4, fontSize: 12 }}>shares</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}

          <Button
            title="Save Expense"
            onPress={handleSaveExpense}
            loading={loading}
            style={styles.saveBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  amountInput: {
    fontSize: 24,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#EEEDE8',
    marginVertical: 16,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  togglePayerText: {
    fontSize: 13,
    fontWeight: '700',
  },
  payerChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  multiPayerContainer: {
    marginBottom: 16,
  },
  multiPayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  multiPayerName: {
    fontSize: 14,
    fontWeight: '600',
  },
  splitTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  splitTabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  splitTabBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  subSectionLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 10,
  },
  participantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantName: {
    fontSize: 15,
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  errorBannerText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  saveBtn: {
    marginTop: 20,
  },
});
