/**
 * Mock User Data for Testing
 */

import { vi } from 'vitest';

export const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: 'https://example.com/avatar.jpg',
  emailVerified: true,
  isAnonymous: false,
  metadata: {
    creationTime: '2024-01-01T00:00:00Z',
    lastSignInTime: '2024-01-15T10:00:00Z',
  },
  providerData: [
    {
      providerId: 'password',
      uid: 'test@example.com',
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: null,
      phoneNumber: null,
    },
  ],
  refreshToken: 'mock-refresh-token',
  tenantId: null,
  delete: vi.fn(),
  getIdToken: vi.fn().mockResolvedValue('mock-id-token'),
  getIdTokenResult: vi.fn().mockResolvedValue({
    token: 'mock-id-token',
    authTime: '2024-01-15T10:00:00Z',
    issuedAtTime: '2024-01-15T10:00:00Z',
    expirationTime: '2024-01-15T11:00:00Z',
    signInProvider: 'password',
    signInSecondFactor: null,
    claims: {},
  }),
  reload: vi.fn(),
  toJSON: vi.fn().mockReturnValue({
    uid: 'test-user-123',
    email: 'test@example.com',
    displayName: 'Test User',
  }),
};

export const mockAuthState = {
  user: mockUser,
  loading: false,
  error: null,
  signIn: vi.fn().mockResolvedValue(mockUser),
  signOut: vi.fn().mockResolvedValue(undefined),
  signUp: vi.fn().mockResolvedValue(mockUser),
  resetPassword: vi.fn().mockResolvedValue(undefined),
};

export const mockUserPreferences = {
  theme: 'light',
  currency: 'USD',
  timezone: 'UTC',
  dateFormat: 'MM/dd/yyyy',
  timeFormat: '24h',
  language: 'en',
  notifications: {
    email: true,
    push: false,
    tradeAlerts: true,
    systemUpdates: false,
  },
  trading: {
    defaultRiskPercentage: 2,
    defaultStopLoss: 50,
    defaultTakeProfit: 100,
    autoCalculatePositionSize: true,
  },
  display: {
    showUnrealizedPnL: true,
    showCommissions: true,
    showSwaps: true,
    compactView: false,
  },
};

export default mockUser;