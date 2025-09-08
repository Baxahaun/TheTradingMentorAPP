/**
 * Integration tests for security and privacy features
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthContext } from '../../../contexts/AuthContext';
import PrivacySettingsComponent from '../PrivacySettings';
import SecurityDashboard from '../SecurityDashboard';
import { useSecureJournal } from '../../../hooks/useSecureJournal';

// Mock the services
vi.mock('../../../services/EncryptionService');
vi.mock('../../../services/AuditLogService');
vi.mock('../../../services/PrivacySettingsService');
vi.mock('../../../services/SecureDataService');

// Mock Firebase
vi.mock('../../../lib/firebase', () => ({
  db: {},
  auth: {}
}));

// Mock the secure journal hook
vi.mock('../../../hooks/useSecureJournal');

const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com'
};

const mockAuthContext = {
  user: mockUser,
  loading: false,
  signIn: vi.fn(),
  signOut: vi.fn(),
  signUp: vi.fn()
};

const mockPrivacySettings = {
  userId: 'test-user-123',
  encryptionEnabled: true,
  encryptSensitiveFields: true,
  encryptEmotionalData: true,
  encryptPersonalNotes: true,
  allowDataSharing: false,
  allowAnonymousAnalytics: false,
  allowTemplateSharing: false,
  shareWithMentors: false,
  mentorEmails: [],
  requirePasswordForSensitiveData: false,
  sessionTimeout: 60,
  enableTwoFactorAuth: false,
  keepBackupsAfterDeletion: true,
  enableAuditLogging: true,
  alertOnSuspiciousActivity: true,
  emailSecurityAlerts: true,
  allowDataExport: true,
  exportFormats: ['json', 'pdf'],
  encryptExports: true,
  gdprCompliant: true,
  dataProcessingConsent: false,
  marketingConsent: false,
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockAuditSummary = {
  totalAccess: 25,
  recentActivity: [
    {
      id: 'log1',
      userId: 'test-user-123',
      action: 'read',
      resourceType: 'journal_entry',
      resourceId: 'entry123',
      timestamp: new Date(),
      success: true,
      riskLevel: 'low'
    }
  ],
  securityAlerts: [],
  riskAssessment: {
    level: 'low',
    factors: []
  }
};

const renderWithAuth = (component: React.ReactElement) => {
  return render(
    <AuthContext.Provider value={mockAuthContext}>
      {component}
    </AuthContext.Provider>
  );
};

describe('Security Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Privacy Settings Component', () => {
    it('should render privacy settings with all tabs', async () => {
      const mockPrivacyService = {
        getPrivacySettings: vi.fn().mockResolvedValue(mockPrivacySettings),
        generateAuditSummary: vi.fn().mockResolvedValue(mockAuditSummary),
        validatePrivacySettings: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
        updatePrivacySettings: vi.fn().mockResolvedValue(undefined)
      };

      // Mock the service instance
      vi.doMock('../../../services/PrivacySettingsService', () => ({
        default: {
          getInstance: () => mockPrivacyService
        }
      }));

      renderWithAuth(<PrivacySettingsComponent />);

      // Check that all tabs are present
      expect(screen.getByText('Encryption')).toBeInTheDocument();
      expect(screen.getByText('Sharing')).toBeInTheDocument();
      expect(screen.getByText('Access')).toBeInTheDocument();
      expect(screen.getByText('Audit')).toBeInTheDocument();
      expect(screen.getByText('Data')).toBeInTheDocument();

      // Wait for settings to load
      await waitFor(() => {
        expect(mockPrivacyService.getPrivacySettings).toHaveBeenCalledWith('test-user-123');
      });
    });

    it('should toggle encryption settings', async () => {
      const mockPrivacyService = {
        getPrivacySettings: vi.fn().mockResolvedValue(mockPrivacySettings),
        generateAuditSummary: vi.fn().mockResolvedValue(mockAuditSummary),
        validatePrivacySettings: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
        updatePrivacySettings: vi.fn().mockResolvedValue(undefined)
      };

      vi.doMock('../../../services/PrivacySettingsService', () => ({
        default: {
          getInstance: () => mockPrivacyService
        }
      }));

      renderWithAuth(<PrivacySettingsComponent />);

      await waitFor(() => {
        expect(screen.getByText('Enable Encryption')).toBeInTheDocument();
      });

      // Find and click the encryption toggle
      const encryptionToggle = screen.getByRole('switch', { name: /enable encryption/i });
      fireEvent.click(encryptionToggle);

      await waitFor(() => {
        expect(mockPrivacyService.updatePrivacySettings).toHaveBeenCalledWith(
          'test-user-123',
          { encryptionEnabled: false }
        );
      });
    });

    it('should add and remove mentor emails', async () => {
      const settingsWithMentors = {
        ...mockPrivacySettings,
        shareWithMentors: true,
        mentorEmails: ['mentor1@example.com']
      };

      const mockPrivacyService = {
        getPrivacySettings: vi.fn().mockResolvedValue(settingsWithMentors),
        generateAuditSummary: vi.fn().mockResolvedValue(mockAuditSummary),
        validatePrivacySettings: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
        updatePrivacySettings: vi.fn().mockResolvedValue(undefined)
      };

      vi.doMock('../../../services/PrivacySettingsService', () => ({
        default: {
          getInstance: () => mockPrivacyService
        }
      }));

      renderWithAuth(<PrivacySettingsComponent />);

      // Switch to sharing tab
      fireEvent.click(screen.getByText('Sharing'));

      await waitFor(() => {
        expect(screen.getByText('mentor1@example.com')).toBeInTheDocument();
      });

      // Add new mentor email
      const emailInput = screen.getByPlaceholderText('mentor@example.com');
      fireEvent.change(emailInput, { target: { value: 'mentor2@example.com' } });
      fireEvent.click(screen.getByText('Add'));

      await waitFor(() => {
        expect(mockPrivacyService.updatePrivacySettings).toHaveBeenCalledWith(
          'test-user-123',
          { mentorEmails: ['mentor1@example.com', 'mentor2@example.com'] }
        );
      });
    });

    it('should handle export data functionality', async () => {
      const mockPrivacyService = {
        getPrivacySettings: vi.fn().mockResolvedValue(mockPrivacySettings),
        generateAuditSummary: vi.fn().mockResolvedValue(mockAuditSummary),
        validatePrivacySettings: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
        updatePrivacySettings: vi.fn().mockResolvedValue(undefined),
        exportUserData: vi.fn().mockResolvedValue({
          data: { entries: [] },
          encrypted: true
        })
      };

      vi.doMock('../../../services/PrivacySettingsService', () => ({
        default: {
          getInstance: () => mockPrivacyService
        }
      }));

      // Mock URL.createObjectURL and related DOM methods
      global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();
      
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn()
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);

      renderWithAuth(<PrivacySettingsComponent />);

      // Switch to data tab
      fireEvent.click(screen.getByText('Data'));

      await waitFor(() => {
        expect(screen.getByText('Export All Data')).toBeInTheDocument();
      });

      // Click export button
      fireEvent.click(screen.getByText('Export All Data'));

      await waitFor(() => {
        expect(mockPrivacyService.exportUserData).toHaveBeenCalledWith('test-user-123', 'json');
        expect(mockLink.click).toHaveBeenCalled();
      });
    });
  });

  describe('Security Dashboard Component', () => {
    it('should render security overview cards', async () => {
      const mockAuditService = {
        generateAuditSummary: vi.fn().mockResolvedValue(mockAuditSummary),
        getUserAccessHistory: vi.fn().mockResolvedValue(mockAuditSummary.recentActivity),
        getSecurityAlerts: vi.fn().mockResolvedValue([])
      };

      vi.doMock('../../../services/AuditLogService', () => ({
        default: {
          getInstance: () => mockAuditService
        }
      }));

      renderWithAuth(<SecurityDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Total Access Events')).toBeInTheDocument();
        expect(screen.getByText('Security Alerts')).toBeInTheDocument();
        expect(screen.getByText('Risk Level')).toBeInTheDocument();
        expect(screen.getByText('25')).toBeInTheDocument(); // Total access count
      });
    });

    it('should display access history in activity log', async () => {
      const mockAuditService = {
        generateAuditSummary: vi.fn().mockResolvedValue(mockAuditSummary),
        getUserAccessHistory: vi.fn().mockResolvedValue([
          {
            id: 'log1',
            userId: 'test-user-123',
            action: 'read',
            resourceType: 'journal_entry',
            resourceId: 'entry123',
            timestamp: new Date('2024-01-01T10:00:00Z'),
            success: true,
            riskLevel: 'low',
            sessionId: 'session_123'
          },
          {
            id: 'log2',
            userId: 'test-user-123',
            action: 'write',
            resourceType: 'journal_entry',
            resourceId: 'entry124',
            timestamp: new Date('2024-01-01T11:00:00Z'),
            success: true,
            riskLevel: 'medium',
            details: {
              fieldsModified: ['emotionalState']
            }
          }
        ]),
        getSecurityAlerts: vi.fn().mockResolvedValue([])
      };

      vi.doMock('../../../services/AuditLogService', () => ({
        default: {
          getInstance: () => mockAuditService
        }
      }));

      renderWithAuth(<SecurityDashboard />);

      // Activity log should be the default tab
      await waitFor(() => {
        expect(screen.getByText('Read')).toBeInTheDocument();
        expect(screen.getByText('Write')).toBeInTheDocument();
        expect(screen.getByText('Modified: emotionalState')).toBeInTheDocument();
      });
    });

    it('should display security alerts when present', async () => {
      const mockSecurityAlerts = [
        {
          id: 'alert1',
          userId: 'test-user-123',
          alertType: 'suspicious_activity',
          severity: 'high',
          description: 'Multiple rapid access attempts detected',
          timestamp: new Date(),
          relatedLogs: ['log1', 'log2'],
          resolved: false
        }
      ];

      const mockAuditService = {
        generateAuditSummary: vi.fn().mockResolvedValue({
          ...mockAuditSummary,
          securityAlerts: mockSecurityAlerts
        }),
        getUserAccessHistory: vi.fn().mockResolvedValue([]),
        getSecurityAlerts: vi.fn().mockResolvedValue(mockSecurityAlerts)
      };

      vi.doMock('../../../services/AuditLogService', () => ({
        default: {
          getInstance: () => mockAuditService
        }
      }));

      renderWithAuth(<SecurityDashboard />);

      // Switch to alerts tab
      fireEvent.click(screen.getByText('Security Alerts'));

      await waitFor(() => {
        expect(screen.getByText('Multiple rapid access attempts detected')).toBeInTheDocument();
        expect(screen.getByText('HIGH')).toBeInTheDocument();
        expect(screen.getByText('2 related events')).toBeInTheDocument();
      });
    });

    it('should refresh security data when refresh button is clicked', async () => {
      const mockAuditService = {
        generateAuditSummary: vi.fn().mockResolvedValue(mockAuditSummary),
        getUserAccessHistory: vi.fn().mockResolvedValue([]),
        getSecurityAlerts: vi.fn().mockResolvedValue([])
      };

      vi.doMock('../../../services/AuditLogService', () => ({
        default: {
          getInstance: () => mockAuditService
        }
      }));

      renderWithAuth(<SecurityDashboard />);

      await waitFor(() => {
        expect(mockAuditService.generateAuditSummary).toHaveBeenCalledTimes(1);
      });

      // Click refresh button
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(mockAuditService.generateAuditSummary).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Secure Journal Hook Integration', () => {
    it('should integrate security services with journal operations', async () => {
      const mockSecureJournal = {
        privacySettings: mockPrivacySettings,
        isEncrypted: true,
        saveStatus: 'idle',
        error: null,
        securelyCreateEntry: vi.fn().mockResolvedValue({
          id: 'entry123',
          date: '2024-01-01',
          content: 'Test entry'
        }),
        securelyUpdateEntry: vi.fn().mockResolvedValue(undefined),
        securelyGetEntry: vi.fn().mockResolvedValue({
          id: 'entry123',
          date: '2024-01-01',
          content: 'Test entry'
        }),
        hasPermission: vi.fn().mockResolvedValue(true)
      };

      (useSecureJournal as any).mockReturnValue(mockSecureJournal);

      // Test component that uses the hook
      const TestComponent = () => {
        const secureJournal = useSecureJournal();
        
        return (
          <div>
            <div data-testid="encryption-status">
              {secureJournal.isEncrypted ? 'Encrypted' : 'Not Encrypted'}
            </div>
            <button
              onClick={() => secureJournal.securelyCreateEntry({
                date: '2024-01-01',
                content: 'Test entry'
              })}
            >
              Create Entry
            </button>
          </div>
        );
      };

      renderWithAuth(<TestComponent />);

      expect(screen.getByTestId('encryption-status')).toHaveTextContent('Encrypted');

      fireEvent.click(screen.getByText('Create Entry'));

      await waitFor(() => {
        expect(mockSecureJournal.securelyCreateEntry).toHaveBeenCalledWith({
          date: '2024-01-01',
          content: 'Test entry'
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle privacy settings loading errors', async () => {
      const mockPrivacyService = {
        getPrivacySettings: vi.fn().mockRejectedValue(new Error('Network error')),
        generateAuditSummary: vi.fn().mockResolvedValue(mockAuditSummary)
      };

      vi.doMock('../../../services/PrivacySettingsService', () => ({
        default: {
          getInstance: () => mockPrivacyService
        }
      }));

      renderWithAuth(<PrivacySettingsComponent />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load privacy settings')).toBeInTheDocument();
      });
    });

    it('should handle audit data loading errors', async () => {
      const mockAuditService = {
        generateAuditSummary: vi.fn().mockRejectedValue(new Error('Network error')),
        getUserAccessHistory: vi.fn().mockRejectedValue(new Error('Network error')),
        getSecurityAlerts: vi.fn().mockRejectedValue(new Error('Network error'))
      };

      vi.doMock('../../../services/AuditLogService', () => ({
        default: {
          getInstance: () => mockAuditService
        }
      }));

      renderWithAuth(<SecurityDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load security data')).toBeInTheDocument();
      });
    });
  });
});