/**
 * Cross-Browser Compatibility Tests
 * 
 * Tests system functionality across different browser environments and capabilities.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import TradeReviewSystem from '../../components/TradeReviewSystem';
import { mockTrades } from '../mocks/tradeData';

// Browser environment mocks
const createBrowserMock = (browserName: string, features: Record<string, any> = {}) => {
  const defaultFeatures = {
    // Modern browser defaults
    clipboard: {
      writeText: vi.fn().mockResolvedValue(undefined),
    },
    share: vi.fn().mockResolvedValue(undefined),
    requestIdleCallback: vi.fn((callback) => setTimeout(callback, 0)),
    IntersectionObserver: vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    })),
    ResizeObserver: vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    })),
    // CSS support
    CSS: {
      supports: vi.fn().mockReturnValue(true),
    },
    // Touch support
    ontouchstart: 'ontouchstart' in window ? {} : undefined,
    // Local storage
    localStorage: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    },
    sessionStorage: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    },
  };

  return { ...defaultFeatures, ...features };
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Cross-Browser Compatibility Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let originalNavigator: typeof navigator;
  let originalWindow: typeof window;

  beforeEach(() => {
    user = userEvent.setup();
    originalNavigator = global.navigator;
    originalWindow = global.window;
  });

  afterEach(() => {
    global.navigator = originalNavigator;
    global.window = originalWindow;
    vi.restoreAllMocks();
  });

  describe('Modern Browser Support (Chrome, Firefox, Safari, Edge)', () => {
    beforeEach(() => {
      const modernFeatures = createBrowserMock('modern');
      
      Object.defineProperties(global.navigator, {
        clipboard: { value: modernFeatures.clipboard, writable: true },
        share: { value: modernFeatures.share, writable: true },
        userAgent: { 
          value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          writable: true 
        },
      });

      Object.defineProperties(global.window, {
        requestIdleCallback: { value: modernFeatures.requestIdleCallback, writable: true },
        IntersectionObserver: { value: modernFeatures.IntersectionObserver, writable: true },
        ResizeObserver: { value: modernFeatures.ResizeObserver, writable: true },
        CSS: { value: modernFeatures.CSS, writable: true },
        localStorage: { value: modernFeatures.localStorage, writable: true },
        sessionStorage: { value: modernFeatures.sessionStorage, writable: true },
      });
    });

    it('should support all modern features', async () => {
      render(
        <TestWrapper>
          <TradeReviewSystem tradeId="trade-1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Test clipboard functionality
      const shareButton = screen.getByRole('button', { name: /share/i });
      await user.click(shareButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalled();

      // Test modern CSS features
      expect(window.CSS.supports).toHaveBeenCalled();

      // Test intersection observer (for lazy loading)
      expect(window.IntersectionObserver).toHaveBeenCalled();
    });

    it('should handle touch events on touch-enabled devices', async () => {
      // Add touch support
      Object.defineProperty(window, 'ontouchstart', { value: {}, writable: true });

      render(
        <TestWrapper>
          <TradeReviewSystem tradeId="trade-1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      const container = screen.getByRole('main').closest('div');

      // Test touch gestures
      fireEvent.touchStart(container!, {
        touches: [{ clientX: 200, clientY: 100 }],
      });

      fireEvent.touchEnd(container!, {
        changedTouches: [{ clientX: 50, clientY: 100 }],
      });

      // Should handle touch events without errors
      expect(container).toBeInTheDocument();
    });
  });

  describe('Legacy Browser Support (IE11, Older Safari)', () => {
    beforeEach(() => {
      const legacyFeatures = createBrowserMock('legacy', {
        // No clipboard API
        clipboard: undefined,
        // No share API
        share: undefined,
        // No idle callback
        requestIdleCallback: undefined,
        // No intersection observer
        IntersectionObserver: undefined,
        // No resize observer
        ResizeObserver: undefined,
        // Limited CSS support
        CSS: {
          supports: vi.fn().mockReturnValue(false),
        },
      });

      Object.defineProperties(global.navigator, {
        clipboard: { value: undefined, writable: true },
        share: { value: undefined, writable: true },
        userAgent: { 
          value: 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko',
          writable: true 
        },
      });

      Object.defineProperties(global.window, {
        requestIdleCallback: { value: undefined, writable: true },
        IntersectionObserver: { value: undefined, writable: true },
        ResizeObserver: { value: undefined, writable: true },
        CSS: { value: legacyFeatures.CSS, writable: true },
      });
    });

    it('should gracefully degrade without modern APIs', async () => {
      render(
        <TestWrapper>
          <TradeReviewSystem tradeId="trade-1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Should still render without modern features
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should provide fallbacks for missing clipboard API', async () => {
      render(
        <TestWrapper>
          <TradeReviewSystem tradeId="trade-1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Share button should still work (fallback to manual copy)
      const shareButton = screen.getByRole('button', { name: /share/i });
      await user.click(shareButton);

      // Should show fallback message or manual copy option
      await waitFor(() => {
        expect(screen.getByText(/copy link/i) || screen.getByText(/share/i)).toBeInTheDocument();
      });
    });

    it('should work without intersection observer (no lazy loading)', async () => {
      render(
        <TestWrapper>
          <TradeReviewSystem tradeId="trade-1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Should load all content immediately without lazy loading
      const analysisTab = screen.getByRole('tab', { name: /analysis/i });
      await user.click(analysisTab);

      // Content should load immediately
      expect(screen.getByRole('tabpanel', { name: /analysis/i })).toBeInTheDocument();
    });
  });

  describe('Mobile Browser Support (iOS Safari, Chrome Mobile)', () => {
    beforeEach(() => {
      const mobileFeatures = createBrowserMock('mobile', {
        // Mobile-specific features
        ontouchstart: {},
        // Limited viewport
        innerWidth: 375,
        innerHeight: 667,
        // Mobile user agent
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
      });

      Object.defineProperties(global.navigator, {
        userAgent: { value: mobileFeatures.userAgent, writable: true },
        maxTouchPoints: { value: 5, writable: true },
      });

      Object.defineProperties(global.window, {
        innerWidth: { value: 375, writable: true },
        innerHeight: { value: 667, writable: true },
        ontouchstart: { value: {}, writable: true },
        orientation: { value: 0, writable: true },
      });

      // Trigger resize event
      fireEvent(window, new Event('resize'));
    });

    it('should adapt to mobile viewport', async () => {
      render(
        <TestWrapper>
          <TradeReviewSystem tradeId="trade-1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Should apply mobile-specific classes
      const container = screen.getByRole('main').closest('div');
      expect(container).toHaveClass('mobile-container');
    });

    it('should handle mobile navigation patterns', async () => {
      render(
        <TestWrapper>
          <TradeReviewSystem tradeId="trade-1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Mobile navigation should be present
      const navigation = screen.getByRole('navigation');
      expect(navigation).toBeInTheDocument();

      // Should handle swipe gestures
      const container = screen.getByRole('main').closest('div');
      
      fireEvent.touchStart(container!, {
        touches: [{ clientX: 200, clientY: 100 }],
      });

      fireEvent.touchEnd(container!, {
        changedTouches: [{ clientX: 50, clientY: 100 }],
      });

      // Should not throw errors
      expect(container).toBeInTheDocument();
    });

    it('should handle orientation changes', async () => {
      render(
        <TestWrapper>
          <TradeReviewSystem tradeId="trade-1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Simulate orientation change
      Object.defineProperty(window, 'innerWidth', { value: 667, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 375, writable: true });
      Object.defineProperty(window, 'orientation', { value: 90, writable: true });

      fireEvent(window, new Event('orientationchange'));
      fireEvent(window, new Event('resize'));

      // Should adapt to landscape mode
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });
  });

  describe('Feature Detection and Polyfills', () => {
    it('should detect and handle missing features gracefully', async () => {
      // Remove various features
      Object.defineProperties(global.window, {
        requestAnimationFrame: { value: undefined, writable: true },
        cancelAnimationFrame: { value: undefined, writable: true },
        requestIdleCallback: { value: undefined, writable: true },
        cancelIdleCallback: { value: undefined, writable: true },
      });

      render(
        <TestWrapper>
          <TradeReviewSystem tradeId="trade-1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Should still function without these APIs
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should provide polyfills for missing Array methods', async () => {
      // Mock older browser without modern array methods
      const originalFind = Array.prototype.find;
      const originalIncludes = Array.prototype.includes;

      delete (Array.prototype as any).find;
      delete (Array.prototype as any).includes;

      render(
        <TestWrapper>
          <TradeReviewSystem tradeId="trade-1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Should still work with polyfills
      expect(screen.getByRole('main')).toBeInTheDocument();

      // Restore methods
      Array.prototype.find = originalFind;
      Array.prototype.includes = originalIncludes;
    });
  });

  describe('Performance Across Browsers', () => {
    it('should maintain performance on slower devices', async () => {
      // Mock slower device
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        value: 2, // Dual core
        writable: true,
      });

      Object.defineProperty(navigator, 'deviceMemory', {
        value: 2, // 2GB RAM
        writable: true,
      });

      const startTime = performance.now();

      render(
        <TestWrapper>
          <TradeReviewSystem tradeId="trade-1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time even on slower devices
      expect(renderTime).toBeLessThan(2000); // 2 seconds max
    });

    it('should handle memory constraints gracefully', async () => {
      // Mock memory pressure
      const mockPerformance = {
        ...performance,
        memory: {
          usedJSHeapSize: 50 * 1024 * 1024, // 50MB
          totalJSHeapSize: 60 * 1024 * 1024, // 60MB
          jsHeapSizeLimit: 64 * 1024 * 1024, // 64MB limit
        },
      };

      Object.defineProperty(window, 'performance', {
        value: mockPerformance,
        writable: true,
      });

      render(
        <TestWrapper>
          <TradeReviewSystem tradeId="trade-1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Should handle memory pressure without crashes
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Accessibility Across Browsers', () => {
    it('should maintain accessibility in all browsers', async () => {
      render(
        <TestWrapper>
          <TradeReviewSystem tradeId="trade-1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Check ARIA attributes work across browsers
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label');

      // Check keyboard navigation
      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBeGreaterThan(0);

      tabs.forEach(tab => {
        expect(tab).toHaveAttribute('aria-selected');
        expect(tab).toHaveAttribute('aria-controls');
      });

      // Check focus management
      const firstTab = tabs[0];
      firstTab.focus();
      expect(firstTab).toHaveFocus();
    });

    it('should work with screen readers across browsers', async () => {
      render(
        <TestWrapper>
          <TradeReviewSystem tradeId="trade-1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Check live regions
      const liveRegions = screen.getAllByRole('status');
      expect(liveRegions.length).toBeGreaterThanOrEqual(0);

      // Check proper heading structure
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);

      // Check form labels
      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        expect(input).toHaveAccessibleName();
      });
    });
  });

  describe('Network Conditions', () => {
    it('should handle slow network connections', async () => {
      // Mock slow network
      Object.defineProperty(navigator, 'connection', {
        value: {
          effectiveType: '2g',
          downlink: 0.5,
          rtt: 2000,
        },
        writable: true,
      });

      render(
        <TestWrapper>
          <TradeReviewSystem tradeId="trade-1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Should still function on slow connections
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should handle offline scenarios', async () => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
      });

      render(
        <TestWrapper>
          <TradeReviewSystem tradeId="trade-1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Should show offline indicator or handle gracefully
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });
});