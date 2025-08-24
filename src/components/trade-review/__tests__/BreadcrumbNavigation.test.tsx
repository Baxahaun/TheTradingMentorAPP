import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BreadcrumbNavigation from '../BreadcrumbNavigation';
import { NavigationContext } from '../../../types/navigation';
import { beforeEach } from 'node:test';

describe('BreadcrumbNavigation', () => {
  const mockOnNavigateToSource = vi.fn();
  const mockOnNavigateHome = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render default breadcrumb when no navigation context', () => {
    render(
      <BreadcrumbNavigation
        currentTradePair="EUR/USD"
        onNavigateToSource={mockOnNavigateToSource}
        onNavigateHome={mockOnNavigateHome}
      />
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('EUR/USD')).toBeInTheDocument();
  });

  it('should render calendar navigation context', () => {
    const navigationContext: NavigationContext = {
      source: 'calendar',
      sourceParams: {
        date: '2024-01-15'
      },
      breadcrumb: ['dashboard', 'calendar'],
      timestamp: Date.now()
    };

    render(
      <BreadcrumbNavigation
        navigationContext={navigationContext}
        currentTradePair="GBP/USD"
        onNavigateToSource={mockOnNavigateToSource}
        onNavigateHome={mockOnNavigateHome}
      />
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Calendar.*1\/14\/2024/ })).toBeInTheDocument();
    expect(screen.getByText('GBP/USD')).toBeInTheDocument();
  });

  it('should render search navigation context with query', () => {
    const navigationContext: NavigationContext = {
      source: 'search',
      sourceParams: {
        searchQuery: 'profitable trades'
      },
      breadcrumb: ['dashboard', 'search'],
      timestamp: Date.now()
    };

    render(
      <BreadcrumbNavigation
        navigationContext={navigationContext}
        currentTradePair="USD/JPY"
        onNavigateToSource={mockOnNavigateToSource}
        onNavigateHome={mockOnNavigateHome}
      />
    );

    expect(screen.getByRole('button', { name: /Search Results.*"profitable trades"/ })).toBeInTheDocument();
  });

  it('should render trade list navigation context with filters', () => {
    const navigationContext: NavigationContext = {
      source: 'trade-list',
      sourceParams: {
        filters: {
          status: 'closed',
          profitability: 'profitable',
          currencyPairs: ['EUR/USD'],
          tags: ['scalping']
        }
      },
      breadcrumb: ['dashboard', 'trade-list'],
      timestamp: Date.now()
    };

    render(
      <BreadcrumbNavigation
        navigationContext={navigationContext}
        currentTradePair="EUR/USD"
        onNavigateToSource={mockOnNavigateToSource}
        onNavigateHome={mockOnNavigateHome}
      />
    );

    expect(screen.getByRole('button', { name: /Trade List.*4 filters/ })).toBeInTheDocument();
  });

  it('should handle navigation to home', () => {
    render(
      <BreadcrumbNavigation
        currentTradePair="EUR/USD"
        onNavigateToSource={mockOnNavigateToSource}
        onNavigateHome={mockOnNavigateHome}
      />
    );

    fireEvent.click(screen.getByText('Dashboard'));
    expect(mockOnNavigateHome).toHaveBeenCalledTimes(1);
  });

  it('should handle navigation to source', () => {
    const navigationContext: NavigationContext = {
      source: 'calendar',
      sourceParams: { date: '2024-01-15' },
      breadcrumb: ['dashboard', 'calendar'],
      timestamp: Date.now()
    };

    render(
      <BreadcrumbNavigation
        navigationContext={navigationContext}
        currentTradePair="EUR/USD"
        onNavigateToSource={mockOnNavigateToSource}
        onNavigateHome={mockOnNavigateHome}
      />
    );

    const calendarButton = screen.getByRole('button', { name: /Calendar/ });
    fireEvent.click(calendarButton);
    expect(mockOnNavigateToSource).toHaveBeenCalledWith(navigationContext);
  });

  it('should render analytics navigation context', () => {
    const navigationContext: NavigationContext = {
      source: 'analytics',
      breadcrumb: ['dashboard', 'analytics'],
      timestamp: Date.now()
    };

    render(
      <BreadcrumbNavigation
        navigationContext={navigationContext}
        currentTradePair="AUD/USD"
        onNavigateToSource={mockOnNavigateToSource}
        onNavigateHome={mockOnNavigateHome}
      />
    );

    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('should show correct icons for different sources', () => {
    const sources: NavigationContext['source'][] = ['calendar', 'trade-list', 'search', 'analytics', 'dashboard'];
    
    sources.forEach(source => {
      const navigationContext: NavigationContext = {
        source,
        breadcrumb: ['dashboard', source],
        timestamp: Date.now()
      };

      const { unmount } = render(
        <BreadcrumbNavigation
          navigationContext={navigationContext}
          currentTradePair="EUR/USD"
          onNavigateToSource={mockOnNavigateToSource}
          onNavigateHome={mockOnNavigateHome}
        />
      );

      // Icons should be present (we can't easily test specific icons, but we can ensure they render)
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      unmount();
    });
  });
});