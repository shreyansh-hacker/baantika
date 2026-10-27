import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  prefix?: string;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  helperText,
  prefix,
  containerStyle,
  style,
  ...props
}: InputProps) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = error
    ? theme.colors.error[500]
    : isFocused
    ? theme.colors.primary[900]
    : theme.colors.border;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: theme.colors.text.primary }]}>
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.colors.surface,
            borderColor,
          },
        ]}
      >
        {prefix && (
          <Text
            style={[
              styles.prefix,
              { color: isFocused ? theme.colors.primary[900] : theme.colors.text.secondary },
            ]}
          >
            {prefix}
          </Text>
        )}

        <TextInput
          style={[
            styles.input,
            { color: theme.colors.text.primary },
            style,
          ]}
          placeholderTextColor={theme.colors.neutral[500]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
      </View>

      {error ? (
        <Text style={[styles.errorText, { color: theme.colors.error[500] }]}>
          {error}
        </Text>
      ) : helperText ? (
        <Text style={[styles.helperText, { color: theme.colors.text.secondary }]}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 50,
  },
  prefix: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
    padding: 0,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
});
