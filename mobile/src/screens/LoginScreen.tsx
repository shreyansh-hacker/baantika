import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input, Icon } from '../components/common';

export function LoginScreen({ navigation }: any) {
  const theme = useTheme();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      await login({ email: email.trim(), password });
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (error: any) {
      setErrorMessage(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Header */}
        <View style={styles.header}>
          <View
            style={[
              styles.logoBadge,
              { backgroundColor: theme.colors.primary[900] },
            ]}
          >
            <Icon name="rupee" size={32} color="#FFFFFF" />
          </View>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            Welcome to Baantika
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
            Sign in to manage your group expenses
          </Text>
        </View>

        {/* Error Banner */}
        {errorMessage && (
          <View
            style={[
              styles.errorBanner,
              {
                backgroundColor: theme.colors.error[50],
                borderColor: theme.colors.error[200],
              },
            ]}
          >
            <Icon name="alert-circle" size={18} color={theme.colors.error[600]} />
            <Text
              style={[styles.errorBannerText, { color: theme.colors.error[700] }]}
            >
              {errorMessage}
            </Text>
          </View>
        )}

        {/* Form */}
        <View style={styles.form}>
          <Input
            label="Email Address"
            placeholder="you@example.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setErrorMessage(null);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setErrorMessage(null);
            }}
            secureTextEntry
          />

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            style={styles.submitBtn}
          />

          {/* Quick Demo Fill */}
          <TouchableOpacity
            onPress={() => {
              setEmail('aarav@baantika.local');
              setPassword('Baantika@123');
              setErrorMessage(null);
            }}
            style={styles.demoFillBtn}
          >
            <Text style={[styles.demoFillText, { color: theme.colors.accent[700] }]}>
              Demo Credentials: aarav@baantika.local
            </Text>
          </TouchableOpacity>
        </View>

        {/* Switch to Register */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.text.secondary }]}>
            Don't have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text
              style={[
                styles.signupLink,
                { color: theme.colors.accent[600] },
              ]}
            >
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
    gap: 8,
  },
  errorBannerText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  form: {
    width: '100%',
  },
  submitBtn: {
    marginTop: 8,
  },
  demoFillBtn: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  demoFillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 14,
  },
  signupLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});
