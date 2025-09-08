import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { JournalDataService } from '../../../services/JournalDataService';
import OfflineService from '../../../services/OfflineService';
import { NetworkStatusIndicator } from '../../common/NetworkStatusIndicator';
import { useOffline } from '../../../hooks/useOffline';

// Mock Firebase
jest.mock('../../../lib/firebase', () => ({
  db: {},
}));

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  getDocs: jest.fn(),
  onSnapshot: jest.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock fetch
global.fetch = jest.fn();

// Mock navigator
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// Test component that uses offline functionality
const TestJournalComponent: React.FC = () => {
  const [offlineState, offlineActions] = useOffline();
  const [journalEntry, setJournalEntry] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  const journalService = React.useMemo(() => new JournalDataService(), []);

  const handleCreateEntry = async () => {
    try {
      const entry = await journalService.createJournalEntry('user-1', '2024-01-01');
      setJournalEntry(entry);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleUpdateEntry = async () => {
    if (!journalEntry) return;
    
    try {
      await journalService.updateJournalEntry('user-1', journalEntry.id, {
        sections: [
          {
            id: 'section-1',
            type: 'text',
            title: 'Market Notes',
            content: 'Updated content while offline',
            order: 1,
            isRequired: false,
            isComplete: true
          }
        ]
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleForceSync = async () => {
    try {
      await offlineActions.forceSync();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <div>
      <NetworkStatusIndicator showDetails={true} />
      
      <div data-testid="offline-state">
        <p>Online: {offlineState.isOnline ? 'Yes' : 'No'}</p>
        <p>Sync Queue: {offlineState.syncQueueLength}</p>
        <p>Syncing: {offlineState.isSyncInProgress ? 'Yes' : 'No'}</p>
      </div>

      <button onClick={handleCreateEntry} data-testid="create-entry">
        Create Entry
      </button>
      
      <button onClick={handleUpdateEntry} data-testid="update-entry" disabled={!journalEntry}>
        Update Entry
      </button>
      
      <button onClick={handleForceSync} data-testid="force-sync">
        Force Sync
      </button>

      {journalEntry && (
        <div data-testid="journal-entry">
          <p>Entry ID: {journalEntry.id}</p>
          <p>Date: {journalEntry.date}</p>
        </div>
      )}

      {error && (
        <div data-testid="error" style={{ color: 'red' }}>
          Error: {error}
        </div>
      )}
    </div>
  );
};

describe('Offline Support Integration', () => {
  let mockSetDoc: jest.Mock;
  let mockUpdateDoc: jest.Mock;
  let mockGetDoc: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Reset navigator online status
    Object.defineProperty(navigator, 'onLine', { value: true });
    
    // Reset singleton instances
    (OfflineService as any).instance = undefined;

    // Setup Firestore mocks
    const { setDoc, updateDoc, getDoc } = require('firebase/firestore');
    mockSetDoc = setDoc as jest.Mock;
    mockUpdateDoc = updateDoc as jest.Mock;
    mockGetDoc = getDoc as jest.Mock;

    mockSetDoc.mockResolvedValue(undefined);
    mockUpdateDoc.mockResolvedValue(undefined);
    mockGetDoc.mockResolvedValue({ exists: () => false });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Online Operations', () => {
    it('should create journal entry when online', async () => {
      render(<TestJournalComponent />);

      // Verify initial online state
      expect(screen.getByText('Online: Yes')).toBeInTheDocument();
      expect(screen.getByText('Sync Queue: 0')).toBeInTheDocument();

      // Create entry
      fireEvent.click(screen.getByTestId('create-entry'));

      await waitFor(() => {
        expect(screen.getByTestId('journal-entry')).toBeInTheDocument();
      });

      expect(screen.getByText('Entry ID: user-1_2024-01-01')).toBeInTheDocument();
      expect(screen.getByText('Date: 2024-01-01')).toBeInTheDocument();
      expect(mockSetDoc).toHaveBeenCalled();
    });

    it('should update journal entry when online', async () => {
      render(<TestJournalComponent />);

      // Create entry first
      fireEvent.click(screen.getByTestId('create-entry'));

      await waitFor(() => {
        expect(screen.getByTestId('journal-entry')).toBeInTheDocument();
      });

      // Update entry
      fireEvent.click(screen.getByTestId('update-entry'));

      await waitFor(() => {
        expect(mockUpdateDoc).toHaveBeenCalled();
      });

      expect(screen.queryByTestId('error')).not.toBeInTheDocument();
    });
  });

  describe('Offline Operations', () => {
    beforeEach(() => {
      // Simulate offline state
      Object.defineProperty(navigator, 'onLine', { value: false });
      
      // Make Firestore operations fail with network error
      mockSetDoc.mockRejectedValue(new Error('unavailable'));
      mockUpdateDoc.mockRejectedValue(new Error('unavailable'));
    });

    it('should handle create operations while offline', async () => {
      render(<TestJournalComponent />);

      // Wait for offline state to be detected
      await waitFor(() => {
        expect(screen.getByText('Online: No')).toBeInTheDocument();
      });

      // Create entry while offline
      fireEvent.click(screen.getByTestId('create-entry'));

      await waitFor(() => {
        expect(screen.getByTestId('journal-entry')).toBeInTheDocument();
      });

      // Entry should be created locally
      expect(screen.getByText('Entry ID: user-1_2024-01-01')).toBeInTheDocument();
      
      // Should show pending sync operation
      await waitFor(() => {
        expect(screen.getByText(/Sync Queue: [1-9]/)).toBeInTheDocument();
      });

      // Should show offline warning
      expect(screen.getByText('Working Offline')).toBeInTheDocument();
    });

    it('should handle update operations while offline', async () => {
      // First create entry while online
      Object.defineProperty(navigator, 'onLine', { value: true });
      mockSetDoc.mockResolvedValue(undefined);

      render(<TestJournalComponent />);

      fireEvent.click(screen.getByTestId('create-entry'));

      await waitFor(() => {
        expect(screen.getByTestId('journal-entry')).toBeInTheDocument();
      });

      // Now go offline
      Object.defineProperty(navigator, 'onLine', { value: false });
      window.dispatchEvent(new Event('offline'));

      await waitFor(() => {
        expect(screen.getByText('Online: No')).toBeInTheDocument();
      });

      // Update entry while offline
      fireEvent.click(screen.getByTestId('update-entry'));

      // Should not show error
      await waitFor(() => {
        expect(screen.queryByTestId('error')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Should show pending sync operation
      expect(screen.getByText(/Sync Queue: [1-9]/)).toBeInTheDocument();
    });

    it('should show offline indicators in network status', async () => {
      render(<TestJournalComponent />);

      await waitFor(() => {
        expect(screen.getByText('Online: No')).toBeInTheDocument();
      });

      expect(screen.getByText('Offline')).toBeInTheDocument();
      expect(screen.getByText('Working Offline')).toBeInTheDocument();
      expect(screen.getByText(/Your changes are being saved locally/)).toBeInTheDocument();
    });
  });

  describe('Online/Offline Transitions', () => {
    it('should sync queued operations when coming back online', async () => {
      jest.useFakeTimers();

      // Start offline
      Object.defineProperty(navigator, 'onLine', { value: false });
      mockSetDoc.mockRejectedValue(new Error('unavailable'));

      render(<TestJournalComponent />);

      await waitFor(() => {
        expect(screen.getByText('Online: No')).toBeInTheDocument();
      });

      // Create entry while offline
      fireEvent.click(screen.getByTestId('create-entry'));

      await waitFor(() => {
        expect(screen.getByTestId('journal-entry')).toBeInTheDocument();
      });

      // Should have queued operation
      expect(screen.getByText(/Sync Queue: [1-9]/)).toBeInTheDocument();

      // Come back online
      Object.defineProperty(navigator, 'onLine', { value: true });
      mockSetDoc.mockResolvedValue(undefined);
      (fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) });

      window.dispatchEvent(new Event('online'));

      // Wait for sync to process
      await waitFor(() => {
        expect(screen.getByText('Online: Yes')).toBeInTheDocument();
      });

      // Advance timers to allow sync processing
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Should eventually sync and clear queue
      await waitFor(() => {
        expect(screen.getByText('Sync Queue: 0')).toBeInTheDocument();
      }, { timeout: 5000 });

      expect(fetch).toHaveBeenCalledWith('/api/journalEntry', expect.objectContaining({
        method: 'POST'
      }));
    });

    it('should handle force sync', async () => {
      // Start with queued operations
      Object.defineProperty(navigator, 'onLine', { value: false });
      mockSetDoc.mockRejectedValue(new Error('unavailable'));

      render(<TestJournalComponent />);

      // Create entry while offline
      fireEvent.click(screen.getByTestId('create-entry'));

      await waitFor(() => {
        expect(screen.getByText(/Sync Queue: [1-9]/)).toBeInTheDocument();
      });

      // Come back online
      Object.defineProperty(navigator, 'onLine', { value: true });
      (fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) });

      window.dispatchEvent(new Event('online'));

      await waitFor(() => {
        expect(screen.getByText('Online: Yes')).toBeInTheDocument();
      });

      // Force sync
      fireEvent.click(screen.getByTestId('force-sync'));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle persistent network errors gracefully', async () => {
      // Simulate persistent network failure
      mockSetDoc.mockRejectedValue(new Error('Network error'));
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<TestJournalComponent />);

      // Create entry
      fireEvent.click(screen.getByTestId('create-entry'));

      await waitFor(() => {
        expect(screen.getByTestId('journal-entry')).toBeInTheDocument();
      });

      // Should show queued operation
      expect(screen.getByText(/Sync Queue: [1-9]/)).toBeInTheDocument();

      // Force sync should handle errors gracefully
      fireEvent.click(screen.getByTestId('force-sync'));

      // Should not crash or show error to user
      await waitFor(() => {
        expect(screen.queryByTestId('error')).not.toBeInTheDocument();
      });
    });

    it('should handle localStorage errors', async () => {
      // Simulate localStorage failure
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      render(<TestJournalComponent />);

      // Create entry should handle storage error
      fireEvent.click(screen.getByTestId('create-entry'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
      });

      expect(screen.getByText(/Local storage failed/)).toBeInTheDocument();
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data consistency between online and offline states', async () => {
      // Create entry while online
      render(<TestJournalComponent />);

      fireEvent.click(screen.getByTestId('create-entry'));

      await waitFor(() => {
        expect(screen.getByTestId('journal-entry')).toBeInTheDocument();
      });

      const originalEntryId = screen.getByText(/Entry ID:/).textContent;

      // Go offline
      Object.defineProperty(navigator, 'onLine', { value: false });
      mockGetDoc.mockRejectedValue(new Error('unavailable'));
      window.dispatchEvent(new Event('offline'));

      await waitFor(() => {
        expect(screen.getByText('Online: No')).toBeInTheDocument();
      });

      // Entry should still be accessible
      expect(screen.getByText(originalEntryId!)).toBeInTheDocument();

      // Come back online
      Object.defineProperty(navigator, 'onLine', { value: true });
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: 'user-1_2024-01-01',
        data: () => ({
          id: 'user-1_2024-01-01',
          userId: 'user-1',
          date: '2024-01-01',
          sections: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      });

      window.dispatchEvent(new Event('online'));

      await waitFor(() => {
        expect(screen.getByText('Online: Yes')).toBeInTheDocument();
      });

      // Entry should still be consistent
      expect(screen.getByText(originalEntryId!)).toBeInTheDocument();
    });
  });
});