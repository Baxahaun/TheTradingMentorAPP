import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AdvancedTagManager, DEFAULT_TAG_CATEGORIES } from '../trade-review/AdvancedTagManager';
import { Trade } from '../../types/trade';
import { tagService } from '../../lib/tagService';

// Mock the tagService
vi.mock('../../lib/tagService', () => ({
  tagService: {
    getAllTagsWithCounts: vi.fn(),
    calculateTagPerformance: vi.fn(),
    normalizeTag: vi.fn((tag: string) => tag.toLowerCase().startsWith('#') ? tag : `#${tag}`),
    validateTag: vi.fn(() => ({ isValid: true, errors: [], warnings: [] })),
    processTags: vi.fn((tags: string[]) => tags),
  }
}));

// Mock the tag analytics dashboard
vi.mock('../ui/tag-analytics-dashboard', () => ({
  TagAnalyticsDashboard: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => 
    isOpen ? <div data-testid="analytics-dashboard">Analytics Dashboard</div> : null
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock toast
vi.mock('../../hooks/use-toast', () => ({
  toast: vi.fn(),
}));

// Sample test data
const mockTrades: Trade[] = [
  {
    id: '1',
    accountId: 'acc1',
    currencyPair: 'EUR/USD',
    date: '2024-01-15',
    timeIn: '09:00',
    timeOut: '10:00',
    side: 'long',
    entryPrice: 1.0950,
    exitPrice: 1.0980,
    lotSize: 1,
    lotType: 'standard',
    units: 100000,
    commission: 5,
    accountCurrency: 'USD',
    status: 'closed',
    pnl: 300,
    tags: ['#breakout', '#trend-following', '#major-pair'],
    strategy: 'Breakout Strategy',
    session: 'european'
  },
  {
    id: '2',
    accountId: 'acc1',
    currencyPair: 'GBP/USD',
    date: '2024-01-16',
    timeIn: '14:00',
    timeOut: '15:30',
    side: 'short',
    entryPrice: 1.2650,
    exitPrice: 1.2620,
    lotSize: 0.5,
    lotType: 'standard',
    units: 50000,
    commission: 3,
    accountCurrency: 'USD',
    status: 'closed',
    pnl: 150,
    tags: ['#reversal', '#scalping', '#major-pair'],
    strategy: 'Scalping',
    session: 'us'
  },
  {
    id: '3',
    accountId: 'acc1',
    currencyPair: 'USD/JPY',
    date: '2024-01-17',
    timeIn: '08:00',
    side: 'long',
    entryPrice: 148.50,
    lotSize: 1,
    lotType: 'standard',
    units: 100000,
    commission: 4,
    accountCurrency: 'USD',
    status: 'open',
    tags: ['#trend-following', '#asian-session', '#major-pair'],
    strategy: 'Trend Following',
    session: 'asian'
  }
];

const mockTagsWithCounts = [
  { tag: '#breakout', count: 5, lastUsed: '2024-01-15', trades: ['1', '4', '5'] },
  { tag: '#trend-following', count: 8, lastUsed: '2024-01-17', trades: ['1', '3', '6', '7'] },
  { tag: '#major-pair', count: 12, lastUsed: '2024-01-17', trades: ['1', '2', '3', '8', '9'] },
  { tag: '#scalping', count: 3, lastUsed: '2024-01-16', trades: ['2', '10'] },
  { tag: '#reversal', count: 4, lastUsed: '2024-01-16', trades: ['2', '11'] },
  { tag: '#asian-session', count: 6, lastUsed: '2024-01-17', trades: ['3', '12'] },
  { tag: '#european-session', count: 7, lastUsed: '2024-01-15', trades: ['1', '13'] },
  { tag: '#us-session', count: 5, lastUsed: '2024-01-16', trades: ['2', '14'] }
];

const mockTagPerformance = {
  tag: '#breakout',
  totalTrades: 5,
  winRate: 80,
  averagePnL: 250,
  profitFactor: 4.0
};

describe('AdvancedTagManager', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    trades: mockTrades,
    onTagClick: vi.fn(),
    onTagDeleted: vi.fn(),
    onBulkOperation: vi.fn(),
    showPerformanceMetrics: true,
    allowBulkOperations: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Setup tagService mocks
    (tagService.getAllTagsWithCounts as any).mockReturnValue(mockTagsWithCounts);
    (tagService.calculateTagPerformance as any).mockReturnValue(mockTagPerformance);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering and Basic Functionality', () => {
    it('renders the tag manager dialog when open', () => {
      render(<AdvancedTagManager {...defaultProps} />);
      
      expect(screen.getByText('Advanced Tag Manager')).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(<AdvancedTagManager {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText('Advanced Tag Manager')).not.toBeInTheDocument();
    });

    it('displays all tabs correctly', () => {
      render(<AdvancedTagManager {...defaultProps} />);
      
      expect(screen.getByRole('tab', { name: 'Manage Tags' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Categories' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Performance' })).toBeInTheDocument();
    });

    it('shows analytics and bulk edit buttons', () => {
      render(<AdvancedTagManager {...defaultProps} />);
      
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('Bulk Edit')).toBeInTheDocument();
    });
  });

  describe('Tag Display and Categorization', () => {
    it('displays tags with correct categorization', () => {
      render(<AdvancedTagManager {...defaultProps} />);
      
      // Check that tags are displayed
      expect(screen.getByText('breakout')).toBeInTheDocument();
      expect(screen.getByText('trend-following')).toBeInTheDocument();
      expect(screen.getByText('major-pair')).toBeInTheDocument();
    });

    it('shows tag usage counts', () => {
      render(<AdvancedTagManager {...defaultProps} />);
      
      // Check for usage count displays
      expect(screen.getByText('5 trades')).toBeInTheDocument();
      expect(screen.getByText('8 trades')).toBeInTheDocument();
      expect(screen.getByText('12 trades')).toBeInTheDocument();
    });

    it('displays performance metrics when enabled', () => {
      render(<AdvancedTagManager {...defaultProps} />);
      
      // Should show performance indicators for tags with sufficient data
      const performanceElements = screen.getAllByText(/WR$/); // Win Rate elements
      expect(performanceElements.length).toBeGreaterThan(0);
    });

    it('categorizes tags correctly based on keywords', () => {
      render(<AdvancedTagManager {...defaultProps} />);
      
      // Switch to categories tab
      fireEvent.click(screen.getByRole('tab', { name: 'Categories' }));
      
      // Check that categories are displayed
      DEFAULT_TAG_CATEGORIES.forEach(category => {
        expect(screen.getByText(category.name)).toBeInTheDocument();
      });
    });
  });

  describe('Search and Filtering', () => {
    it('filters tags based on search query', async () => {
      const user = userEvent.setup();
      render(<AdvancedTagManager {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('Search tags or categories...');
      
      // Search for 'breakout'
      await user.type(searchInput, 'breakout');
      
      // Should show breakout tag
      expect(screen.getByText('breakout')).toBeInTheDocument();
      
      // Should not show unrelated tags (assuming they're filtered out)
      // Note: This depends on the actual filtering implementation
    });

    it('filters by category', async () => {
      const user = userEvent.setup();
      render(<AdvancedTagManager {...defaultProps} />);
      
      // Open category filter
      const categorySelect = screen.getByRole('combobox');
      await user.click(categorySelect);
      
      // Select strategy category
      const strategyOption = screen.getByText('Strategy');
      await user.click(strategyOption);
      
      // Should filter tags accordingly
      // Note: This test would need to verify the actual filtering behavior
    });

    it('sorts tags by different criteria', async () => {
      const user = userEvent.setup();
      render(<AdvancedTagManager {...defaultProps} />);
      
      // Find and click the sort dropdown
      const sortSelects = screen.getAllByRole('combobox');
      const sortSelect = sortSelects.find(select => 
        within(select).queryByText('Usage') || 
        within(select).queryByDisplayValue('Usage')
      );
      
      if (sortSelect) {
        await user.click(sortSelect);
        
        // Select alphabetical sorting
        const alphabeticalOption = screen.getByText('A-Z');
        await user.click(alphabeticalOption);
        
        // Verify sorting changed (would need to check actual order)
      }
    });
  });

  describe('Bulk Operations', () => {
    it('enters bulk operation mode', async () => {
      const user = userEvent.setup();
      render(<AdvancedTagManager {...defaultProps} />);
      
      const bulkEditButton = screen.getByText('Bulk Edit');
      await user.click(bulkEditButton);
      
      // Should show bulk operation controls
      expect(screen.getByText('Exit Bulk')).toBeInTheDocument();
      expect(screen.getByText('Select all')).toBeInTheDocument();
    });

    it('selects and deselects tags in bulk mode', async () => {
      const user = userEvent.setup();
      render(<AdvancedTagManager {...defaultProps} />);
      
      // Enter bulk mode
      await user.click(screen.getByText('Bulk Edit'));
      
      // Select all checkbox should be available
      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all/i });
      expect(selectAllCheckbox).toBeInTheDocument();
      
      // Click select all
      await user.click(selectAllCheckbox);
      
      // Should show bulk operation buttons
      expect(screen.getByText('Star')).toBeInTheDocument();
      expect(screen.getByText('Hide')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('performs bulk star operation', async () => {
      const user = userEvent.setup();
      render(<AdvancedTagManager {...defaultProps} />);
      
      // Enter bulk mode and select tags
      await user.click(screen.getByText('Bulk Edit'));
      await user.click(screen.getByRole('checkbox', { name: /select all/i }));
      
      // Click star button
      const starButton = screen.getByText('Star');
      await user.click(starButton);
      
      // Should call onBulkOperation
      expect(defaultProps.onBulkOperation).toHaveBeenCalledWith({
        type: 'star',
        selectedTags: expect.any(Array)
      });
    });

    it('performs bulk delete operation with confirmation', async () => {
      const user = userEvent.setup();
      render(<AdvancedTagManager {...defaultProps} />);
      
      // Enter bulk mode and select tags
      await user.click(screen.getByText('Bulk Edit'));
      await user.click(screen.getByRole('checkbox', { name: /select all/i }));
      
      // Click delete button
      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);
      
      // Should show confirmation dialog
      expect(screen.getByText('Delete Selected Tags')).toBeInTheDocument();
      
      // Confirm deletion
      const confirmButton = screen.getByText('Delete Tags');
      await user.click(confirmButton);
      
      // Should call onBulkOperation
      expect(defaultProps.onBulkOperation).toHaveBeenCalledWith({
        type: 'delete',
        selectedTags: expect.any(Array)
      });
    });
  });

  describe('Individual Tag Operations', () => {
    it('stars and unstars individual tags', async () => {
      const user = userEvent.setup();
      render(<AdvancedTagManager {...defaultProps} />);
      
      // Find a tag card and its star button
      const tagCards = screen.getAllByRole('button', { name: /star/i });
      if (tagCards.length > 0) {
        await user.click(tagCards[0]);
        
        // Should update the star state (visual feedback)
        // Note: This would need to verify the actual star state change
      }
    });

    it('deletes individual tags with confirmation', async () => {
      const user = userEvent.setup();
      render(<AdvancedTagManager {...defaultProps} />);
      
      // Find a tag's more options button
      const moreButtons = screen.getAllByRole('button');
      const moreButton = moreButtons.find(button => 
        within(button).queryByTestId('more-horizontal')
      );
      
      if (moreButton) {
        await user.click(moreButton);
        
        // Click delete option
        const deleteOption = screen.getByText('Delete tag');
        await user.click(deleteOption);
        
        // Should show confirmation dialog
        expect(screen.getByText('Delete Tag')).toBeInTheDocument();
        
        // Confirm deletion
        const confirmButton = screen.getByText('Delete Tag');
        await user.click(confirmButton);
        
        // Should call onTagDeleted
        expect(defaultProps.onTagDeleted).toHaveBeenCalled();
      }
    });

    it('hides and shows individual tags', async () => {
      const user = userEvent.setup();
      render(<AdvancedTagManager {...defaultProps} />);
      
      // Find a tag's more options button and test hide functionality
      // This would be similar to the delete test but for hide/show
    });
  });

  describe('Analytics Integration', () => {
    it('opens analytics dashboard', async () => {
      const user = userEvent.setup();
      render(<AdvancedTagManager {...defaultProps} />);
      
      const analyticsButton = screen.getByText('Analytics');
      await user.click(analyticsButton);
      
      // Should show analytics dashboard
      expect(screen.getByTestId('analytics-dashboard')).toBeInTheDocument();
    });
  });

  describe('Performance Tab', () => {
    it('displays top performing tags', async () => {
      const user = userEvent.setup();
      render(<AdvancedTagManager {...defaultProps} />);
      
      // Switch to performance tab
      await user.click(screen.getByRole('tab', { name: 'Performance' }));
      
      // Should show performance-related content
      expect(screen.getByText('Top Performing Tags')).toBeInTheDocument();
      expect(screen.getByText('Needs Improvement')).toBeInTheDocument();
    });
  });

  describe('Categories Tab', () => {
    it('displays all tag categories', async () => {
      const user = userEvent.setup();
      render(<AdvancedTagManager {...defaultProps} />);
      
      // Switch to categories tab
      await user.click(screen.getByRole('tab', { name: 'Categories' }));
      
      // Should show all default categories
      DEFAULT_TAG_CATEGORIES.forEach(category => {
        expect(screen.getByText(category.name)).toBeInTheDocument();
      });
    });

    it('shows tags grouped by category', async () => {
      const user = userEvent.setup();
      render(<AdvancedTagManager {...defaultProps} />);
      
      // Switch to categories tab
      await user.click(screen.getByRole('tab', { name: 'Categories' }));
      
      // Should show tag counts for each category
      // Note: This would need to verify the actual categorization logic
    });
  });

  describe('Local Storage Integration', () => {
    it('loads starred tags from localStorage', () => {
      const starredTags = ['#breakout', '#trend-following'];
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'starredTags') return JSON.stringify(starredTags);
        return null;
      });
      
      render(<AdvancedTagManager {...defaultProps} />);
      
      // Should load starred tags from localStorage
      expect(localStorageMock.getItem).toHaveBeenCalledWith('starredTags');
    });

    it('saves preferences to localStorage', async () => {
      const user = userEvent.setup();
      render(<AdvancedTagManager {...defaultProps} />);
      
      // Perform an action that should save preferences (like starring a tag)
      // This would trigger the savePreferences function
      
      // Note: This test would need to verify that localStorage.setItem is called
      // with the correct data when preferences change
    });
  });

  describe('Error Handling', () => {
    it('handles tagService errors gracefully', () => {
      // Mock tagService to throw an error
      (tagService.getAllTagsWithCounts as any).mockImplementation(() => {
        throw new Error('Service error');
      });
      
      // Should not crash and should show empty state or error message
      expect(() => render(<AdvancedTagManager {...defaultProps} />)).not.toThrow();
    });

    it('handles empty trades array', () => {
      render(<AdvancedTagManager {...defaultProps} trades={[]} />);
      
      // Should show empty state
      expect(screen.getByText('No tags available')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<AdvancedTagManager {...defaultProps} />);
      
      // Check for proper dialog role
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      
      // Check for proper tab navigation
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      
      // Check for proper button labels
      expect(screen.getByRole('button', { name: /analytics/i })).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<AdvancedTagManager {...defaultProps} />);
      
      // Test tab navigation
      await user.tab();
      
      // Should be able to navigate through interactive elements
      // Note: This would need more specific keyboard navigation tests
    });
  });

  describe('Responsive Behavior', () => {
    it('adapts layout for different screen sizes', () => {
      // This would require testing with different viewport sizes
      // and verifying that the responsive classes work correctly
      render(<AdvancedTagManager {...defaultProps} />);
      
      // Check for responsive grid classes
      const tagGrid = screen.getByRole('dialog').querySelector('.grid');
      expect(tagGrid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
    });
  });
});