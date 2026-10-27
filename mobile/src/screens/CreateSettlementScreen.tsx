import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { getGroupApi, createSettlementApi } from '../api/endpoints';
import { Group } from '../types';
import {
  Header,
  Button,
  Input,
  Icon,
  ConfirmationModal,
} from '../components/common';

export function CreateSettlementScreen({ route, navigation }: any) {
  const { groupId, payerId: initPayerId, payeeId: initPayeeId, amountPaise: initAmountPaise } =
    route.params ?? {};
  const theme = useTheme();
  const { user } = useAuth();

  const [group, setGroup] = useState<Group | null>(null);
  const [payerId, setPayerId] = useState<string>(initPayerId ?? user?.id ?? '');
  const [payeeId, setPayeeId] = useState<string>(initPayeeId ?? '');
  const [amountRupees, setAmountRupees] = useState<string>(
    initAmountPaise ? (initAmountPaise / 100).toFixed(2) : ''
  );
  const [note, setNote] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);

  useEffect(() => {
    async function loadGroup() {
      try {
        const data = await getGroupApi(groupId);
        setGroup(data);
        if (!payeeId && data.members && data.members.length > 0) {
          const other = data.members.find((m) => m.userId !== payerId);
          if (other) setPayeeId(other.userId);
        }
      } catch {
        // Handled
      }
    }
    loadGroup();
  }, [groupId, payerId, payeeId]);

  const handleValidate = () => {
    const paise = Math.round((parseFloat(amountRupees) || 0) * 100);
    if (!payerId) {
      setErrorMessage('Please select who paid the settlement');
      return;
    }
    if (!payeeId) {
      setErrorMessage('Please select who received the settlement');
      return;
    }
    if (payerId === payeeId) {
      setErrorMessage('Payer and payee cannot be the same person');
      return;
    }
    if (paise <= 0) {
      setErrorMessage('Settlement amount must be greater than ₹0');
      return;
    }

    setErrorMessage(null);
    setConfirmModalVisible(true);
  };

  const handleCreateSettlement = async () => {
    const paise = Math.round((parseFloat(amountRupees) || 0) * 100);
    try {
      setLoading(true);
      await createSettlementApi(groupId, {
        payerId,
        payeeId,
        amountPaise: paise,
        note: note.trim() || null,
      });

      setConfirmModalVisible(false);
      navigation.goBack();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record settlement');
      setConfirmModalVisible(false);
    } finally {
      setLoading(false);
    }
  };

  const members = group?.members ?? [];
  const payerName = members.find((m) => m.userId === payerId)?.user.displayName ?? 'Payer';
  const payeeName = members.find((m) => m.userId === payeeId)?.user.displayName ?? 'Recipient';

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Header title="Record Settlement" onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Statutory Disclaimer Box */}
          <View
            style={[
              styles.disclaimerBox,
              {
                backgroundColor: theme.colors.warning[50],
                borderColor: theme.colors.warning[200],
              },
            ]}
          >
            <Icon name="info" size={18} color={theme.colors.warning[800]} />
            <Text
              style={[
                styles.disclaimerText,
                { color: theme.colors.warning[900] },
              ]}
            >
              Status is based on user confirmation; Baantika does not execute or verify actual bank / UPI transfers.
            </Text>
          </View>

          {errorMessage && (
            <View
              style={[
                styles.errorBox,
                {
                  backgroundColor: theme.colors.error[50],
                  borderColor: theme.colors.error[200],
                },
              ]}
            >
              <Text style={[styles.errorText, { color: theme.colors.error[700] }]}>
                {errorMessage}
              </Text>
            </View>
          )}

          {/* Amount */}
          <Input
            label="Amount Settled (in Rupees) *"
            prefix="₹"
            placeholder="0.00"
            value={amountRupees}
            onChangeText={(text) => {
              setAmountRupees(text.replace(/[^0-9.]/g, ''));
              setErrorMessage(null);
            }}
            keyboardType="decimal-pad"
            style={{ fontSize: 24, fontWeight: '700' }}
          />

          {/* Who Paid (Debtor) */}
          <Text style={[styles.sectionLabel, { color: theme.colors.text.primary }]}>
            Who paid? (Debtor)
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {members.map((m) => {
              const selected = payerId === m.userId;
              return (
                <TouchableOpacity
                  key={m.userId}
                  onPress={() => setPayerId(m.userId)}
                  style={[
                    styles.memberChip,
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
                    style={{
                      color: selected ? '#FFFFFF' : theme.colors.text.primary,
                      fontWeight: '600',
                    }}
                  >
                    {m.user.displayName} {m.userId === user?.id && '(You)'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Who Received (Creditor) */}
          <Text
            style={[
              styles.sectionLabel,
              { color: theme.colors.text.primary, marginTop: 12 },
            ]}
          >
            Who received? (Creditor)
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {members.map((m) => {
              const selected = payeeId === m.userId;
              return (
                <TouchableOpacity
                  key={m.userId}
                  onPress={() => setPayeeId(m.userId)}
                  style={[
                    styles.memberChip,
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
                    style={{
                      color: selected ? '#FFFFFF' : theme.colors.text.primary,
                      fontWeight: '600',
                    }}
                  >
                    {m.user.displayName} {m.userId === user?.id && '(You)'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Notes */}
          <Input
            label="Note (Optional)"
            placeholder="e.g. Paid via GPay / UPI, Cash in hand"
            value={note}
            onChangeText={setNote}
            containerStyle={{ marginTop: 14 }}
          />

          <Button
            title="Record Settlement"
            onPress={handleValidate}
            style={styles.submitBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={confirmModalVisible}
        title="Record Settlement"
        message={`Record that ${payerName} paid ₹${parseFloat(amountRupees || '0').toFixed(2)} to ${payeeName}?`}
        disclaimer="Status is based on user confirmation; Baantika does not verify actual money transfers."
        confirmText="Confirm & Save"
        onConfirm={handleCreateSettlement}
        onCancel={() => setConfirmModalVisible(false)}
        loading={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  disclaimerBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
    alignItems: 'center',
  },
  disclaimerText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    flex: 1,
  },
  errorBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  chipScroll: {
    marginBottom: 8,
  },
  memberChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  submitBtn: {
    marginTop: 20,
  },
});
