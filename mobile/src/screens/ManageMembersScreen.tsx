import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useTheme } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import {
  getGroupApi,
  addMemberApi,
  removeMemberApi,
  createInvitationApi,
} from '../api/endpoints';
import { Group, Invitation } from '../types';
import {
  Header,
  Card,
  Badge,
  Button,
  Input,
  Icon,
  ConfirmationModal,
} from '../components/common';

export function ManageMembersScreen({ route, navigation }: any) {
  const { groupId, groupName } = route.params;
  const theme = useTheme();
  const { user } = useAuth();

  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);

  // Invite by email
  const [emailInput, setEmailInput] = useState('');
  const [addingEmail, setAddingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Active invitation code
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);

  // Remove member modal
  const [removeModalVisible, setRemoveModalVisible] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<any>(null);
  const [removing, setRemoving] = useState(false);

  const loadGroup = useCallback(async () => {
    try {
      const data = await getGroupApi(groupId);
      setGroup(data);
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadGroup();
  }, [loadGroup]);

  const handleAddByEmail = async () => {
    if (!emailInput.trim()) {
      setEmailError('Please enter an email address');
      return;
    }

    try {
      setAddingEmail(true);
      setEmailError(null);
      await addMemberApi(groupId, emailInput.trim());
      setEmailInput('');
      loadGroup();
    } catch (err: any) {
      setEmailError(err.message || 'Failed to add member');
    } finally {
      setAddingEmail(false);
    }
  };

  const handleGenerateInviteCode = async () => {
    try {
      setGeneratingCode(true);
      const inv = await createInvitationApi(groupId);
      setInvitation(inv);
    } catch {
      // Handled
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleShareCode = async () => {
    if (!invitation) return;
    try {
      await Share.share({
        message: `Join our expense sharing group "${group?.name}" on Baantika! Use invitation code: ${invitation.inviteCode}`,
      });
    } catch {
      // Handled
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    try {
      setRemoving(true);
      await removeMemberApi(groupId, memberToRemove.userId);
      setRemoveModalVisible(false);
      setMemberToRemove(null);
      loadGroup();
    } catch {
      // Handled
    } finally {
      setRemoving(false);
    }
  };

  const isOwner = group?.createdById === user?.id;

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary[900]} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Header
        title="Manage Members"
        subtitle={group?.name ?? groupName}
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.container}>
        {/* Share Invitation Code Card */}
        <View
          style={[
            styles.inviteCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.accent[400],
            },
          ]}
        >
          <View style={styles.inviteHeader}>
            <Icon name="share" size={22} color={theme.colors.accent[700]} />
            <Text style={[styles.inviteTitle, { color: theme.colors.text.primary }]}>
              Invite Friends via Code
            </Text>
          </View>

          <Text style={[styles.inviteDesc, { color: theme.colors.text.secondary }]}>
            Share a secure code with flatmates or travel friends so they can join this group from their Baantika app.
          </Text>

          {invitation ? (
            <View style={styles.codeBox}>
              <Text style={[styles.codeText, { color: theme.colors.primary[900] }]}>
                {invitation.inviteCode}
              </Text>
              <Text style={[styles.expiresText, { color: theme.colors.text.secondary }]}>
                Expires in 7 days
              </Text>

              <Button
                title="Share Code"
                icon="share"
                size="small"
                variant="secondary"
                onPress={handleShareCode}
                style={{ marginTop: 10 }}
              />
            </View>
          ) : (
            <Button
              title="Generate Invite Code"
              size="small"
              variant="outline"
              loading={generatingCode}
              onPress={handleGenerateInviteCode}
            />
          )}
        </View>

        {/* Add by Registered Email */}
        <View
          style={[
            styles.addEmailCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.addEmailTitle, { color: theme.colors.text.primary }]}>
            Add Registered User by Email
          </Text>

          <Input
            placeholder="friend@example.com"
            value={emailInput}
            onChangeText={(t) => {
              setEmailInput(t);
              setEmailError(null);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            error={emailError ?? undefined}
            containerStyle={{ marginBottom: 10 }}
          />

          <Button
            title="Add to Group"
            size="small"
            loading={addingEmail}
            onPress={handleAddByEmail}
          />
        </View>

        {/* Current Members List */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          Group Members ({group?.members?.length ?? 0})
        </Text>

        {group?.members?.map((m) => (
          <Card key={m.id}>
            <View style={styles.memberRow}>
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: theme.colors.primary[900] },
                ]}
              >
                <Text style={styles.avatarText}>
                  {m.user.displayName.charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={{ flex: 1, marginHorizontal: 12 }}>
                <Text style={[styles.memberName, { color: theme.colors.text.primary }]}>
                  {m.user.displayName}{' '}
                  {m.userId === user?.id && <Text style={{ color: theme.colors.accent[700] }}>(You)</Text>}
                </Text>
                <Text style={[styles.memberEmail, { color: theme.colors.text.secondary }]}>
                  {m.user.email}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Badge
                  label={m.role}
                  variant={m.role === 'OWNER' ? 'info' : 'neutral'}
                />

                {isOwner && m.userId !== user?.id && (
                  <TouchableOpacity
                    onPress={() => {
                      setMemberToRemove(m);
                      setRemoveModalVisible(true);
                    }}
                    style={{ padding: 4 }}
                  >
                    <Icon name="trash" size={18} color={theme.colors.error[500]} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </Card>
        ))}
      </ScrollView>

      {/* Remove Member Confirmation Modal */}
      <ConfirmationModal
        visible={removeModalVisible}
        title="Remove Member"
        message={`Remove ${memberToRemove?.user?.displayName} from the group? Their past expense records will remain preserved for financial balance integrity.`}
        confirmText="Remove"
        isDestructive
        onConfirm={handleRemoveMember}
        onCancel={() => {
          setRemoveModalVisible(false);
          setMemberToRemove(null);
        }}
        loading={removing}
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
  inviteCard: {
    padding: 18,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  inviteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  inviteTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  inviteDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  codeBox: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F5F4F0',
    marginTop: 6,
  },
  codeText: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 3,
  },
  expiresText: {
    fontSize: 11,
    marginTop: 2,
  },
  addEmailCard: {
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  addEmailTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 12,
  },
});
