import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { Icon } from './Icon';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message: string;
  isColdStarting?: boolean;
  onRetry?: () => void;
  retrying?: boolean;
}

export function ErrorState({
  title,
  message,
  isColdStarting = false,
  onRetry,
  retrying = false,
}: ErrorStateProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: isColdStarting
              ? theme.colors.warning[50]
              : theme.colors.error[50],
          },
        ]}
      >
        <Icon
          name={isColdStarting ? 'clock' : 'alert-circle'}
          size={36}
          color={
            isColdStarting ? theme.colors.warning[700] : theme.colors.error[600]
          }
        />
      </View>

      <Text style={[styles.title, { color: theme.colors.text.primary }]}>
        {title ?? (isColdStarting ? 'Server Waking Up' : 'Connection Error')}
      </Text>

      <Text style={[styles.message, { color: theme.colors.text.secondary }]}>
        {isColdStarting
          ? 'Free cloud servers take 30-50 seconds to boot on first wake. We are connecting...'
          : message}
      </Text>

      {onRetry && (
        <Button
          title={retrying ? 'Connecting...' : 'Try Again'}
          icon="refresh"
          loading={retrying}
          onPress={onRetry}
          style={styles.retryButton}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginVertical: 24,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    minWidth: 150,
  },
});
