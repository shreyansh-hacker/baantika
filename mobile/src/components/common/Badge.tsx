import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'neutral';
  size?: 'small' | 'medium';
}

export function Badge({ label, variant = 'neutral', size = 'small' }: BadgeProps) {
  const theme = useTheme();

  let backgroundColor: string;
  let textColor: string;

  switch (variant) {
    case 'success':
      backgroundColor = theme.colors.success[50];
      textColor = theme.colors.success[700];
      break;
    case 'danger':
      backgroundColor = theme.colors.error[50];
      textColor = theme.colors.error[700];
      break;
    case 'warning':
      backgroundColor = theme.colors.warning[50];
      textColor = theme.colors.warning[800];
      break;
    case 'info':
      backgroundColor = theme.colors.primary[50];
      textColor = theme.colors.primary[800];
      break;
    case 'neutral':
    default:
      backgroundColor = theme.colors.neutral[200];
      textColor = theme.colors.neutral[700];
      break;
  }

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor,
          paddingVertical: size === 'small' ? 3 : 5,
          paddingHorizontal: size === 'small' ? 8 : 12,
          borderRadius: theme.radii.full,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: textColor,
            fontSize: size === 'small' ? 11 : 13,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});
