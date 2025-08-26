import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MobileNavigation, BottomTabNavigation } from '../MobileNavigation';

expect.extend(toHaveNoViolations);

// Mock hooks
jest.mock('../../../hooks/useResponsive', () => ({
  useResponsive: () => ({
    isMobile: true
  })
}));

jest.mock('../../../hooks/useAccessibility', () => ({
  useKeyboardNavigation: () => ({
    focusedIndex: -1,
    containerRef: { current: null }
  }),
  useFocusTrap: () => ({ current: null })
}));

const mockNavigationItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <span data-testid="dashboard-icon">📊</span>
  },
  {
    id: 'strategies',
    label: 'Strategies',
    icon: <span data-testid="strategies-icon">📋</span>,
    badge: 3
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <span data-testid="settings-icon">⚙️</span>,
    disabled: true
  }
];

describe('MobileNavigation', () => {
  const defaultProps = {
    items: mockNavigationItems,
    activeItem: 'dashboard',
    onItemSelect: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Mobile View', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<MobileNavigation {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should render mobile header with hamburger menu', () => {
      render(<MobileNavigation {...defaultProps} />);
      
      expect(screen.getByLabelText(/open menu/i)).toBeInTheDocument();
      expect(screen.getByText('Strategy Management')).toBeInTheDocument();
    });

    it('should toggle menu on hamburger click', async () => {
      const user = userEvent.setup();
      render(<MobileNavigation {...defaultProps} />);
      
      const menuButton = screen.getByLabelText(/open menu/i);
      
      // Menu should be closed initially
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByRole('navigation', { name: /main navigation/i })).not.toBeInTheDocument();
      
      // Open menu
      await user.click(menuButton);
      
      expect(menuButton).toHaveAttribute('aria-expanded', 'true');
      expect(menuButton).toHaveAttribute('aria-controls', 'mobile-nav-menu');
      expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
      
      // Close menu
      await user.click(menuButton);
      
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('should render navigation items in slide-out menu', async () => {
      const user = userEvent.setup();
      render(<MobileNavigation {...defaultProps} />);
      
      // Open menu
      await user.click(screen.getByLabelText(/open menu/i));
      
      // Check all items are rendered
      expect(screen.getByRole('menuitem', { name: /dashboard/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /strategies/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /settings/i })).toBeInTheDocument();
      
      // Check icons are rendered
      expect(screen.getByTestId('dashboard-icon')).toBeInTheDocument();
      expect(screen.getByTestId('strategies-icon')).toBeInTheDocument();
      expect(screen.getByTestId('settings-icon')).toBeInTheDocument();
    });

    it('should show badges correctly', async () => {
      const user = userEvent.setup();
      render(<MobileNavigation {...defaultProps} />);
      
      await user.click(screen.getByLabelText(/open menu/i));
      
      const badge = screen.getByLabelText('3 notifications');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('3');
    });

    it('should handle active item correctly', async () => {
      const user = userEvent.setup();
      render(<MobileNavigation {...defaultProps} />);
      
      await user.click(screen.getByLabelText(/open menu/i));
      
      const activeItem = screen.getByRole('menuitem', { name: /dashboard/i });
      expect(activeItem).toHaveAttribute('aria-current', 'page');
      expect(activeItem).toHaveClass('mobile-nav-item-active');
    });

    it('should handle disabled items correctly', async () => {
      const user = userEvent.setup();
      render(<MobileNavigation {...defaultProps} />);
      
      await user.click(screen.getByLabelText(/open menu/i));
      
      const disabledItem = screen.getByRole('menuitem', { name: /settings/i });
      expect(disabledItem).toBeDisabled();
    });

    it('should call onItemSelect when item is clicked', async () => {
      const user = userEvent.setup();
      const onItemSelect = jest.fn();
      
      render(<MobileNavigation {...defaultProps} onItemSelect={onItemSelect} />);
      
      await user.click(screen.getByLabelText(/open menu/i));
      await user.click(screen.getByRole('menuitem', { name: /strategies/i }));
      
      expect(onItemSelect).toHaveBeenCalledWith(mockNavigationItems[1]);
    });

    it('should close menu after item selection', async () => {
      const user = userEvent.setup();
      render(<MobileNavigation {...defaultProps} />);
      
      const menuButton = screen.getByLabelText(/open menu/i);
      
      // Open menu
      await user.click(menuButton);
      expect(menuButton).toHaveAttribute('aria-expanded', 'true');
      
      // Select item
      await user.click(screen.getByRole('menuitem', { name: /strategies/i }));
      
      // Menu should close
      await waitFor(() => {
        expect(menuButton).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('should close menu when backdrop is clicked', async () => {
      const user = userEvent.setup();
      render(<MobileNavigation {...defaultProps} />);
      
      const menuButton = screen.getByLabelText(/open menu/i);
      
      // Open menu
      await user.click(menuButton);
      expect(menuButton).toHaveAttribute('aria-expanded', 'true');
      
      // Click backdrop
      const backdrop = document.querySelector('.mobile-nav-backdrop');
      if (backdrop) {
        fireEvent.click(backdrop);
      }
      
      await waitFor(() => {
        expect(menuButton).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<MobileNavigation {...defaultProps} />);
      
      // Open menu with keyboard
      const menuButton = screen.getByLabelText(/open menu/i);
      await user.tab();
      expect(menuButton).toHaveFocus();
      
      await user.keyboard('{Enter}');
      expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should change hamburger icon when menu is open', async () => {
      const user = userEvent.setup();
      render(<MobileNavigation {...defaultProps} />);
      
      const menuButton = screen.getByLabelText(/open menu/i);
      
      // Check closed state icon (hamburger)
      expect(menuButton.querySelector('path')).toHaveAttribute('d', 'M4 6h16M4 12h16M4 18h16');
      
      // Open menu
      await user.click(menuButton);
      
      // Check open state icon (X)
      expect(menuButton.querySelector('path')).toHaveAttribute('d', 'M6 18L18 6M6 6l12 12');
    });
  });

  describe('Desktop View', () => {
    beforeEach(() => {
      jest.mocked(require('../../../hooks/useResponsive').useResponsive).mockReturnValue({
        isMobile: false
      });
    });

    it('should render horizontal navigation on desktop', () => {
      render(<MobileNavigation {...defaultProps} />);
      
      expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
      expect(screen.getByRole('menubar')).toBeInTheDocument();
      expect(screen.queryByLabelText(/open menu/i)).not.toBeInTheDocument();
    });

    it('should render all items as menuitem buttons', () => {
      render(<MobileNavigation {...defaultProps} />);
      
      expect(screen.getByRole('menuitem', { name: /dashboard/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /strategies/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /settings/i })).toBeInTheDocument();
    });

    it('should handle item selection on desktop', async () => {
      const user = userEvent.setup();
      const onItemSelect = jest.fn();
      
      render(<MobileNavigation {...defaultProps} onItemSelect={onItemSelect} />);
      
      await user.click(screen.getByRole('menuitem', { name: /strategies/i }));
      
      expect(onItemSelect).toHaveBeenCalledWith(mockNavigationItems[1]);
    });
  });
});

describe('BottomTabNavigation', () => {
  const defaultProps = {
    items: mockNavigationItems,
    activeItem: 'dashboard',
    onItemSelect: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(<BottomTabNavigation {...defaultProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render tab navigation on mobile', () => {
    render(<BottomTabNavigation {...defaultProps} />);
    
    expect(screen.getByRole('tablist', { name: /main navigation tabs/i })).toBeInTheDocument();
  });

  it('should not render on desktop', () => {
    jest.mocked(require('../../../hooks/useResponsive').useResponsive).mockReturnValue({
      isMobile: false
    });
    
    const { container } = render(<BottomTabNavigation {...defaultProps} />);
    
    expect(container.firstChild).toBeNull();
  });

  it('should render tabs with proper ARIA attributes', () => {
    render(<BottomTabNavigation {...defaultProps} />);
    
    const dashboardTab = screen.getByRole('tab', { name: /dashboard/i });
    expect(dashboardTab).toHaveAttribute('aria-selected', 'true');
    expect(dashboardTab).toHaveAttribute('aria-controls', 'panel-dashboard');
    
    const strategiesTab = screen.getByRole('tab', { name: /strategies/i });
    expect(strategiesTab).toHaveAttribute('aria-selected', 'false');
    expect(strategiesTab).toHaveAttribute('aria-controls', 'panel-strategies');
  });

  it('should limit to 5 items maximum', () => {
    const manyItems = Array.from({ length: 10 }, (_, i) => ({
      id: `item-${i}`,
      label: `Item ${i}`,
      icon: <span>Icon</span>
    }));
    
    render(<BottomTabNavigation {...defaultProps} items={manyItems} />);
    
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(5);
  });

  it('should show badges correctly', () => {
    render(<BottomTabNavigation {...defaultProps} />);
    
    const badge = screen.getByLabelText('3 notifications');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('3');
    expect(badge).toHaveClass('bottom-tab-badge');
  });

  it('should handle tab selection', async () => {
    const user = userEvent.setup();
    const onItemSelect = jest.fn();
    
    render(<BottomTabNavigation {...defaultProps} onItemSelect={onItemSelect} />);
    
    await user.click(screen.getByRole('tab', { name: /strategies/i }));
    
    expect(onItemSelect).toHaveBeenCalledWith(mockNavigationItems[1]);
  });

  it('should handle disabled tabs', () => {
    render(<BottomTabNavigation {...defaultProps} />);
    
    const disabledTab = screen.getByRole('tab', { name: /settings/i });
    expect(disabledTab).toBeDisabled();
  });

  it('should apply active styles correctly', () => {
    render(<BottomTabNavigation {...defaultProps} />);
    
    const activeTab = screen.getByRole('tab', { name: /dashboard/i });
    expect(activeTab).toHaveClass('bottom-tab-active');
    
    const inactiveTab = screen.getByRole('tab', { name: /strategies/i });
    expect(inactiveTab).not.toHaveClass('bottom-tab-active');
  });

  it('should render icons and labels correctly', () => {
    render(<BottomTabNavigation {...defaultProps} />);
    
    expect(screen.getByTestId('dashboard-icon')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    
    // Icons should be hidden from screen readers
    const iconContainer = screen.getByTestId('dashboard-icon').parentElement;
    expect(iconContainer).toHaveAttribute('aria-hidden', 'true');
  });

  it('should support keyboard navigation', async () => {
    const user = userEvent.setup();
    const onItemSelect = jest.fn();
    
    render(<BottomTabNavigation {...defaultProps} onItemSelect={onItemSelect} />);
    
    const strategiesTab = screen.getByRole('tab', { name: /strategies/i });
    
    // Tab to focus
    await user.tab();
    await user.tab(); // Skip dashboard tab
    expect(strategiesTab).toHaveFocus();
    
    // Enter to activate
    await user.keyboard('{Enter}');
    expect(onItemSelect).toHaveBeenCalledWith(mockNavigationItems[1]);
  });
});