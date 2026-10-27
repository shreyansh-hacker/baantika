import React, { ReactNode } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { useTheme } from '../../theme';
import { Button } from './Button';

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  disclaimer?: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  loading?: boolean;
  children?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationModal({
  visible,
  title,
  message,
  disclaimer,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  loading = false,
  children,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const theme = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.dialog,
                {
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.radii.xl,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text style={[styles.title, { color: theme.colors.text.primary }]}>
                {title}
              </Text>

              <Text style={[styles.message, { color: theme.colors.text.secondary }]}>
                {message}
              </Text>

              {children}

              {disclaimer && (
                <View
                  style={[
                    styles.disclaimerBox,
                    {
                      backgroundColor: theme.colors.warning[50],
                      borderColor: theme.colors.warning[200],
                    },
                  ]}
                >
                  <Text style={[styles.disclaimerText, { color: theme.colors.warning[800] }]}>
                    ℹ️ {disclaimer}
                  </Text>
                </View>
              )}

              <View style={styles.actions}>
                <Button
                  title={cancelText}
                  variant="outline"
                  onPress={onCancel}
                  disabled={loading}
                  style={styles.actionBtn}
                />
                <Button
                  title={confirmText}
                  variant={isDestructive ? 'danger' : 'primary'}
                  onPress={onConfirm}
                  loading={loading}
                  style={styles.actionBtn}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    padding: 24,
    borderWidth: 1,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  disclaimerBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
    marginTop: 8,
  },
  disclaimerText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
  },
});
