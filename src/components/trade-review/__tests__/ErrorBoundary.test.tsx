import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TradeReviewErrorBoundary, useErrorHandler, withErrorBoundary } from '../ErrorBoundary';
import React from 'react';

// Mock error handling service
vi.mock('../../../lib/errorHandlingService', () => ({
  errorHandlingService: {
    createError: vi.fn((type, message, details) => ({
      type,
      message,
      details,
      timestamp: Date.now()
    })),
    handleError: vi.fn()
  },
  TradeReviewErrorType: {
    REVIEW_WORKFLOW_ERROR: 'REVIEW_WORKFLOW_ERROR'
  }
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined)
  }
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000/trade/123'
  },
  writable: true
});

// Mock alert
global.alert = vi.fn();

describe('TradeReviewErrorBoundary', () => {
  const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
    if (shouldThrow) {
      throw new Error('Test error');
    }
    return <div>No error</div>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error for error boundary tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Error Boundary Behavior', () => {
    it('should render children when no error occurs', () => {
      render(
        <TradeReviewErrorBoundary>
          <ThrowError shouldThrow={false} />
        </TradeReviewErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('should render error UI when error occurs', () => {
      render(
        <TradeReviewErrorBoundary>
          <ThrowError shouldThrow={true} />
        </TradeReviewErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText(/The trade review system encountered an unexpected error/)).toBeInTheDocument();
    });

    it('should show error details when showDetails is true', () => {
      render(
        <TradeReviewErrorBoundary showDetails={true}>
          <ThrowError shouldThrow={true} />
        </TradeReviewErrorBoundary>
      );

      expect(screen.getByText('Error Details:')).toBeInTheDocument();
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    it('should call custom error handler when provided', () => {
      const onError = vi.fn();
      
      render(
        <TradeReviewErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} />
        </TradeReviewErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String)
        })
      );
    });

    it('should render custom fallback when provided', () => {
      const customFallback = <div>Custom error message</div>;
      
      render(
        <TradeReviewErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </TradeReviewErrorBoundary>
      );

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });
  });

  describe('Error Recovery Actions', () => {
    it('should retry when Try Again button is clicked', () => {
      const { rerender } = render(
        <TradeReviewErrorBoundary>
          <ThrowError shouldThrow={true} />
        </TradeReviewErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Try Again'));

      // Component should reset and try to render children again
      rerender(
        <TradeReviewErrorBoundary>
          <ThrowError shouldThrow={false} />
        </TradeReviewErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('should navigate home when Go Home button is clicked', () => {
      const originalHref = window.location.href;
      
      render(
        <TradeReviewErrorBoundary>
          <ThrowError shouldThrow={true} />
        </TradeReviewErrorBoundary>
      );

      fireEvent.click(screen.getByText('Go Home'));

      expect(window.location.href).toBe('/');
      
      // Restore original href
      window.location.href = originalHref;
    });

    it('should copy error report when Report Error button is clicked', async () => {
      render(
        <TradeReviewErrorBoundary showDetails={true}>
          <ThrowError shouldThrow={true} />
        </TradeReviewErrorBoundary>
      );

      fireEvent.click(screen.getByText('Report Error'));

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('"message":"Test error"')
      );
      expect(global.alert).toHaveBeenCalledWith(
        'Error report copied to clipboard. Please share this with support.'
      );
    });

    it('should handle clipboard failure gracefully', async () => {
      (navigator.clipboard.writeText as any).mockRejectedValue(new Error('Clipboard failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <TradeReviewErrorBoundary>
          <ThrowError shouldThrow={true} />
        </TradeReviewErrorBoundary>
      );

      fireEvent.click(screen.getByText('Report Error'));

      // Wait for promise to resolve
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(consoleSpy).toHaveBeenCalledWith('Failed to copy error report to clipboard');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Error ID Generation', () => {
    it('should generate unique error IDs', () => {
      const { rerender } = render(
        <TradeReviewErrorBoundary showDetails={true}>
          <ThrowError shouldThrow={true} />
        </TradeReviewErrorBoundary>
      );

      const firstErrorId = screen.getByText(/Error ID:/).textContent;

      // Reset and throw another error
      fireEvent.click(screen.getByText('Try Again'));
      
      rerender(
        <TradeReviewErrorBoundary showDetails={true}>
          <ThrowError shouldThrow={true} />
        </TradeReviewErrorBoundary>
      );

      const secondErrorId = screen.getByText(/Error ID:/).textContent;

      expect(firstErrorId).not.toBe(secondErrorId);
    });
  });
});

describe('useErrorHandler', () => {
  const TestComponent = () => {
    const handleError = useErrorHandler();
    
    return (
      <button onClick={() => handleError(new Error('Hook error'), 'test-context')}>
        Trigger Error
      </button>
    );
  };

  it('should handle errors through the hook', () => {
    const { errorHandlingService } = require('../../../lib/errorHandlingService');
    
    render(<TestComponent />);
    
    fireEvent.click(screen.getByText('Trigger Error'));
    
    expect(errorHandlingService.createError).toHaveBeenCalledWith(
      'REVIEW_WORKFLOW_ERROR',
      'Hook error',
      { originalError: expect.any(Error), context: 'test-context' }
    );
    expect(errorHandlingService.handleError).toHaveBeenCalled();
  });
});

describe('withErrorBoundary', () => {
  const TestComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
    if (shouldThrow) {
      throw new Error('HOC error');
    }
    return <div>HOC component works</div>;
  };

  it('should wrap component with error boundary', () => {
    const WrappedComponent = withErrorBoundary(TestComponent);
    
    render(<WrappedComponent shouldThrow={false} />);
    
    expect(screen.getByText('HOC component works')).toBeInTheDocument();
  });

  it('should catch errors in wrapped component', () => {
    const WrappedComponent = withErrorBoundary(TestComponent);
    
    render(<WrappedComponent shouldThrow={true} />);
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should pass through error boundary props', () => {
    const customFallback = <div>HOC custom error</div>;
    const WrappedComponent = withErrorBoundary(TestComponent, {
      fallback: customFallback
    });
    
    render(<WrappedComponent shouldThrow={true} />);
    
    expect(screen.getByText('HOC custom error')).toBeInTheDocument();
  });

  it('should set correct display name', () => {
    const WrappedComponent = withErrorBoundary(TestComponent);
    
    expect(WrappedComponent.displayName).toBe('withErrorBoundary(TestComponent)');
  });
});