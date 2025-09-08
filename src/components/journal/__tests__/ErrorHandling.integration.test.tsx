import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from '../../common/ErrorBoundary';
import StatusIndicator from '../../common/StatusIndicator';
import ValidationFeedback from '../../common/ValidationFeedback';
import useErrorHandling from '../../../hooks/useErrorHandling';
import { SaveStatus, SyncStatus } from '../../../services/NotificationService';
import { ValidationError } from '../../../services/ValidationService';

// Mock services
vi.mock('../../../services/ErrorHandlingService', () => ({
  default: {
    getInstance: () => ({
      handleError: vi.fn(),
      retryOperation: vi.fn(),
      processRetryQueue: vi.fn(),
      getRetryQueueStatus: vi.fn().mockReturnValue({ count: 0, operations: [] })
    })
  }
}));

vi.mock('../../../services/NotificationService', () => ({
  default: {
    getInstance: () => ({
      onStatusChange: vi.fn().mockImplementation((callback) => {
        callback(
          { status: 'saved', pendingChanges: false },
          { status: 'synced', pendingOperations: 0 }
        );
        return vi.fn();
      }),
      updateSaveStatus: vi.fn(),
      updateSyncStatus: vi.fn(),
      showAutoSaveNotification: vi.fn(),
      showProgress: vi.fn(),
      showValidationErrors: vi.fn(),
      clearAll: vi.fn()
    })
  }
}));

vi.mock('../../../services/ValidationService', () => ({
  default: {
    getInstance: () => ({
      validateJournalEntry: vi.fn(),
      validateField: vi.fn()
    })
  }
}));

// Test component that uses error handling
const TestJournalComponent: React.FC = () => {
  const {
    executeWithErrorHandling,
    validateWithFeedback,
    saveStatus,
    syncStatus,
    isLoading,
    error,
    updateSaveStatus,
    showAutoSaveNotification
  } = useErrorHandling({
    component: 'TestJournalComponent',
    userId: 'test-user'
  });

  const [validationResult, setValidationResult] = React.useState<any>(null);

  const handleSave = async () => {
    const result = await executeWithErrorHandling(
      async () => {
        // Simulate save operation
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'saved';
      },
      'save_journal'
    );
    
    if (result) {
      updateSaveStatus({ status: 'saved', lastSaved: new Date() });
      showAutoSaveNotification(true);
    }
  };

  const handleValidate = () => {
    const result = validateWithFeedback(
      { date: '', content: 'test' },
      'journalEntry'
    );
    setValidationResult(result);
  };

  const handleError = () => {
    throw new Error('Test component error');
  };

  return (
    <div>
      <StatusIndicator 
        saveStatus={saveStatus} 
        syncStatus={syncStatus}
        showDetails={true}
      />
      
      {validationResult && (
        <ValidationFeedback
          errors={validationResult.errors}
          warnings={validationResult.warnings}
          suggestions={validationResult.suggestions}
        />
      )}
      
      <button onClick={handleSave} disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save Journal'}
      </button>
      
      <button onClick={handleValidate}>
        Validate Entry
      </button>
      
      <button onClick={handleError}>
        Trigger Error
      </button>
      
      {error && (
        <div data-testid="error-display">
          Error: {error.message}
        </div>
      )}
    </div>
  );
};

// Component that throws an error for testing ErrorBoundary
const ErrorThrowingComponent: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Component error for testing');
  }
  return <div>No error</div>;
};

describe('Error Handling Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('StatusIndicator Integration', () => {
    it('should display save and sync status correctly', () => {
      const saveStatus: SaveStatus = {
        status: 'saving',
        pendingChanges: true
      };

      const syncStatus: SyncStatus = {
        status: 'synced',
        pendingOperations: 0,
        lastSync: new Date()
      };

      render(
        <StatusIndicator 
          saveStatus={saveStatus} 
          syncStatus={syncStatus}
          showDetails={true}
        />
      );

      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(screen.getByText('(unsaved changes)')).toBeInTheDocument();
    });

    it('should display error status with details', () => {
      const saveStatus: SaveStatus = {
        status: 'error',
        error: 'Network connection failed',
        pendingChanges: true
      };

      const syncStatus: SyncStatus = {
        status: 'error',
        error: 'Sync server unavailable',
        pendingOperations: 2
      };

      render(
        <StatusIndicator 
          saveStatus={saveStatus} 
          syncStatus={syncStatus}
          showDetails={true}
        />
      );

      expect(screen.getByText('Save failed')).toBeInTheDocument();
      expect(screen.getByText('Sync failed')).toBeInTheDocument();
      expect(screen.getByText('Network connection failed')).toBeInTheDocument();
      expect(screen.getByText('Sync server unavailable')).toBeInTheDocument();
    });

    it('should display compact status when showDetails is false', () => {
      const saveStatus: SaveStatus = {
        status: 'saved',
        lastSaved: new Date(),
        pendingChanges: false
      };

      const syncStatus: SyncStatus = {
        status: 'syncing',
        pendingOperations: 3
      };

      render(
        <StatusIndicator 
          saveStatus={saveStatus} 
          syncStatus={syncStatus}
          showDetails={false}
        />
      );

      expect(screen.getByText('Syncing 3 changes...')).toBeInTheDocument();
      // Should not show save status when it's 'saved' in compact mode
      expect(screen.queryByText('Saved')).not.toBeInTheDocument();
    });
  });

  describe('ValidationFeedback Integration', () => {
    it('should display validation errors, warnings, and suggestions', () => {
      const errors: ValidationError[] = [
        {
          field: 'date',
          message: 'Date is required',
          code: 'REQUIRED_FIELD',
          severity: 'error',
          suggestion: 'Please select a valid date'
        }
      ];

      const warnings: ValidationError[] = [
        {
          field: 'content',
          message: 'Content is very brief',
          code: 'SHORT_CONTENT',
          severity: 'warning',
          suggestion: 'Consider adding more detail'
        }
      ];

      const suggestions: ValidationError[] = [
        {
          field: 'emotional_state',
          message: 'Consider adding emotional tracking',
          code: 'MISSING_EMOTIONAL_DATA',
          severity: 'info',
          suggestion: 'Emotional tracking helps identify patterns'
        }
      ];

      render(
        <ValidationFeedback
          errors={errors}
          warnings={warnings}
          suggestions={suggestions}
          showSuggestions={true}
        />
      );

      expect(screen.getByText('Date is required')).toBeInTheDocument();
      expect(screen.getByText('💡 Please select a valid date')).toBeInTheDocument();
      expect(screen.getByText('Content is very brief')).toBeInTheDocument();
      expect(screen.getByText('Consider adding emotional tracking')).toBeInTheDocument();
    });

    it('should not display anything when no validation issues exist', () => {
      const { container } = render(
        <ValidationFeedback
          errors={[]}
          warnings={[]}
          suggestions={[]}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('ErrorBoundary Integration', () => {
    it('should catch and display component errors', () => {
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText(/We're sorry, but something unexpected happened/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Try Again/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Go to Dashboard/ })).toBeInTheDocument();

      mockConsoleError.mockRestore();
    });

    it('should allow retry after error', () => {
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      let shouldThrow = true;

      const { rerender } = render(
        <ErrorBoundary>
          <ErrorThrowingComponent shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Simulate fixing the error
      shouldThrow = false;

      // Click retry button
      fireEvent.click(screen.getByRole('button', { name: /Try Again/ }));

      // Re-render with fixed component
      rerender(
        <ErrorBoundary>
          <ErrorThrowingComponent shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();

      mockConsoleError.mkRestore();
    });

    it('should show custom fallback UI when provided', () => {
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const customFallback = <div>Custom error message</div>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ErrorThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();

      mockConsoleError.mockRestore();
    });
  });

  describe('Full Integration Test', () => {
    it('should handle complete error handling workflow', async () => {
      render(
        <>
          <ErrorBoundary>
            <TestJournalComponent />
          </ErrorBoundary>
          <Toaster />
        </>
      );

      // Test save operation
      const saveButton = screen.getByRole('button', { name: /Save Journal/ });
      fireEvent.click(saveButton);

      expect(screen.getByText('Saving...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Save Journal/ })).toBeInTheDocument();
      });

      // Test validation
      const validateButton = screen.getByRole('button', { name: /Validate Entry/ });
      fireEvent.click(validateButton);

      // Test error handling
      const errorButton = screen.getByRole('button', { name: /Trigger Error/ });
      
      // This should be caught by ErrorBoundary
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      fireEvent.click(errorButton);

      await waitFor(() => {
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      });

      mockConsoleError.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      const saveStatus: SaveStatus = {
        status: 'error',
        error: 'Save failed',
        pendingChanges: true
      };

      const syncStatus: SyncStatus = {
        status: 'synced',
        pendingOperations: 0
      };

      render(
        <StatusIndicator 
          saveStatus={saveStatus} 
          syncStatus={syncStatus}
          showDetails={true}
        />
      );

      // Check that error messages are properly announced
      const errorElements = screen.getAllByText(/failed/i);
      expect(errorElements.length).toBeGreaterThan(0);
    });

    it('should support keyboard navigation in error boundary', () => {
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      const retryButton = screen.getByRole('button', { name: /Try Again/ });
      const homeButton = screen.getByRole('button', { name: /Go to Dashboard/ });

      expect(retryButton).toBeInTheDocument();
      expect(homeButton).toBeInTheDocument();

      // Test keyboard focus
      retryButton.focus();
      expect(document.activeElement).toBe(retryButton);

      mockConsoleError.mockRestore();
    });
  });
});