import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOffline } from '../useOffline';
import OfflineService from '../../services/OfflineService';

// Mock OfflineService
vi.mock('../../services/OfflineService');

const mockOfflineService = {
  getNetworkStatus: vi.fn(),
  getSyncQueueLength: vi.fn(),
  isSyncInProgress: vi.fn(),
  onNetworkStatusChange: vi.fn(),
  forcSync: vi.fn(),
  storeOfflineData: vi.fn(),
  getOfflineData: vi.fn(),
  queueOperation: vi.fn(),
  clearOfflineData: vi.fn(),
};

(OfflineService.getInstance as any).mockReturnValue(mockOfflineService);

describe('useOffline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    mockOfflineService.getNetworkStatus.mockReturnValue({
      isOnline: true,
      lastOnlineTime: Date.now(),
      connectionType: '4g'
    });
    mockOfflineService.getSyncQueueLength.mockReturnValue(0);
    mockOfflineService.isSyncInProgress.mockReturnValue(false);
    mockOfflineService.onNetworkStatusChange.mockReturnValue(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with current network status', () => {
    const { result } = renderHook(() => useOffline());
    const [state] = result.current;

    expect(state.isOnline).toBe(true);
    expect(state.syncQueueLength).toBe(0);
    expect(state.isSyncInProgress).toBe(false);
    expect(state.connectionType).toBe('4g');
  });

  it('should update state when network status changes', () => {
    let networkCallback: (status: any) => void;
    mockOfflineService.onNetworkStatusChange.mockImplementation((callback) => {
      networkCallback = callback;
      return () => {};
    });

    const { result } = renderHook(() => useOffline());

    act(() => {
      networkCallback({
        isOnline: false,
        lastOnlineTime: Date.now() - 5000,
        connectionType: 'none'
      });
    });

    const [state] = result.current;
    expect(state.isOnline).toBe(false);
    expect(state.connectionType).toBe('none');
  });

  it('should update sync queue length periodically', () => {
    vi.useFakeTimers();
    
    mockOfflineService.getSyncQueueLength
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(2)
      .mockReturnValueOnce(1);

    const { result } = renderHook(() => useOffline());

    // Initial state
    expect(result.current[0].syncQueueLength).toBe(0);

    // Advance timer to trigger update
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current[0].syncQueueLength).toBe(2);

    // Advance timer again
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current[0].syncQueueLength).toBe(1);
  });

  it('should provide forceSync action', async () => {
    mockOfflineService.forcSync.mockResolvedValue(undefined);

    const { result } = renderHook(() => useOffline());
    const [, actions] = result.current;

    await act(async () => {
      await actions.forceSync();
    });

    expect(mockOfflineService.forcSync).toHaveBeenCalled();
  });

  it('should handle forceSync with connecting state', async () => {
    mockOfflineService.forcSync.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    const { result } = renderHook(() => useOffline());
    const [, actions] = result.current;

    const syncPromise = act(async () => {
      await actions.forceSync();
    });

    // Check connecting state is set
    expect(result.current[0].isConnecting).toBe(true);

    await syncPromise;

    // Check connecting state is cleared
    expect(result.current[0].isConnecting).toBe(false);
  });

  it('should provide storeOfflineData action', async () => {
    mockOfflineService.storeOfflineData.mockResolvedValue(undefined);

    const { result } = renderHook(() => useOffline());
    const [, actions] = result.current;

    await act(async () => {
      await actions.storeOfflineData('test-key', { data: 'test' });
    });

    expect(mockOfflineService.storeOfflineData).toHaveBeenCalledWith('test-key', { data: 'test' });
  });

  it('should provide getOfflineData action', async () => {
    mockOfflineService.getOfflineData.mockResolvedValue({ data: 'test' });

    const { result } = renderHook(() => useOffline());
    const [, actions] = result.current;

    let data;
    await act(async () => {
      data = await actions.getOfflineData('test-key');
    });

    expect(mockOfflineService.getOfflineData).toHaveBeenCalledWith('test-key');
    expect(data).toEqual({ data: 'test' });
  });

  it('should provide queueOperation action', async () => {
    mockOfflineService.queueOperation.mockResolvedValue(undefined);
    mockOfflineService.getSyncQueueLength.mockReturnValue(1);

    const { result } = renderHook(() => useOffline());
    const [, actions] = result.current;

    const operation = {
      type: 'create' as const,
      entityType: 'journalEntry' as const,
      entityId: 'entry-1',
      data: { content: 'test' },
      userId: 'user-1'
    };

    await act(async () => {
      await actions.queueOperation(operation);
    });

    expect(mockOfflineService.queueOperation).toHaveBeenCalledWith(operation);
    expect(result.current[0].syncQueueLength).toBe(1);
  });

  it('should provide clearOfflineData action', async () => {
    mockOfflineService.clearOfflineData.mockResolvedValue(undefined);

    const { result } = renderHook(() => useOffline());
    const [, actions] = result.current;

    await act(async () => {
      await actions.clearOfflineData();
    });

    expect(mockOfflineService.clearOfflineData).toHaveBeenCalled();
    expect(result.current[0].syncQueueLength).toBe(0);
    expect(result.current[0].isSyncInProgress).toBe(false);
  });

  it('should cleanup subscriptions on unmount', () => {
    const unsubscribe = vi.fn();
    mockOfflineService.onNetworkStatusChange.mockReturnValue(unsubscribe);

    const { unmount } = renderHook(() => useOffline());

    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });

  it('should cleanup interval on unmount', () => {
    vi.useFakeTimers();
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

    const { unmount } = renderHook(() => useOffline());

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});