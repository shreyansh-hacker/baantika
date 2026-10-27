import * as Keychain from 'react-native-keychain';
import { AuthTokens, User } from '../types';

const TOKEN_KEY = 'baantika_auth_tokens';
const USER_KEY = 'baantika_user_profile';

// Fast in-memory cache
let inMemoryTokens: AuthTokens | null = null;
let inMemoryUser: User | null = null;

/**
 * Stores mobile auth tokens inside the hardware-backed Android Keystore
 * (via react-native-keychain). Never stores in plain text or AsyncStorage.
 */
export async function saveAuthTokens(tokens: AuthTokens): Promise<void> {
  inMemoryTokens = tokens;
  try {
    const serialized = JSON.stringify(tokens);
    await Keychain.setGenericPassword(TOKEN_KEY, serialized, {
      service: 'com.baantika.auth',
      securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
    });
  } catch (error) {
    // If hardware-backed keystore is unavailable (e.g. older emulator), fall back to standard secure keychain
    try {
      await Keychain.setGenericPassword(TOKEN_KEY, JSON.stringify(tokens), {
        service: 'com.baantika.auth',
      });
    } catch {
      // Retain in-memory
    }
  }
}

/**
 * Retrieves tokens from Android Keystore
 */
export async function getAuthTokens(): Promise<AuthTokens | null> {
  if (inMemoryTokens) {
    return inMemoryTokens;
  }

  try {
    const credentials = await Keychain.getGenericPassword({
      service: 'com.baantika.auth',
    });

    if (credentials && credentials.password) {
      const parsed = JSON.parse(credentials.password) as AuthTokens;
      inMemoryTokens = parsed;
      return parsed;
    }
  } catch {
    // Fallback to inMemory
  }

  return inMemoryTokens;
}

/**
 * Clears tokens from Android Keystore
 */
export async function clearAuthTokens(): Promise<void> {
  inMemoryTokens = null;
  inMemoryUser = null;
  try {
    await Keychain.resetGenericPassword({ service: 'com.baantika.auth' });
    await Keychain.resetGenericPassword({ service: 'com.baantika.user' });
  } catch {
    // Ignore error
  }
}

/**
 * Stores user profile
 */
export async function saveUserProfile(user: User): Promise<void> {
  inMemoryUser = user;
  try {
    await Keychain.setGenericPassword(USER_KEY, JSON.stringify(user), {
      service: 'com.baantika.user',
    });
  } catch {
    // Retain in memory
  }
}

/**
 * Retrieves user profile
 */
export async function getUserProfile(): Promise<User | null> {
  if (inMemoryUser) {
    return inMemoryUser;
  }

  try {
    const credentials = await Keychain.getGenericPassword({
      service: 'com.baantika.user',
    });

    if (credentials && credentials.password) {
      const parsed = JSON.parse(credentials.password) as User;
      inMemoryUser = parsed;
      return parsed;
    }
  } catch {
    // Return in-memory fallback
  }

  return inMemoryUser;
}

/**
 * Synchronous token reader for instant Axios request interceptors
 */
export function getCachedAccessToken(): string | null {
  return inMemoryTokens?.accessToken ?? null;
}
