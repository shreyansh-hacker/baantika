import React from 'react';
import { Text, TextStyle } from 'react-native';
import { useTheme } from '../../theme';
import { formatCurrency, formatCompactCurrency } from '../../utils/currency';

interface CurrencyTextProps {
  amountPaise: number;
  size?: 'small' | 'medium' | 'large' | 'display';
  type?: 'balance' | 'expense' | 'neutral';
  compact?: boolean;
  style?: TextStyle;
}

export function CurrencyText({
  amountPaise,
  size = 'medium',
  type = 'neutral',
  compact = false,
  style,
}: CurrencyTextProps) {
  const theme = useTheme();

  let color: string = theme.colors.text.primary;
  if (type === 'balance') {
    if (amountPaise > 0) {
      color = theme.colors.balancePositive;
    } else if (amountPaise < 0) {
      color = theme.colors.balanceNegative;
    } else {
      color = theme.colors.balanceZero;
    }
  } else if (type === 'expense') {
    color = theme.colors.text.primary;
  }

  const fontSize =
    size === 'display' ? 34 : size === 'large' ? 24 : size === 'medium' ? 18 : 14;
  const fontWeight = size === 'display' ? '800' : '700';

  const text = compact
    ? formatCompactCurrency(amountPaise)
    : formatCurrency(amountPaise, { showSign: type === 'balance' });

  return (
    <Text
      style={[
        {
          color,
          fontSize,
          fontWeight,
        },
        style,
      ]}
    >
      {text}
    </Text>
  );
}
