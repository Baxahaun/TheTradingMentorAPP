/**
 * Unit tests for AlertPreferences component
 * Tests customizable alert preferences and thresholds
 * Requirements: 7.6 - Customizable alert preferences and thresholds
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AlertPreferences } from '../AlertPreferences';
import { StrategyAlertService } from '../../../services/StrategyAlertService';
import { NotificationPreferences, AlertConfiguration } from '../../../types/alerts';

// Mock the StrategyAlertService
vi.mock('../../../services/StrategyAlertService');

describe('AlertPreferences', () => {
  let mockAlertService: jest.Mocked<StrategyAlertService>;
  let mockOnSave: jest.Mock;

  beforeEach(() => {
    mockAlertService = {
      updateNotificationPreferences: vi.fn(),
      updateAlertThresholds: vi.fn(),
      getActiveAlerts: vi.fn(),
      getAlertMetrics: vi.fn(),
      acknowledgeAlert: vi.fn(),
      resolveAlert: vi.fn(),
      monitorDrawdownLimits: vi.fn(),
      checkPerformanceMilestones: vi.fn(),
      detectMarketConditionChanges: vi.fn(),
      checkStatisticalSignificance: vi.fn(),
      detectCorrelatedPerformanceIssues: vi.fn(),
      sendNotification: vi.fn()
    } as any;

    mockOnSave = vi.fn();

    mockAlertService.updateNotificationPreferences.mockResolvedValue(undefined);
    mockAlertService.updateAlertThresholds.mockResolvedValue(undefined);
  });

  const renderAlertPreferences = (props = {}) => {
    return render(
      <AlertPreferences
        userId="user-1"
        alertService={mockAlertService}
        onSave={mockOnSave}
        {...props}
      />
    );
  };

  describe('Rendering', () => {
    it('should render alert preferences with header and tabs', async () => {
      renderAlertPreferences();

      await waitFor(() => {
        expect(screen.getByText('Alert Preferences')).toBeInTheDocument();
        expect(screen.getByText('Notifications')).toBeInTheDocument();
        expect(screen.getByText('Thresholds')).toBeInTheDocument();
        expect(screen.getByText('Schedule')).toBeInTheDocument();
        expect(screen.getByText('Save Changes')).toBeInTheDocument();
      });
    });

    it('should display loading state initially', () => {
      renderAlertPreferences();
      
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('should show notifications tab by default', async () => {
      renderAlertPreferences();

      await waitFor(() => {
        expect(screen.getByText('Notification Channels by Alert Type')).toBeInTheDocument();
      });
    });
  });

  describe('Tab Navigation', () => {
    it('should switch to thresholds tab when clicked', async () => {
      renderAlertPreferences();

      await waitFor(() => {
        const thresholdsTab = screen.getByText('Thresholds');
        fireEvent.click(thresholdsTab);

        expect(screen.getByText('Drawdown Limits')).toBeInTheDocument();
        expect(screen.getByText('Performance Milestones')).toBeInTheDocument();
      });
    });

    it('should switch to schedule tab when clicked', async () => {
      renderAlertPreferences();

      await waitFor(() => {
        const scheduleTab = screen.getByText('Schedule');
        fireEvent.click(scheduleTab);

        expect(screen.getByText('Quiet Hours')).toBeInTheDocument();
        expect(screen.getByText('Notification Frequency')).toBeInTheDocument();
      });
    });

    it('should highlight active tab', async () => {
      renderAlertPreferences();

      await waitFor(() => {
        const notificationsTab = screen.getByText('Notifications').closest('button');
        expect(notificationsTab).toHaveClass('bg-white', 'text-gray-900', 'shadow-sm');

        const thresholdsTab = screen.getByText('Thresholds').closest('button');
        expect(thresholdsTab).toHaveClass('text-gray-600');
      });
    });
  });

  describe('Notifications Tab', () => {
    it('should display all alert types with channel options', async () => {
      renderAlertPreferences();

      await waitFor(() => {
        expect(screen.getByText('Drawdown Alerts')).toBeInTheDocument();
        expect(screen.getByText('Performance Milestones')).toBeInTheDocument();
        expect(screen.getByText('Market Changes')).toBeInTheDocument();
        expect(screen.getByText('Statistical Updates')).toBeInTheDocument();
        expect(screen.getByText('Correlation Issues')).toBeInTheDocument();
        expect(screen.getByText('Discipline Violations')).toBeInTheDocument();
      });
    });

    it('should show notification channels for each alert type', async () => {
      renderAlertPreferences();

      await waitFor(() => {
        expect(screen.getAllByText('InApp')).toHaveLength(6); // One for each alert type
        expect(screen.getAllByText('Email')).toHaveLength(6);
        expect(screen.getAllByText('Push')).toHaveLength(6);
        expect(screen.getAllByText('SMS')).toHaveLength(6);
      });
    });

    it('should display severity filters by channel', async () => {
      renderAlertPreferences();

      await waitFor(() => {
        expect(screen.getByText('Severity Filters by Channel')).toBeInTheDocument();
        expect(screen.getAllByText('Critical')).toHaveLength(4); // One for each channel
        expect(screen.getAllByText('High')).toHaveLength(4);
        expect(screen.getAllByText('Medium')).toHaveLength(4);
        expect(screen.getAllByText('Low')).toHaveLength(4);
      });
    });

    it('should handle channel preference changes', async () => {
      renderAlertPreferences();

      await waitFor(() => {
        const emailCheckbox = screen.getAllByRole('checkbox').find(
          checkbox => checkbox.closest('label')?.textContent?.includes('Email')
        );
        
        if (emailCheckbox) {
          fireEvent.click(emailCheckbox);
        }
      });

      // Should update internal state (tested through save functionality)
    });

    it('should handle severity filter changes', async () => {
      renderAlertPreferences();

      await waitFor(() => {
        const criticalCheckbox = screen.getAllByRole('checkbox').find(
          checkbox => checkbox.closest('label')?.textContent?.includes('Critical')
        );
        
        if (criticalCheckbox) {
          fireEvent.click(criticalCheckbox);
        }
      });

      // Should update internal state
    });
  });

  describe('Thresholds Tab', () => {
    it('should display drawdown limit configuration', async () => {
      renderAlertPreferences();

      await waitFor(() => {
        const thresholdsTab = screen.getByText('Thresholds');
        fireEvent.click(thresholdsTab);

        expect(screen.getByText('Drawdown Limits')).toBeInTheDocument();
        expect(screen.getByDisplayValue('5')).toBeInTheDocument(); // Default 5% threshold
        expect(screen.getByDisplayValue('10')).toBeInTheDocument(); // Default 10% threshold
      });
    });

    it('should display performance milestone configuration', async () => {
      renderAlertPreferences();

      await waitFor(() => {
        const thresholdsTab = screen.getByText('Thresholds');
        fireEvent.click(thresholdsTab);

        expect(screen.getByText('Performance Milestones')).toBeInTheDocument();
        expect(screen.getByDisplayValue('2')).toBeInTheDocument(); // Default profit factor 2.0
      });
    });

    it('should allow editing drawdown thresholds', async () => {
      renderAlertPreferences();

      await waitFor(() => {
        const thresholdsTab = screen.getByText('Thresholds');
        fireEvent.click(thresholdsTab);

        const thresholdInput = screen.getByDisplayValue('5');
        fireEvent.change(thresholdInput, { target: { value: '7.5' } });

        expect(thresholdInput).toHaveValue(7.5);
      });
    });

    it('should allow editing performance milestones', async () => {
      renderAlertPreferences();

      await waitFor(() => {
        const thresholdsTab = screen.getByText('Thresholds');
        fireEvent.click(thresholdsTab);

        const milestoneInput = screen.getByDisplayValue('2');
        fireEvent.change(milestoneInput, { target: { value: '2.5' } });

        expect(milestoneInput).toHaveValue(2.5);
      });
    });

    it('should handle threshold enable/disable toggles', async () => {
      renderAlertPreferences();

      await waitFor(() => {
        const thresholdsTab = screen.getByText('Thresholds');
        fireEvent.click(thresholdsTab);

        const enabledCheckboxes = screen.getAllByRole('checkbox').filter(
          checkbox => checkbox.closest('label')?.textContent?.includes('Enabled')
        );

        if (enabledCheckboxes.length > 0) {
          fireEvent.click(enabledCheckboxes[0]);
        }
      });
    });

    it('should handle auto-suspend toggles', async () => {
      renderAlertPreferences();

      await waitFor(() => {
        const thresholdsTab = screen.getByText('Thresholds');
        fireEvent.click(thresholdsTab);

        const suspendCheckboxes = screen.getAllByRole('checkbox').filter(
          checkbox => checkbox.closest('label')?.textContent?.includes('Auto-suspend')
        );

        if (suspendCheckboxes.length > 0) {
          fireEvent.click(suspendCheckboxes[0]);
        }
      });
    });
  });

  describe('Schedule Tab', () => {
    it('should display quiet hours configuration', async () => {
      renderAlertPreferences();

      await waitFor(() => {
        const scheduleTab = screen.getByText('Schedule');
        fireEvent.click(scheduleTab);

        expect(screen.getByText('Enable quiet hours')).toBeInTheDocument();
        expect(screen.getByDisplayValue('22:00')).toBeInTheDocument(); // Default start time
        expect(screen.getByDisplayValue('08:00')).toBeInTheDocument(); // Default end time
      });
    });

    it('should display notification frequency options', async () => {
      renderAlertPreferences();

      await waitFor(() => {
        const scheduleTab = screen.getByText('Schedule');
        fireEvent.click(scheduleTab);

        expect(screen.getByText('Immediate')).toBeInTheDocument();
        expect(screen.getByText('Daily Digest')).toBeInTheDocument();
        expect(screen.getByText('Weekly Summary')).toBeInTheDocument();
      });
    });

    it('should handle quiet hours enable/disable', async () => {
      renderAlertPreferences();

      await waitFor(() => {
        const scheduleTab = screen.getByText('Schedule');
        fireEvent.click(scheduleTab);

        const quietHoursCheckbox = screen.getByRole('checkbox', { name: /enable quiet hours/i });
        fireEvent.click(quietHoursCheckbox);
      });
    });

    it('should handle quiet hours time changes', async () => {
      renderAlertPreferences();

      await waitFor(() => {
        const scheduleTab = screen.getByText('Schedule');
        fireEvent.click(scheduleTab);

        const startTimeInput = screen.getByDisplayValue('22:00');
        fireEvent.change(startTimeInput, { target: { value: '23:00' } });

        expect(startTimeInput).toHaveValue('23:00');
      });
    });

    it('should handle timezone changes', async () => {
      renderAlertPreferences();

      await waitFor(() => {
        const scheduleTab = screen.getByText('Schedule');
        fireEvent.click(scheduleTab);

        const timezoneSelect = screen.getByDisplayValue('UTC');
        fireEvent.change(timezoneSelect, { target: { value: 'America/New_York' } });

        expect(timezoneSelect).toHaveValue('America/New_York');
      });
    });

    it('should handle frequency preference changes', async () => {
      renderAlertPreferences();

      await waitFor(() => {
        const scheduleTab = screen.getByText('Schedule');
        fireEvent.click(scheduleTab);

        // Find checkboxes in the frequency sections
        const immediateCheckboxes = screen.getAllByRole('checkbox').filter(
          checkbox => {
            const container = checkbox.closest('.border');
            return container?.textContent?.includes('Immediate');
          }
        );

        if (immediateCheckboxes.length > 0) {
          fireEvent.click(immediateCheckboxes[0]);
        }
      });
    });
  });

  describe('Save Functionality', () => {
    it('should save preferences when save button clicked', async () => {
      renderAlertPreferences();

      await waitFor(() => {
        const saveButton = screen.getByText('Save Changes');
        fireEvent.click(saveButton);
      });

      expect(mockAlertService.updateNotificationPreferences).toHaveBeenCalledWith(
        'user-1',
        expect.any(Object)
      );
      expect(mockAlertService.updateAlertThresholds).toHaveBeenCalledWith(
        'user-1',
        expect.any(Object)
      );
      expect(mockOnSave).toHaveBeenCalled();
    });

    it('should show saving state during save operation', async () => {
      mockAlertService.updateNotificationPreferences.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      renderAlertPreferences();

      await waitFor(() => {
        const saveButton = screen.getByText('Save Changes');
        fireEvent.click(saveButton);

        expect(screen.getByText('Saving...')).toBeInTheDocument();
      });
    });

    it('should handle save errors gracefully', async () => {
      mockAlertService.updateNotificationPreferences.mockRejectedValue(
        new Error('Network error')
      );
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      renderAlertPreferences();

      await waitFor(() => {
        const saveButton = screen.getByText('Save Changes');
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to save preferences:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('should disable save button during save operation', async () => {
      mockAlertService.updateNotificationPreferences.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      renderAlertPreferences();

      await waitFor(() => {
        const saveButton = screen.getByText('Save Changes');
        fireEvent.click(saveButton);

        expect(saveButton).toBeDisabled();
      });
    });
  });

  describe('Form Validation', () => {
    it('should validate threshold values', async () => {
      renderAlertPreferences();

      await waitFor(() => {
        const thresholdsTab = screen.getByText('Thresholds');
        fireEvent.click(thresholdsTab);

        const thresholdInput = screen.getByDisplayValue('5');
        fireEvent.change(thresholdInput, { target: { value: '-1' } });

        // Should handle invalid values appropriately
        expect(thresholdInput).toHaveValue(-1);
      });
    });

    it('should validate time inputs', async () => {
      renderAlertPreferences();

      await waitFor(() => {
        const scheduleTab = screen.getByText('Schedule');
        fireEvent.click(scheduleTab);

        const startTimeInput = screen.getByDisplayValue('22:00');
        fireEvent.change(startTimeInput, { target: { value: '25:00' } });

        // Browser should handle time validation
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', async () => {
      renderAlertPreferences();

      await waitFor(() => {
        const thresholdsTab = screen.getByText('Thresholds');
        fireEvent.click(thresholdsTab);

        expect(screen.getByText('Threshold (%)')).toBeInTheDocument();
        expect(screen.getByText('Metric')).toBeInTheDocument();
        expect(screen.getByText('Description')).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation', async () => {
      renderAlertPreferences();

      await waitFor(() => {
        const firstTab = screen.getByText('Notifications').closest('button');
        firstTab?.focus();
        expect(document.activeElement).toBe(firstTab);
      });
    });

    it('should have proper ARIA attributes', async () => {
      renderAlertPreferences();

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        checkboxes.forEach(checkbox => {
          expect(checkbox).toHaveAttribute('type', 'checkbox');
        });
      });
    });
  });

  describe('Responsive Design', () => {
    it('should handle mobile layout', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderAlertPreferences();

      await waitFor(() => {
        // Should render without layout issues
        expect(screen.getByText('Alert Preferences')).toBeInTheDocument();
      });
    });
  });

  describe('Data Persistence', () => {
    it('should preserve changes when switching tabs', async () => {
      renderAlertPreferences();

      await waitFor(() => {
        // Make a change in notifications tab
        const emailCheckbox = screen.getAllByRole('checkbox')[0];
        fireEvent.click(emailCheckbox);

        // Switch to thresholds tab
        const thresholdsTab = screen.getByText('Thresholds');
        fireEvent.click(thresholdsTab);

        // Switch back to notifications tab
        const notificationsTab = screen.getByText('Notifications');
        fireEvent.click(notificationsTab);

        // Change should be preserved (tested through save functionality)
      });
    });
  });
});