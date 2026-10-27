import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../theme';
import { listGroupsApi, acceptInvitationApi } from '../api/endpoints';
import { Group } from '../types';
import {
  Card,
  CurrencyText,
  Button,
  Icon,
  EmptyState,
  ErrorState,
  Badge,
  Input,
  ConfirmationModal,
} from '../components/common';

export function GroupListScreen({ navigation }: any) {
  const theme = useTheme();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Join by code modal state
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    try {
      setError(null);
      const data = await listGroupsApi();
      setGroups(data);
    } catch (err: any) {
      setError(err.message || 'Unable to load groups');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchGroups();
    });
    return unsubscribe;
  }, [navigation, fetchGroups]);

  const handleJoinWithCode = async () => {
    if (!inviteCode.trim()) {
      setJoinError('Please enter an invitation code');
      return;
    }

    try {
      setJoining(true);
      setJoinError(null);
      await acceptInvitationApi(inviteCode.trim().toUpperCase());
      setJoinModalVisible(false);
      setInviteCode('');
      fetchGroups();
    } catch (err: any) {
      setJoinError(err.message || 'Invalid or expired invitation code');
    } finally {
      setJoining(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Top action bar */}
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <Text style={[styles.heading, { color: theme.colors.text.primary }]}>
          Your Groups
        </Text>
        <View style={styles.topActions}>
          <TouchableOpacity
            onPress={() => setJoinModalVisible(true)}
            style={[styles.joinBtn, { borderColor: theme.colors.border }]}
          >
            <Text style={[styles.joinBtnText, { color: theme.colors.primary[900] }]}>
              Join with Code
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('CreateGroup')}
            style={[
              styles.createBtn,
              { backgroundColor: theme.colors.primary[900] },
            ]}
          >
            <Icon name="plus" size={18} color="#FFFFFF" />
            <Text style={styles.createBtnText}>New</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary[900]} />
        </View>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchGroups} />
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchGroups();
              }}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="group"
              title="No Groups Found"
              description="You are not part of any group yet. Create one for your flat, trip, or event!"
              actionTitle="Create a Group"
              onAction={() => navigation.navigate('CreateGroup')}
            />
          }
          renderItem={({ item }) => (
            <Card
              onPress={() =>
                navigation.navigate('GroupDetail', {
                  groupId: item.id,
                  groupName: item.name,
                })
              }
            >
              <View style={styles.groupCard}>
                <View style={styles.groupMain}>
                  <View style={styles.groupHeaderRow}>
                    <Text
                      style={[
                        styles.groupNameText,
                        { color: theme.colors.text.primary },
                      ]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    {item.role && (
                      <Badge
                        label={item.role}
                        variant={item.role === 'OWNER' ? 'info' : 'neutral'}
                        size="small"
                      />
                    )}
                  </View>

                  {item.description ? (
                    <Text
                      style={[
                        styles.groupDesc,
                        { color: theme.colors.text.secondary },
                      ]}
                      numberOfLines={2}
                    >
                      {item.description}
                    </Text>
                  ) : null}

                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Icon name="user" size={14} color={theme.colors.text.secondary} />
                      <Text
                        style={[
                          styles.metaText,
                          { color: theme.colors.text.secondary },
                        ]}
                      >
                        {item.memberCount ?? item.members?.length ?? 1} members
                      </Text>
                    </View>

                    <View style={styles.metaItem}>
                      <Icon
                        name="receipt"
                        size={14}
                        color={theme.colors.text.secondary}
                      />
                      <Text
                        style={[
                          styles.metaText,
                          { color: theme.colors.text.secondary },
                        ]}
                      >
                        {item.expenseCount ?? 0} expenses
                      </Text>
                    </View>
                  </View>
                </View>

                <Icon
                  name="chevron-right"
                  size={20}
                  color={theme.colors.neutral[400]}
                />
              </View>
            </Card>
          )}
        />
      )}

      {/* Join with Code Dialog */}
      <ConfirmationModal
        visible={joinModalVisible}
        title="Join Group"
        message="Enter the 12-character invitation code shared by the group owner."
        confirmText="Join Group"
        onConfirm={handleJoinWithCode}
        onCancel={() => {
          setJoinModalVisible(false);
          setJoinError(null);
          setInviteCode('');
        }}
        loading={joining}
      >
        <Input
          placeholder="e.g. 9F8A1B2C3D4E"
          value={inviteCode}
          onChangeText={(text) => {
            setInviteCode(text);
            setJoinError(null);
          }}
          autoCapitalize="characters"
          error={joinError ?? undefined}
          containerStyle={{ marginTop: 8 }}
        />
      </ConfirmationModal>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
  },
  topActions: {
    flexDirection: 'row',
    gap: 8,
  },
  joinBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  joinBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupMain: {
    flex: 1,
    paddingRight: 12,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  groupNameText: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  groupDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
