# Accessibility Components

This directory contains accessible UI components that follow WCAG 2.1 AA guidelines and provide excellent user experience for users with disabilities.

## Components

### AccessibleButton & AccessibleIconButton

Fully accessible button components with proper ARIA attributes, keyboard navigation, and mobile touch support.

**Features:**
- WCAG 2.1 AA compliant
- Proper focus management and visual indicators
- Screen reader support with ARIA labels
- Touch-friendly sizing (minimum 44px target)
- Loading states with proper announcements
- Keyboard navigation (Enter/Space activation)
- High contrast mode support

**Usage:**
```tsx
import { AccessibleButton, AccessibleIconButton } from './accessibility/AccessibleButton';

// Standard button
<AccessibleButton 
  variant="primary" 
  onClick={handleClick}
  loading={isLoading}
  loadingText="Saving..."
>
  Save Strategy
</AccessibleButton>

// Icon button
<AccessibleIconButton
  icon={<Settings />}
  label="Open settings"
  tooltip="Configure strategy settings"
  onClick={handleSettings}
/>
```

### AccessibleForm Components

Form components with proper labeling, error handling, and accessibility features.

**Components:**
- `AccessibleInput` - Text input with label, hint, and error support
- `AccessibleSelect` - Select dropdown with proper ARIA attributes
- `AccessibleTextarea` - Multi-line text input

**Features:**
- Automatic ID generation and label association
- Required field indicators
- Error announcements with `role="alert"`
- Hint text with proper `aria-describedby`
- Mobile-optimized input sizes (prevents zoom on iOS)
- Validation state indicators

**Usage:**
```tsx
import { AccessibleInput, AccessibleSelect } from './accessibility/AccessibleForm';

<AccessibleInput
  label="Strategy Name"
  required
  hint="Choose a descriptive name for your strategy"
  error={errors.name}
  value={strategyName}
  onChange={(e) => setStrategyName(e.target.value)}
/>

<AccessibleSelect
  label="Methodology"
  options={[
    { value: 'technical', label: 'Technical Analysis' },
    { value: 'fundamental', label: 'Fundamental Analysis' }
  ]}
  value={methodology}
  onChange={(e) => setMethodology(e.target.value)}
/>
```

### AccessibleChart & AccessiblePerformanceIndicator

Chart and data visualization components with screen reader support.

**Features:**
- Alternative text descriptions for charts
- Keyboard navigation with data announcements
- Accessible data tables for screen readers
- Performance indicators with trend information
- High contrast mode support

**Usage:**
```tsx
import { AccessibleChart, AccessiblePerformanceIndicator } from './accessibility/AccessibleChart';

<AccessibleChart
  data={performanceData}
  title="Strategy Performance Over Time"
  type="line"
>
  <YourChartComponent data={performanceData} />
</AccessibleChart>

<AccessiblePerformanceIndicator
  label="Profit Factor"
  value={2.1}
  previousValue={1.8}
  format="number"
  trend="up"
/>
```

## Accessibility Features

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Proper tab order and focus management
- Visual focus indicators
- Keyboard shortcuts for common actions

### Screen Reader Support
- Semantic HTML structure
- Proper ARIA labels and descriptions
- Live regions for dynamic content updates
- Alternative text for visual content

### High Contrast Mode
- Automatic detection of system preference
- Manual toggle option
- Enhanced color contrast ratios
- Clear visual boundaries

### Mobile Accessibility
- Touch-friendly target sizes (minimum 44px)
- Proper touch event handling
- Mobile-optimized form inputs
- Gesture support where appropriate

## Testing

### Automated Testing
```bash
# Run accessibility tests
npm test -- --testPathPattern=accessibility

# Run with axe-core integration
npm test -- --testNamePattern="accessibility violations"
```

### Manual Testing Checklist
- [ ] Keyboard navigation works for all interactive elements
- [ ] Screen reader announces all important information
- [ ] High contrast mode provides sufficient contrast
- [ ] Touch targets are at least 44px on mobile
- [ ] Focus indicators are clearly visible
- [ ] Error messages are announced properly

### Testing Tools
- **axe-core**: Automated accessibility testing
- **jest-axe**: Jest integration for accessibility tests
- **Screen readers**: NVDA, JAWS, VoiceOver for manual testing
- **Keyboard only**: Test navigation without mouse

## Best Practices

### Component Development
1. **Semantic HTML**: Use proper HTML elements for their intended purpose
2. **ARIA Labels**: Provide clear, descriptive labels for all interactive elements
3. **Focus Management**: Ensure logical tab order and visible focus indicators
4. **Error Handling**: Use `role="alert"` for error messages
5. **Loading States**: Announce loading states to screen readers

### Testing Guidelines
1. **Automated Tests**: Include axe-core tests for all components
2. **Keyboard Testing**: Test all functionality with keyboard only
3. **Screen Reader Testing**: Verify content is properly announced
4. **Mobile Testing**: Test on actual devices with assistive technology

### Common Patterns
```tsx
// Proper button labeling
<button aria-label="Delete strategy" onClick={handleDelete}>
  <TrashIcon aria-hidden="true" />
</button>

// Form field association
<label htmlFor="strategy-name">Strategy Name</label>
<input 
  id="strategy-name"
  aria-describedby="name-hint name-error"
  aria-invalid={hasError}
/>
<div id="name-hint">Choose a descriptive name</div>
{hasError && <div id="name-error" role="alert">Name is required</div>}

// Live region for announcements
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {announcement}
</div>
```

## Browser Support

### Screen Readers
- **Windows**: NVDA, JAWS
- **macOS**: VoiceOver
- **Mobile**: TalkBack (Android), VoiceOver (iOS)

### Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)
- [Inclusive Design Principles](https://inclusivedesignprinciples.org/)