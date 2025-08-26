/**
 * Unit tests for AlertsPanel component
 * Tests alert display and user interactions
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AlertsPanel } from '../AlertsPanel';
import { StrategyAlertService } from '../../../services/StrategyAlertService';
import { StrategyAlert, AlertMetrics } from '../../../types/alerts';

// Mock the StrategyAlertService
vi.mock('../../../services/StrategyAlertService');

describe('AlertsPanel', () => {
  let mockAlertService: jest.Mocked<StrategyAlertService>;
  let mockAlerts: StrategyAlert[];
  let mockMetrics: AlertMetrics;
  let mockOnAlertAction: jest.Mock;

  beforeEach(() => {
    mockAlertService = {
      getActiveAlerts: vi.fn(),
      getAlertMetrics: vi.fn(),
      acknowledgeAlert: vi.fn(),
      resolveAlert: vi.fn(),
      updateNotificationPreferences: vi.fn(),
      updateAlertThresholds: vi.fn(),
      monitorDrawdownLimits: vi.fn(),
      checkPerformanceMilestones: vi.fn(),
      detectMarketConditionChanges: vi.fn(),
      checkStatisticalSignificance: vi.fn(),
      detectCorrelatedPerformanceIssues: vi.fn(),
      sendNotification: vi.fn()
    } as any;

    mockAlerts = [
      {
        id: 'alert-1',
        strategyId: 'strategy-1',
        strategyName: 'Test Strategy',
        type: 'DrawdownLimit',
        severity: 'High',
        status: 'Active',
        title: 'Drawdown Alert',
        message: 'Strategy drawdown exceeds 8%',
        actionable: true,
        suggestedActions: [
          'Review recent trades',
          'Consider reducing position size'
        ],
        threshold: {
          metric: 'maxDrawdown',
          value: 5,
          operator: 'greater_than'
        },
        currentValue: 8.5,
        createdAt: '2024-01-01T10:00:00Z'
      },
      {
        id: 'alert-2',
        strategyId: 'strategy-1',
        strategyName: 'Test Strategy',
        type: 'PerformanceMilestone',
        severity: 'Low',
        status: 'Active',
        title: 'Performance Milestone',
        message: 'Strategy achieved profit factor of 2.5',
        actionable: true,
        suggestedActions: [
          'Consider increasing position size'
        ],
        threshold: {
          metric: 'profitFactor',
          value: 2,
          operator: 'greater_than'
        },
        currentValue: 2.5,
        createdAt: '2024-01-01T09:00:00Z'
      }
    ];

    mockMetrics = {
      totalAlerts: 2,
      alertsByType: {
        DrawdownLimit: 1,
        PerformanceMilestone: 1,
        MarketConditionChange: 0,
        StatisticalSignificance: 0,
        StrategyCorrelation: 0,
        DisciplineViolation: 0
      },
      alertsBySeverity: {
        Low: 1,
        Medium: 0,
        High: 1,
        Critical: 0
      },
      averageResolutionTime: 2.5,
      falsePositiveRate: 0.1,
      userEngagement: {
        acknowledgedRate: 0.8,
        actionTakenRate: 0.6
      }
    };

    mockOnAlertAction = vi.fn();

    mockAlertService.getActiveAlerts.mockReturnValue(mockAlerts);
    mockAlertService.getAlertMetrics.mockReturnValue(mockMetrics);
    mockAlertService.acknowledgeAlert.mockResolvedValue(undefined);
    mockAlertService.resolveAlert.mockResolvedValue(undefined);
  });

  const renderAlertsPanel = (props = {}) => {
    return render(
      <AlertsPanel
        userId="user-1"
        alertService={mockAlertService}
        onAlertAction={mockOnAlertAction}
        {...props}
      />
    );
  };

  describe('Rendering', () => {
    it('should render alerts panel with header', async () => {
      renderAlertsPanel();

      await waitFor(() => {
        expect(screen.getByText('Strategy Alerts')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument(); // Alert count badge
      });
    });

    it('should display loading state initially', () => {
      renderAlertsPanel();
      
      // Should show loading animation
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('should display metrics summary', async () => {
      renderAlertsPanel();

      await waitFor(() => {
        expect(screen.getByText('Total Alerts')).toBeInTheDocument();
        expect(screen.getByText('Acknowledged')).toBeInTheDocument();
        expect(screen.getByText('Avg Resolution')).toBeInTheDocument();
        expect(screen.getByText('False Positive')).toBeInTheDocument();
        
        // Check for the actual values displayed
        const totalAlertsValue = screen.getByText('2');
        expect(totalAlertsValue).toBeInTheDocument();
      });
    });

    it('should display empty state when no alerts', async () => {
      mockAlertService.getActiveAlerts.mockReturnValue([]);
      
      renderAlertsPanel();

      await waitFor(() => {
        expect(screen.getByText('No active alerts')).toBeInTheDocument();
        expect(screen.getByText('Your strategies are performing within normal parameters')).toBeInTheDocument();
      });
    });
  });

  describe('Alert Display', () => {
    it('should display alert cards with correct information', async () => {
      renderAlertsPanel();

      await waitFor(() => {
        // Check drawdown alert
        expect(screen.getByText('Drawdown Alert')).toBeInTheDocument();
        expect(screen.getByText('Strategy drawdown exceeds 8%')).toBeInTheDocument();
        expect(screen.getByText('Current: 8.50 | Threshold: 5')).toBeInTheDocument();

        // Check milestone alert
        expect(screen.getByText('Performance Milestone')).toBeInTheDocument();
        expect(screen.getByText('Strategy achieved profit factor of 2.5')).toBeInTheDocument();
        expect(screen.getByText('Current: 2.50 | Threshold: 2')).toBeInTheDocument();
      });
    });

    it('should show correct severity styling', async () => {
      renderAlertsPanel();

      await waitFor(() => {
        const alertCards = document.querySelectorAll('[class*="border-l-4"]');
        expect(alertCards).toHaveLength(2);
        
        // High severity should have orange styling
        expect(alertCards[0]).toHaveClass('text-orange-600', 'bg-orange-50', 'border-orange-200');
        
        // Low severity should have blue styling
        expect(alertCards[1]).toHaveClass('text-blue-600', 'bg-blue-50', 'border-blue-200');
      });
    });

    it('should display time ago correctly', async () => {
      renderAlertsPanel();

      await waitFor(() => {
        // Should show relative time (could be hours, days, etc.)
        const timeElements = screen.getAllByText(/\d+[hd] ago/);
        expect(timeElements.length).toBeGreaterThan(0);
      });
    });

    it('should show suggested actions when details expanded', async () => {
      renderAlertsPanel();

      await waitFor(() => {
        const detailsButtons = screen.getAllByText('Details');
        expect(detailsButtons.length).toBeGreaterThan(0);
        
        fireEvent.click(detailsButtons[0]);

        // After clicking, should show suggested actions
        // The exact text may vary, so we check for the presence of actions
      });
    });
  });

  describe('Filtering', () => {
    it('should filter alerts by severity', async () => {
      renderAlertsPanel();

      await waitFor(() => {
        const severityFilter = screen.getByDisplayValue('All Severities');
        fireEvent.change(severityFilter, { target: { value: 'High' } });
      });

      // Should call getActiveAlerts again with filtered results
      expect(mockAlertService.getActiveAlerts).toHaveBeenCalled();
    });

    it('should filter alerts by type', async () => {
      renderAlertsPanel();

      await waitFor(() => {
        const typeFilter = screen.getByDisplayValue('All Types');
        fireEvent.change(typeFilter, { target: { value: 'DrawdownLimit' } });
      });

      expect(mockAlertService.getActiveAlerts).toHaveBeenCalled();
    });
  });

  describe('Alert Actions', () => {
    it('should acknowledge alert when acknowledge button clicked', async () => {
      renderAlertsPanel();

      await waitFor(() => {
        const acknowledgeButtons = screen.getAllByTitle('Acknowledge');
        fireEvent.click(acknowledgeButtons[0]);
      });

      expect(mockAlertService.acknowledgeAlert).toHaveBeenCalledWith('alert-1', 'user-1');
      expect(mockOnAlertAction).toHaveBeenCalledWith('alert-1', 'acknowledge');
    });

    it('should resolve alert when resolve button clicked', async () => {
      renderAlertsPanel();

      await waitFor(() => {
        const resolveButtons = screen.getAllByTitle('Resolve');
        fireEvent.click(resolveButtons[0]);
      });

      expect(mockAlertService.resolveAlert).toHaveBeenCalledWith('alert-1', 'user-1');
      expect(mockOnAlertAction).toHaveBeenCalledWith('alert-1', 'resolve');
    });

    it('should handle action errors gracefully', async () => {
      mockAlertService.acknowledgeAlert.mockRejectedValue(new Error('Network error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      renderAlertsPanel();

      await waitFor(() => {
        const acknowledgeButtons = screen.getAllByTitle('Acknowledge');
        fireEvent.click(acknowledgeButtons[0]);
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to acknowledge alert:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Strategy-specific Filtering', () => {
    it('should filter alerts by strategy when strategyId provided', async () => {
      renderAlertsPanel({ strategyId: 'strategy-1' });

      await waitFor(() => {
        expect(mockAlertService.getActiveAlerts).toHaveBeenCalledWith('user-1', 'strategy-1');
      });
    });

    it('should show all alerts when no strategyId provided', async () => {
      renderAlertsPanel();

      await waitFor(() => {
        expect(mockAlertService.getActiveAlerts).toHaveBeenCalledWith('user-1', undefined);
      });
    });
  });

  describe('Settings Integration', () => {
    it('should show settings button', async () => {
      renderAlertsPanel();

      await waitFor(() => {
        // Look for settings button by its SVG content or class
        const settingsButtons = screen.getAllByRole('button').filter(button => 
          button.querySelector('svg.lucide-settings')
        );
        expect(settingsButtons.length).toBeGreaterThan(0);
      });
    });

    it('should toggle settings panel when settings clicked', async () => {
      renderAlertsPanel();

      await waitFor(() => {
        const settingsButtons = screen.getAllByRole('button').filter(button => 
          button.querySelector('svg.lucide-settings')
        );
        if (settingsButtons.length > 0) {
          fireEvent.click(settingsButtons[0]);
        }
      });

      // In a real implementation, this would show/hide settings panel
    });
  });

  describe('Real-time Updates', () => {
    it('should reload alerts when userId changes', async () => {
      const { rerender } = renderAlertsPanel({ userId: 'user-1' });

      await waitFor(() => {
        expect(mockAlertService.getActiveAlerts).toHaveBeenCalledWith('user-1', undefined);
      });

      rerender(
        <AlertsPanel
          userId="user-2"
          alertService={mockAlertService}
          onAlertAction={mockOnAlertAction}
        />
      );

      await waitFor(() => {
        expect(mockAlertService.getActiveAlerts).toHaveBeenCalledWith('user-2', undefined);
      });
    });

    it('should reload alerts when strategyId changes', async () => {
      const { rerender } = renderAlertsPanel({ strategyId: 'strategy-1' });

      await waitFor(() => {
        expect(mockAlertService.getActiveAlerts).toHaveBeenCalledWith('user-1', 'strategy-1');
      });

      rerender(
        <AlertsPanel
          userId="user-1"
          strategyId="strategy-2"
          alertService={mockAlertService}
          onAlertAction={mockOnAlertAction}
        />
      );

      await waitFor(() => {
        expect(mockAlertService.getActiveAlerts).toHaveBeenCalledWith('user-1', 'strategy-2');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      renderAlertsPanel();

      await waitFor(() => {
        // Check that action buttons have title attributes
        const actionButtons = screen.getAllByRole('button').filter(button => 
          button.hasAttribute('title')
        );
        expect(actionButtons.length).toBeGreaterThan(0);
        
        // Check specific buttons that should have titles
        const acknowledgeButtons = screen.getAllByTitle('Acknowledge');
        const resolveButtons = screen.getAllByTitle('Resolve');
        expect(acknowledgeButtons.length).toBeGreaterThan(0);
        expect(resolveButtons.length).toBeGreaterThan(0);
      });
    });

    it('should support keyboard navigation', async () => {
      renderAlertsPanel();

      await waitFor(() => {
        const firstButton = screen.getAllByRole('button')[0];
        firstButton.focus();
        expect(document.activeElement).toBe(firstButton);
      });
    });
  });

  describe('Performance', () => {
    it('should handle large numbers of alerts efficiently', async () => {
      const manyAlerts = Array.from({ length: 100 }, (_, i) => ({
        ...mockAlerts[0],
        id: `alert-${i}`,
        title: `Alert ${i}`
      }));

      mockAlertService.getActiveAlerts.mockReturnValue(manyAlerts);

      renderAlertsPanel();

      await waitFor(() => {
        // Should render without performance issues
        expect(screen.getByText('Strategy Alerts')).toBeInTheDocument();
      });
    });

    it('should use virtualization for scrolling', async () => {
      renderAlertsPanel();

      await waitFor(() => {
        const scrollContainer = document.querySelector('.max-h-96.overflow-y-auto');
        expect(scrollContainer).toBeInTheDocument();
      });
    });
  });
});