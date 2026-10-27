import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { Icon } from '../components/common/Icon';
import { Button } from '../components/common/Button';

export function SplashScreen({ navigation }: any) {
  const theme = useTheme();
  const { isAuthenticated, isBackendReady, isColdStarting, checkHealth, isLoading } = useAuth();
  const [attemptCount, setAttemptCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
      }
    }
  }, [isLoading, isAuthenticated, navigation]);

  const handleManualRetry = async () => {
    setIsRetrying(true);
    setAttemptCount((prev) => prev + 1);
    await checkHealth();
    setIsRetrying(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary[900] }]}>
      {/* Brand Logo & Name */}
      <View style={styles.brandingContainer}>
        <View style={styles.logoBadge}>
          <Icon name="rupee" size={48} color="#FFFFFF" />
        </View>

        <Text style={styles.brandTitle}>Baantika</Text>
        <Text style={styles.tagline}>Share expenses. Settle simply.</Text>
      </View>

      {/* Loading or Cold-Start Status */}
      <View style={styles.statusContainer}>
        {isColdStarting ? (
          <View style={styles.coldStartBox}>
            <ActivityIndicator color={theme.colors.accent[400]} size="small" />
            <Text style={styles.coldStartText}>
              Connecting to secure cloud server... (takes ~30s on cold start)
            </Text>
            {attemptCount > 0 && (
              <Button
                title="Retry Connection"
                variant="outline"
                size="small"
                onPress={handleManualRetry}
                loading={isRetrying}
                style={styles.retryBtn}
                textStyle={{ color: '#FFFFFF' }}
              />
            )}
          </View>
        ) : (
          <ActivityIndicator color="#FFFFFF" size="large" />
        )}
      </View>

      <Text style={styles.footerText}>Made for India 🇮🇳 • INR-First</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 64,
    paddingHorizontal: 24,
  },
  brandingContainer: {
    alignItems: 'center',
    marginTop: 80,
  },
  logoBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#F4891F', // Tasteful saffron
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    elevation: 6,
  },
  brandTitle: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    color: '#C5CAD9',
    marginTop: 8,
    fontWeight: '500',
  },
  statusContainer: {
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  coldStartBox: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  coldStartText: {
    color: '#E0DED8',
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  retryBtn: {
    marginTop: 16,
    borderColor: '#7986A7',
  },
  footerText: {
    color: '#7986A7',
    fontSize: 13,
    fontWeight: '500',
  },
});
