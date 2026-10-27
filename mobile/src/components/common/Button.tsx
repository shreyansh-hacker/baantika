import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../theme';
import { Icon, IconName } from './Icon';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'text';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: IconName;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}: ButtonProps) {
  const theme = useTheme();

  const getContainerStyle = (): ViewStyle => {
    let backgroundColor: string = 'transparent';
    let borderWidth = 0;
    let borderColor = 'transparent';

    switch (variant) {
      case 'primary':
        backgroundColor = disabled ? theme.colors.neutral[300] : theme.colors.primary[900];
        break;
      case 'secondary':
        backgroundColor = disabled ? theme.colors.neutral[200] : theme.colors.accent[500];
        break;
      case 'outline':
        backgroundColor = 'transparent';
        borderWidth = 1.5;
        borderColor = disabled ? theme.colors.neutral[300] : theme.colors.primary[900];
        break;
      case 'danger':
        backgroundColor = disabled ? theme.colors.neutral[300] : theme.colors.error[500];
        break;
      case 'text':
        backgroundColor = 'transparent';
        break;
    }

    return {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radii.md,
      paddingHorizontal: size === 'small' ? theme.spacing.md : theme.spacing.xl,
      height: size === 'small' ? 38 : size === 'large' ? 56 : 48,
      backgroundColor,
      borderWidth,
      borderColor,
    };
  };

  const getTextColor = (): string => {
    if (disabled) return theme.colors.neutral[500];
    switch (variant) {
      case 'primary':
      case 'danger':
        return '#FFFFFF';
      case 'secondary':
        return '#FFFFFF';
      case 'outline':
        return theme.colors.primary[900];
      case 'text':
        return theme.colors.primary[700];
      default:
        return '#FFFFFF';
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[getContainerStyle(), style]}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon && (
            <Icon
              name={icon}
              size={size === 'small' ? 18 : 20}
              color={getTextColor()}
            />
          )}
          <Text
            style={[
              {
                color: getTextColor(),
                fontSize: size === 'small' ? 14 : 16,
                fontWeight: '600',
                marginLeft: icon ? theme.spacing.sm : 0,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
