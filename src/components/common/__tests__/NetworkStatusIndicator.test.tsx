import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NetworkStatusIndicator } from '../NetworkStatusIndicator';
import { useOffline } from '../../../hooks/useOffline';

// Mock the useOffline hook
vi.mock('../../../hooks/useOffline');

const mockUseOffline = useOffline as any;

describe('NetworkStatusIndicator', () => {
  const mockActions = {
    forceSync: vi.fn(),
    storeOfflineData: vi.fn(),
    getOfflineData: vi.fn(),
    queueOperation: vi.fn(),
    clearOfflineData: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Status Display', () => {
    it('should show online status when connected', () => {
      mockUseOffline.mockReturnValue([
        {
          isOnline: true,
          isConnecting: false,
          lastOnlineTime: Date.now(),
          syncQueueLength: 0,
          isSyncInProgress: false,
          connectionType: '4g'
        },
        mockActions
      ]);

      render(<NetworkStatusIndicator />);

      expect(screen.getByText('Online')).toBeInTheDocument();
      expect(screen.getByRole('img', { hidden: true })).toHaveClass('text-green-500');
    });

    it('should show offline status when disconnected', () => {
      mockUseOffline.mockReturnValue([
        {
          isOnline: false,
          isConnecting: false,
          lastOnlineTime: Date.now() - 60000,
          syncQueueLength: 0,
          isSyncInProgress: false,
        },
        mockActions
      ]);

      render(<NetworkStatusIndicator />);

      expect(screen.getByText('Offline')).toBeInTheDocument();
      expect(screen.getByRole('img', { hidden: true })).toHaveClass('text-red-500');
    });

    it('should show connecting status', () => {
      mockUseOffline.mockReturnValue([
        {
          isOnline: true,
          isConnecting: true,
          lastOnlineTime: Date.now(),
          syncQueueLength: 0,
          isSyncInProgress: false,
        },
        mockActions
      ]);

      render(<NetworkStatusIndicator />);

      expect(screen.getByText('Connecting...')).toBeInTheDocument();
      expect(screen.getByRole('img', { hidden: true })).toHaveClass('animate-spin');
    });

    it('should show syncing status', () => {
      mockUseOffline.mockReturnValue([
        {
          isOnline: true,
          isConnecting: false,
          lastOnlineTime: Date.now(),
          syncQueueLength: 0,
          isSyncInProgress: true,
        },
        mockActions
      ]);

      render(<NetworkStatusIndicator />);

      expect(screen.getByText('Syncing...')).toBeInTheDocument();
    });

    it('should show pending operations count', () => {
      mockUseOffline.mockReturnValue([
        {
          isOnline: true,
          isConnecting: false,
          lastOnlineTime: Date.now(),
          syncQueueLength: 3,
          isSyncInProgress: false,
        },
        mockActions
      ]);

      render(<NetworkStatusIndicator />);

      expect(screen.getByText('3 pending')).toBeInTheDocument();
      expect(screen.getByRole('img', { hidden: true })).toHaveClass('text-yellow-500');
    });
  });

  describe('Detailed View', () => {
    it('should show detailed information when showDetails is true', () => {
      mockUseOffline.mockReturnValue([
        {
          isOnline: true,
          isConnecting: false,
          lastOnlineTime: Date.now(),
          syncQueueLength: 0,
          isSyncInProgress: false,
          connectionType: '4g'
        },
        mockActions
      ]);

      render(<NetworkStatusIndicator showDetails={true} />);

      expect(screen.getByText('Connection:')).toBeInTheDocument();
      expect(screen.getByText('Type:')).toBeInTheDocument();
      expect(screen.getByText('4g')).toBeInTheDocument();
      expect(screen.getByText('Last Online:')).toBeInTheDocument();
      expect(screen.getByText('Now')).toBeInTheDocument();
    });

    it('should show retry sync button when there are pending operations', () => {
      mockUseOffline.mockReturnValue([
        {
          isOnline: true,
          isConnecting: false,
          lastOnlineTime: Date.now(),
          syncQueueLength: 2,
          isSyncInProgress: false,
        },
        mockActions
      ]);

      render(<NetworkStatusIndicator showDetails={true} />);

      expect(screen.getByText('Retry Sync')).toBeInTheDocument();
      expect(screen.getByText('Pending Sync:')).toBeInTheDocument();
      expect(screen.getByText('2 operations')).toBeInTheDocument();
    });

    it('should disable retry sync button when sync is in progress', () => {
      mockUseOffline.mockReturnValue([
        {
          isOnline: true,
          isConnecting: false,
          lastOnlineTime: Date.now(),
          syncQueueLength: 2,
          isSyncInProgress: true,
        },
        mockActions
      ]);

      render(<NetworkStatusIndicator showDetails={true} />);

      const retryButton = screen.getByText('Syncing...');
      expect(retryButton).toBeDisabled();
    });

    it('should show offline warning when disconnected', () => {
      mockUseOffline.mockReturnValue([
        {
          isOnline: false,
          isConnecting: false,
          lastOnlineTime: Date.now() - 60000,
          syncQueueLength: 0,
          isSyncInProgress: false,
        },
        mockActions
      ]);

      render(<NetworkStatusIndicator showDetails={true} />);

      expect(screen.getByText('Working Offline')).toBeInTheDocument();
      expect(screen.getByText(/Your changes are being saved locally/)).toBeInTheDocument();
    });

    it('should show success message when all data is synchronized', () => {
      mockUseOffline.mockReturnValue([
        {
          isOnline: true,
          isConnecting: false,
          lastOnlineTime: Date.now(),
          syncQueueLength: 0,
          isSyncInProgress: false,
        },
        mockActions
      ]);

      render(<NetworkStatusIndicator showDetails={true} />);

      expect(screen.getByText('All data synchronized')).toBeInTheDocument();
    });

    it('should show sync in progress indicator', () => {
      mockUseOffline.mockReturnValue([
        {
          isOnline: true,
          isConnecting: false,
          lastOnlineTime: Date.now(),
          syncQueueLength: 1,
          isSyncInProgress: true,
        },
        mockActions
      ]);

      render(<NetworkStatusIndicator showDetails={true} />);

      expect(screen.getByText('Synchronizing data...')).toBeInTheDocument();
    });
  });

  describe('Time Formatting', () => {
    it('should format last online time correctly', () => {
      const testCases = [
        { offset: 30000, expected: 'Just now' }, // 30 seconds
        { offset: 120000, expected: '2m ago' }, // 2 minutes
        { offset: 3600000, expected: '1h ago' }, // 1 hour
        { offset: 86400000, expected: '1d ago' }, // 1 day
      ];

      testCases.forEach(({ offset, expected }) => {
        mockUseOffline.mockReturnValue([
          {
            isOnline: false,
            isConnecting: false,
            lastOnlineTime: Date.now() - offset,
            syncQueueLength: 0,
            isSyncInProgress: false,
          },
          mockActions
        ]);

        const { rerender } = render(<NetworkStatusIndicator showDetails={true} />);

        expect(screen.getByText(expected)).toBeInTheDocument();

        rerender(<div />); // Clear for next test
      });
    });

    it('should show "Now" when online', () => {
      mockUseOffline.mockReturnValue([
        {
          isOnline: true,
          isConnecting: false,
          lastOnlineTime: Date.now(),
          syncQueueLength: 0,
          isSyncInProgress: false,
        },
        mockActions
      ]);

      render(<NetworkStatusIndicator showDetails={true} />);

      expect(screen.getByText('Now')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call forceSync when retry button is clicked', async () => {
      mockActions.forceSync.mockResolvedValue(undefined);

      mockUseOffline.mockReturnValue([
        {
          isOnline: true,
          isConnecting: false,
          lastOnlineTime: Date.now(),
          syncQueueLength: 2,
          isSyncInProgress: false,
        },
        mockActions
      ]);

      render(<NetworkStatusIndicator showDetails={true} />);

      const retryButton = screen.getByText('Retry Sync');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(mockActions.forceSync).toHaveBeenCalled();
      });
    });

    it('should not call forceSync when offline', () => {
      mockUseOffline.mockReturnValue([
        {
          isOnline: false,
          isConnecting: false,
          lastOnlineTime: Date.now() - 60000,
          syncQueueLength: 2,
          isSyncInProgress: false,
        },
        mockActions
      ]);

      render(<NetworkStatusIndicator showDetails={true} />);

      // Retry button should not be visible when offline
      expect(screen.queryByText('Retry Sync')).not.toBeInTheDocument();
    });

    it('should not call forceSync when sync is already in progress', () => {
      mockUseOffline.mockReturnValue([
        {
          isOnline: true,
          isConnecting: false,
          lastOnlineTime: Date.now(),
          syncQueueLength: 2,
          isSyncInProgress: true,
        },
        mockActions
      ]);

      render(<NetworkStatusIndicator showDetails={true} />);

      const retryButton = screen.getByText('Syncing...');
      fireEvent.click(retryButton);

      expect(mockActions.forceSync).not.toHaveBeenCalled();
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      mockUseOffline.mockReturnValue([
        {
          isOnline: true,
          isConnecting: false,
          lastOnlineTime: Date.now(),
          syncQueueLength: 0,
          isSyncInProgress: false,
        },
        mockActions
      ]);

      render(<NetworkStatusIndicator className="custom-class" />);

      const container = screen.getByText('Online').closest('div');
      expect(container).toHaveClass('custom-class');
    });

    it('should apply different styling for detailed view', () => {
      mockUseOffline.mockReturnValue([
        {
          isOnline: true,
          isConnecting: false,
          lastOnlineTime: Date.now(),
          syncQueueLength: 0,
          isSyncInProgress: false,
        },
        mockActions
      ]);

      render(<NetworkStatusIndicator showDetails={true} className="custom-class" />);

      const container = screen.getByText('All data synchronized').closest('.bg-white');
      expect(container).toHaveClass('custom-class');
    });
  });
});