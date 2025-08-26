import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { AccessibleButton, AccessibleIconButton } from '../AccessibleButton';

expect.extend(toHaveNoViolations);

// Mock the responsive hook
jest.mock('../../../hooks/useResponsive', () => ({
  useMobileInteractions: () => ({
    getTouchProps: jest.fn(() => ({}))
  })
}));

describe('AccessibleButton', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(
      <AccessibleButton>Test Button</AccessibleButton>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render with correct default props', () => {
    render(<AccessibleButton>Test Button</AccessibleButton>);
    
    const button = screen.getByRole('button', { name: 'Test Button' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('accessible-button', 'button-primary', 'button-md');
  });

  it('should apply variant classes correctly', () => {
    const { rerender } = render(
      <AccessibleButton variant="secondary">Secondary</AccessibleButton>
    );
    
    expect(screen.getByRole('button')).toHaveClass('button-secondary');
    
    rerender(<AccessibleButton variant="danger">Danger</AccessibleButton>);
    expect(screen.getByRole('button')).toHaveClass('button-danger');
  });

  it('should apply size classes correctly', () => {
    const { rerender } = render(
      <AccessibleButton size="sm">Small</AccessibleButton>
    );
    
    expect(screen.getByRole('button')).toHaveClass('button-sm');
    
    rerender(<AccessibleButton size="lg">Large</AccessibleButton>);
    expect(screen.getByRole('button')).toHaveClass('button-lg');
  });

  it('should handle loading state correctly', () => {
    render(
      <AccessibleButton loading loadingText="Processing...">
        Submit
      </AccessibleButton>
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('button-loading');
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toBeDisabled();
    
    expect(screen.getByText('Processing...')).toBeInTheDocument();
    expect(screen.getByLabelText('Processing...')).toBeInTheDocument(); // Screen reader text
  });

  it('should handle disabled state correctly', () => {
    render(<AccessibleButton disabled>Disabled Button</AccessibleButton>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveClass('button-disabled');
  });

  it('should render icons correctly', () => {
    const leftIcon = <span data-testid="left-icon">←</span>;
    const rightIcon = <span data-testid="right-icon">→</span>;
    
    render(
      <AccessibleButton leftIcon={leftIcon} rightIcon={rightIcon}>
        Button with Icons
      </AccessibleButton>
    );
    
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    
    // Icons should be hidden from screen readers
    expect(screen.getByTestId('left-icon').parentElement).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByTestId('right-icon').parentElement).toHaveAttribute('aria-hidden', 'true');
  });

  it('should not render icons when loading', () => {
    const leftIcon = <span data-testid="left-icon">←</span>;
    
    render(
      <AccessibleButton loading leftIcon={leftIcon}>
        Loading Button
      </AccessibleButton>
    );
    
    expect(screen.queryByTestId('left-icon')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument(); // Loading spinner
  });

  it('should handle click events correctly', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();
    
    render(<AccessibleButton onClick={handleClick}>Click Me</AccessibleButton>);
    
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should not trigger click when disabled', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();
    
    render(
      <AccessibleButton disabled onClick={handleClick}>
        Disabled Button
      </AccessibleButton>
    );
    
    await user.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should not trigger click when loading', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();
    
    render(
      <AccessibleButton loading onClick={handleClick}>
        Loading Button
      </AccessibleButton>
    );
    
    await user.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should support keyboard navigation', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();
    
    render(<AccessibleButton onClick={handleClick}>Keyboard Button</AccessibleButton>);
    
    const button = screen.getByRole('button');
    
    // Tab to focus
    await user.tab();
    expect(button).toHaveFocus();
    
    // Enter to activate
    await user.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalledTimes(1);
    
    // Space to activate
    await user.keyboard(' ');
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLButtonElement>();
    
    render(<AccessibleButton ref={ref}>Ref Button</AccessibleButton>);
    
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current).toBe(screen.getByRole('button'));
  });

  it('should merge custom className', () => {
    render(
      <AccessibleButton className="custom-class">
        Custom Class Button
      </AccessibleButton>
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('accessible-button', 'custom-class');
  });

  it('should pass through additional props', () => {
    render(
      <AccessibleButton data-testid="custom-button" title="Custom Title">
        Custom Props Button
      </AccessibleButton>
    );
    
    const button = screen.getByTestId('custom-button');
    expect(button).toHaveAttribute('title', 'Custom Title');
  });
});

describe('AccessibleIconButton', () => {
  const mockIcon = <span data-testid="icon">🔍</span>;

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <AccessibleIconButton icon={mockIcon} label="Search" />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render with correct accessibility attributes', () => {
    render(
      <AccessibleIconButton 
        icon={mockIcon} 
        label="Search" 
        tooltip="Search for items"
      />
    );
    
    const button = screen.getByRole('button', { name: 'Search' });
    expect(button).toHaveAttribute('aria-label', 'Search');
    expect(button).toHaveAttribute('title', 'Search for items');
    expect(button).toHaveClass('icon-button');
  });

  it('should use label as tooltip when tooltip not provided', () => {
    render(<AccessibleIconButton icon={mockIcon} label="Search" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', 'Search');
  });

  it('should hide icon from screen readers', () => {
    render(<AccessibleIconButton icon={mockIcon} label="Search" />);
    
    const icon = screen.getByTestId('icon');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  it('should provide screen reader text', () => {
    render(<AccessibleIconButton icon={mockIcon} label="Search" />);
    
    expect(screen.getByText('Search')).toHaveClass('sr-only');
  });

  it('should handle all button props', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();
    
    render(
      <AccessibleIconButton 
        icon={mockIcon} 
        label="Search" 
        onClick={handleClick}
        disabled={false}
        loading={false}
      />
    );
    
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });

  it('should merge custom className with icon-button class', () => {
    render(
      <AccessibleIconButton 
        icon={mockIcon} 
        label="Search" 
        className="custom-icon-button"
      />
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('icon-button', 'custom-icon-button');
  });

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLButtonElement>();
    
    render(
      <AccessibleIconButton 
        ref={ref}
        icon={mockIcon} 
        label="Search"
      />
    );
    
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current).toBe(screen.getByRole('button'));
  });
});