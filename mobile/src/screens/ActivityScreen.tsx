import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../theme';
import { getUserActivityApi } from '../api/endpoints';
import { ActivityEvent } from '../types';
import { Icon, EmptyState, Header } from '../components/common';

export function ActivityScreen() {
  const theme = useTheme();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActivity = useCallback(async () => {
    try {
      const data = await getUserActivityApi(1, 40);
      setEvents(data.events);
    } catch {
      // Handled
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const getActivityIcon = (action: string) => {
    if (action.includes('EXPENSE')) return 'receipt';
    if (action.includes('SETTLEMENT')) return 'check-circle';
    return 'group';
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Header title="Activity Timeline" />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary[900]} />
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchActivity();
              }}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="history"
              title="No Activity Yet"
              description="Your group expenses, settlements, and member updates will appear here."
            />
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.itemCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: theme.colors.neutral[100] },
                ]}
              >
                <Icon
                  name={getActivityIcon(item.action)}
                  size={18}
                  color={theme.colors.primary[900]}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.mainText, { color: theme.colors.text.primary }]}>
                  <Text style={{ fontWeight: '700' }}>{item.actor.displayName}</Text>{' '}
                  {formatDetailAction(item.action, item.metadata)}
                </Text>

                <View style={styles.subRow}>
                  {item.group && (
                    <Text
                      style={[styles.groupTag, { color: theme.colors.text.secondary }]}
                    >
                      {item.group.name} •{' '}
                    </Text>
                  )}
                  <Text style={[styles.timeText, { color: theme.colors.text.secondary }]}>
                    {new Date(item.createdAt).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

function formatDetailAction(action: string, metadata?: any): string {
  switch (action) {
    case 'EXPENSE_CREATED':
      return `added "${metadata?.description ?? 'an expense'}" of ₹${(
        (metadata?.amountPaise ?? 0) / 100
      ).toFixed(2)}`;
    case 'EXPENSE_UPDATED':
      return `updated "${metadata?.description ?? 'an expense'}"`;
    case 'EXPENSE_DELETED':
      return `deleted "${metadata?.description ?? 'an expense'}"`;
    case 'SETTLEMENT_CREATED':
      return `recorded a settlement of ₹${((metadata?.amountPaise ?? 0) / 100).toFixed(2)}`;
    case 'SETTLEMENT_COMPLETED':
      return 'confirmed settlement completion';
    case 'MEMBER_ADDED':
      return `added ${metadata?.targetName ?? 'a new member'}`;
    case 'INVITATION_ACCEPTED':
      return 'joined the group via code';
    default:
      return action.replace(/_/g, ' ').toLowerCase();
  }
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  mainText: {
    fontSize: 14,
    lineHeight: 20,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  groupTag: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeText: {
    fontSize: 12,
  },
});
