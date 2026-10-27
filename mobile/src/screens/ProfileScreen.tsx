import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useTheme, useThemeContext } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { deleteAccountApi } from '../api/endpoints';
import {
  Header,
  Card,
  Button,
  Input,
  Icon,
  Badge,
  ConfirmationModal,
} from '../components/common';

export function ProfileScreen() {
  const theme = useTheme();
  const { isDark, toggleTheme } = useThemeContext();
  const { user, logout, backendUrl, updateBackendUrl, checkHealth, isBackendReady } = useAuth();

  const [customUrl, setCustomUrl] = useState(backendUrl);
  const [testingConnection, setTestingConnection] = useState(false);
  const [healthStatus, setHealthStatus] = useState<string | null>(null);

  // Deactivate modal state
  const [deactivateModalVisible, setDeactivateModalVisible] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const handleTestConnection = async () => {
    try {
      setTestingConnection(true);
      setHealthStatus(null);
      if (customUrl !== backendUrl) {
        updateBackendUrl(customUrl.trim());
      }
      const ok = await checkHealth();
      setHealthStatus(ok ? 'Connected successfully! (200 OK)' : 'Server unreachable or sleeping');
    } catch {
      setHealthStatus('Connection failed');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleDeactivateAccount = async () => {
    try {
      setDeactivating(true);
      await deleteAccountApi();
      setDeactivateModalVisible(false);
      await logout();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to deactivate account');
    } finally {
      setDeactivating(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Header title="Profile & Settings" />

      <ScrollView contentContainerStyle={styles.container}>
        {/* User Profile Card */}
        <View
          style={[
            styles.profileCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.avatar,
              { backgroundColor: theme.colors.primary[900] },
            ]}
          >
            <Text style={styles.avatarText}>
              {user?.displayName?.charAt(0).toUpperCase() ?? 'U'}
            </Text>
          </View>

          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={[styles.userName, { color: theme.colors.text.primary }]}>
              {user?.displayName ?? 'User'}
            </Text>
            <Text style={[styles.userEmail, { color: theme.colors.text.secondary }]}>
              {user?.email ?? ''}
            </Text>
            <View style={{ marginTop: 6 }}>
              <Badge label="CURRENCY: INR (₹)" variant="info" />
            </View>
          </View>
        </View>

        {/* Preferences Section */}
        <Text style={[styles.sectionHeading, { color: theme.colors.text.primary }]}>
          Preferences
        </Text>
        <Card>
          <View style={styles.settingRow}>
            <View>
              <Text style={[styles.settingLabel, { color: theme.colors.text.primary }]}>
                Dark Mode
              </Text>
              <Text style={[styles.settingSub, { color: theme.colors.text.secondary }]}>
                Switch between light and dark themes
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ true: theme.colors.primary[900], false: theme.colors.neutral[300] }}
            />
          </View>
        </Card>

        {/* Cloud Server Configuration (Render API) */}
        <Text style={[styles.sectionHeading, { color: theme.colors.text.primary, marginTop: 16 }]}>
          Backend API Connection
        </Text>
        <Card>
          <Text style={[styles.settingLabel, { color: theme.colors.text.primary }]}>
            Base Server URL
          </Text>
          <Text style={[styles.settingSub, { color: theme.colors.text.secondary, marginBottom: 12 }]}>
            Configured for your local emulator or Render deployment
          </Text>

          <Input
            placeholder="https://baantika-api.onrender.com"
            value={customUrl}
            onChangeText={setCustomUrl}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Button
              title="Test Connection"
              size="small"
              variant="outline"
              loading={testingConnection}
              onPress={handleTestConnection}
            />
            {healthStatus && (
              <Text
                style={[
                  styles.healthText,
                  {
                    color: isBackendReady
                      ? theme.colors.success[700]
                      : theme.colors.error[600],
                  },
                ]}
              >
                {healthStatus}
              </Text>
            )}
          </View>
        </Card>

        {/* Security & Disclaimer */}
        <Text style={[styles.sectionHeading, { color: theme.colors.text.primary, marginTop: 16 }]}>
          Security & Payments
        </Text>
        <Card>
          <View style={styles.securityBox}>
            <Icon name="info" size={20} color={theme.colors.primary[800]} />
            <Text style={[styles.securityText, { color: theme.colors.text.secondary }]}>
              Baantika stores auth tokens in hardware-backed Android Keystore.
              Real money transfers, bank APIs, and payment gateways are intentionally not integrated;
              settlements represent mutual user agreements.
            </Text>
          </View>
        </Card>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <Button
            title="Sign Out"
            variant="outline"
            onPress={logout}
            style={styles.logoutBtn}
          />

          <TouchableOpacity
            onPress={() => setDeactivateModalVisible(true)}
            style={styles.deactivateBtn}
          >
            <Text style={[styles.deactivateText, { color: theme.colors.error[500] }]}>
              Deactivate My Account
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Deactivate Account Confirmation Modal */}
      <ConfirmationModal
        visible={deactivateModalVisible}
        title="Deactivate Account"
        message="Your account will be deactivated and your display name anonymized to 'Deleted User'. Historical financial records in shared groups will be preserved to maintain balance integrity for other members."
        confirmText="Deactivate"
        isDestructive
        onConfirm={handleDeactivateAccount}
        onCancel={() => setDeactivateModalVisible(false)}
        loading={deactivating}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingSub: {
    fontSize: 12,
  },
  healthText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  securityBox: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  securityText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  actionsContainer: {
    marginTop: 24,
  },
  logoutBtn: {
    marginBottom: 16,
  },
  deactivateBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  deactivateText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
