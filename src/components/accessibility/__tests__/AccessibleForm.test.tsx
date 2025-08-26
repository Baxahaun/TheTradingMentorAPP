import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { AccessibleInput, AccessibleSelect, AccessibleTextarea } from '../AccessibleForm';

expect.extend(toHaveNoViolations);

// Mock the responsive hook
jest.mock('../../../hooks/useResponsive', () => ({
  useResponsive: () => ({
    isMobile: false
  })
}));

describe('AccessibleInput', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(
      <AccessibleInput label="Test Input" />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render with proper labeling', () => {
    render(<AccessibleInput label="Email Address" />);
    
    const input = screen.getByLabelText('Email Address');
    const label = screen.getByText('Email Address');
    
    expect(input).toBeInTheDocument();
    expect(label).toBeInTheDocument();
    expect(label).toHaveAttribute('for', input.id);
  });

  it('should show required indicator when required', () => {
    render(<AccessibleInput label="Required Field" required />);
    
    const label = screen.getByText('Required Field');
    expect(label).toHaveClass('form-label-required');
    
    const requiredIndicator = screen.getByLabelText('required');
    expect(requiredIndicator).toBeInTheDocument();
    expect(requiredIndicator).toHaveTextContent('*');
  });

  it('should display hint text correctly', () => {
    render(
      <AccessibleInput 
        label="Password" 
        hint="Must be at least 8 characters"
      />
    );
    
    const input = screen.getByLabelText('Password');
    const hint = screen.getByText('Must be at least 8 characters');
    
    expect(hint).toHaveClass('form-hint');
    expect(input).toHaveAttribute('aria-describedby', expect.stringContaining(hint.id));
  });

  it('should display error message correctly', () => {
    render(
      <AccessibleInput 
        label="Email" 
        error="Please enter a valid email address"
      />
    );
    
    const input = screen.getByLabelText('Email');
    const error = screen.getByText('Please enter a valid email address');
    
    expect(error).toHaveClass('form-error');
    expect(error).toHaveAttribute('role', 'alert');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', expect.stringContaining(error.id));
  });

  it('should combine hint and error in aria-describedby', () => {
    render(
      <AccessibleInput 
        label="Password" 
        hint="Must be at least 8 characters"
        error="Password is too short"
      />
    );
    
    const input = screen.getByLabelText('Password');
    const hint = screen.getByText('Must be at least 8 characters');
    const error = screen.getByText('Password is too short');
    
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toContain(hint.id);
    expect(describedBy).toContain(error.id);
  });

  it('should apply mobile styles when on mobile', () => {
    jest.mocked(require('../../../hooks/useResponsive').useResponsive).mockReturnValue({
      isMobile: true
    });
    
    render(<AccessibleInput label="Mobile Input" />);
    
    const input = screen.getByLabelText('Mobile Input');
    expect(input).toHaveClass('form-input-mobile');
  });

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>();
    
    render(<AccessibleInput ref={ref} label="Ref Input" />);
    
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current).toBe(screen.getByLabelText('Ref Input'));
  });

  it('should pass through input props', () => {
    render(
      <AccessibleInput 
        label="Test Input"
        type="email"
        placeholder="Enter email"
        maxLength={50}
      />
    );
    
    const input = screen.getByLabelText('Test Input');
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('placeholder', 'Enter email');
    expect(input).toHaveAttribute('maxLength', '50');
  });

  it('should handle user input correctly', async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();
    
    render(
      <AccessibleInput 
        label="Test Input"
        onChange={handleChange}
      />
    );
    
    const input = screen.getByLabelText('Test Input');
    await user.type(input, 'test value');
    
    expect(handleChange).toHaveBeenCalled();
    expect(input).toHaveValue('test value');
  });
});

describe('AccessibleSelect', () => {
  const options = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3', disabled: true }
  ];

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <AccessibleSelect label="Test Select" options={options} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render with proper labeling', () => {
    render(<AccessibleSelect label="Country" options={options} />);
    
    const select = screen.getByLabelText('Country');
    const label = screen.getByText('Country');
    
    expect(select).toBeInTheDocument();
    expect(label).toBeInTheDocument();
    expect(label).toHaveAttribute('for', select.id);
  });

  it('should render all options correctly', () => {
    render(<AccessibleSelect label="Test Select" options={options} />);
    
    expect(screen.getByRole('option', { name: 'Option 1' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Option 2' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Option 3' })).toBeInTheDocument();
    
    // Disabled option should be disabled
    expect(screen.getByRole('option', { name: 'Option 3' })).toBeDisabled();
  });

  it('should render placeholder option when provided', () => {
    render(
      <AccessibleSelect 
        label="Test Select" 
        options={options}
        placeholder="Choose an option"
      />
    );
    
    const placeholder = screen.getByRole('option', { name: 'Choose an option' });
    expect(placeholder).toBeInTheDocument();
    expect(placeholder).toBeDisabled();
    expect(placeholder).toHaveValue('');
  });

  it('should handle selection correctly', async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();
    
    render(
      <AccessibleSelect 
        label="Test Select" 
        options={options}
        onChange={handleChange}
      />
    );
    
    const select = screen.getByLabelText('Test Select');
    await user.selectOptions(select, 'option2');
    
    expect(handleChange).toHaveBeenCalled();
    expect(select).toHaveValue('option2');
  });

  it('should apply mobile styles when on mobile', () => {
    jest.mocked(require('../../../hooks/useResponsive').useResponsive).mockReturnValue({
      isMobile: true
    });
    
    render(<AccessibleSelect label="Mobile Select" options={options} />);
    
    const select = screen.getByLabelText('Mobile Select');
    expect(select).toHaveClass('form-select-mobile');
  });
});

describe('AccessibleTextarea', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(
      <AccessibleTextarea label="Test Textarea" />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render with proper labeling', () => {
    render(<AccessibleTextarea label="Comments" />);
    
    const textarea = screen.getByLabelText('Comments');
    const label = screen.getByText('Comments');
    
    expect(textarea).toBeInTheDocument();
    expect(label).toBeInTheDocument();
    expect(label).toHaveAttribute('for', textarea.id);
  });

  it('should show required indicator when required', () => {
    render(<AccessibleTextarea label="Required Comments" required />);
    
    const label = screen.getByText('Required Comments');
    expect(label).toHaveClass('form-label-required');
    
    const requiredIndicator = screen.getByLabelText('required');
    expect(requiredIndicator).toBeInTheDocument();
  });

  it('should display hint and error correctly', () => {
    render(
      <AccessibleTextarea 
        label="Description" 
        hint="Maximum 500 characters"
        error="Description is required"
      />
    );
    
    const textarea = screen.getByLabelText('Description');
    const hint = screen.getByText('Maximum 500 characters');
    const error = screen.getByText('Description is required');
    
    expect(hint).toHaveClass('form-hint');
    expect(error).toHaveClass('form-error');
    expect(error).toHaveAttribute('role', 'alert');
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
    
    const describedBy = textarea.getAttribute('aria-describedby');
    expect(describedBy).toContain(hint.id);
    expect(describedBy).toContain(error.id);
  });

  it('should apply mobile styles when on mobile', () => {
    jest.mocked(require('../../../hooks/useResponsive').useResponsive).mockReturnValue({
      isMobile: true
    });
    
    render(<AccessibleTextarea label="Mobile Textarea" />);
    
    const textarea = screen.getByLabelText('Mobile Textarea');
    expect(textarea).toHaveClass('form-textarea-mobile');
  });

  it('should handle user input correctly', async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();
    
    render(
      <AccessibleTextarea 
        label="Test Textarea"
        onChange={handleChange}
      />
    );
    
    const textarea = screen.getByLabelText('Test Textarea');
    await user.type(textarea, 'test content');
    
    expect(handleChange).toHaveBeenCalled();
    expect(textarea).toHaveValue('test content');
  });

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLTextAreaElement>();
    
    render(<AccessibleTextarea ref={ref} label="Ref Textarea" />);
    
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
    expect(ref.current).toBe(screen.getByLabelText('Ref Textarea'));
  });

  it('should pass through textarea props', () => {
    render(
      <AccessibleTextarea 
        label="Test Textarea"
        rows={5}
        cols={50}
        maxLength={200}
        placeholder="Enter text here"
      />
    );
    
    const textarea = screen.getByLabelText('Test Textarea');
    expect(textarea).toHaveAttribute('rows', '5');
    expect(textarea).toHaveAttribute('cols', '50');
    expect(textarea).toHaveAttribute('maxLength', '200');
    expect(textarea).toHaveAttribute('placeholder', 'Enter text here');
  });
});