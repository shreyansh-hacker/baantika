import jwt from 'jsonwebtoken';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';
import { logger } from '../../lib/logger';
import {
  AuthenticationError,
  ConflictError,
} from '../../lib/errors';
import { RegisterInput, LoginInput } from './schema';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 30;

/**
 * Hash a refresh token for storage (we never store raw tokens).
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Issue a JWT access token and a refresh token (stored hashed in the DB).
 */
async function issueTokens(
  userId: string,
  deviceInfo?: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = jwt.sign({ sub: userId }, env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });

  const refreshToken = uuidv4();
  const tokenHash = hashToken(refreshToken);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  await prisma.refreshSession.create({
    data: {
      userId,
      tokenHash,
      deviceInfo: deviceInfo ?? null,
      expiresAt,
    },
  });

  return { accessToken, refreshToken };
}

/**
 * Register a new user.
 */
export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ConflictError('A user with this email already exists');
  }

  const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });

  const user = await prisma.user.create({
    data: {
      email: input.email,
      displayName: input.displayName,
      passwordHash,
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      createdAt: true,
    },
  });

  const tokens = await issueTokens(user.id);

  logger.info({ userId: user.id }, 'User registered');

  return { user, ...tokens };
}

/**
 * Login an existing user.
 * Uses generic error messages to prevent account enumeration.
 */
export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      email: true,
      displayName: true,
      passwordHash: true,
      isDeleted: true,
    },
  });

  if (!user || user.isDeleted) {
    throw new AuthenticationError('Invalid email or password');
  }

  const valid = await argon2.verify(user.passwordHash, input.password);
  if (!valid) {
    throw new AuthenticationError('Invalid email or password');
  }

  const tokens = await issueTokens(user.id);

  logger.info({ userId: user.id }, 'User logged in');

  return {
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    },
    ...tokens,
  };
}

/**
 * Refresh session – verify refresh token, rotate (revoke old, issue new).
 */
export async function refreshSession(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);

  const session = await prisma.refreshSession.findFirst({
    where: { tokenHash, revoked: false },
    include: { user: { select: { id: true, isDeleted: true } } },
  });

  if (!session) {
    throw new AuthenticationError('Invalid refresh token');
  }

  if (session.expiresAt < new Date()) {
    await prisma.refreshSession.update({
      where: { id: session.id },
      data: { revoked: true },
    });
    throw new AuthenticationError('Refresh token has expired');
  }

  if (session.user.isDeleted) {
    throw new AuthenticationError('Account has been deactivated');
  }

  // Revoke the old session
  await prisma.refreshSession.update({
    where: { id: session.id },
    data: { revoked: true },
  });

  // Issue new tokens
  const tokens = await issueTokens(session.userId, session.deviceInfo ?? undefined);

  logger.info({ userId: session.userId }, 'Session refreshed');

  return tokens;
}

/**
 * Logout – revoke the refresh session.
 */
export async function logout(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);

  const session = await prisma.refreshSession.findFirst({
    where: { tokenHash, revoked: false },
  });

  if (session) {
    await prisma.refreshSession.update({
      where: { id: session.id },
      data: { revoked: true },
    });
    logger.info({ userId: session.userId }, 'User logged out');
  }
  // If session not found, still return success (idempotent)
}

/**
 * Verify an access token and return the decoded payload.
 */
export function verifyAccessToken(token: string): { sub: string } {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { sub: string };
    return decoded;
  } catch {
    throw new AuthenticationError('Invalid or expired token');
  }
}
