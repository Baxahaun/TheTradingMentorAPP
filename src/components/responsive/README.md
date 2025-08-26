# Responsive Components

This directory contains responsive UI components that adapt to different screen sizes and provide optimal user experience across desktop, tablet, and mobile devices.

## Components

### MobileNavigation & BottomTabNavigation

Adaptive navigation components that provide different layouts for mobile and desktop.

**Features:**
- Responsive design that adapts to screen size
- Mobile hamburger menu with slide-out panel
- Bottom tab navigation for mobile
- Horizontal navigation for desktop
- Touch-friendly interactions
- Keyboard navigation support
- Focus trap in mobile menu

**Usage:**
```tsx
import { MobileNavigation, BottomTabNavigation } from './responsive/MobileNavigation';

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 /> },
  { id: 'strategies', label: 'Strategies', icon: <BookOpen />, badge: 3 },
  { id: 'settings', label: 'Settings', icon: <Settings /> }
];

// Adaptive navigation (mobile hamburger, desktop horizontal)
<MobileNavigation
  items={navigationItems}
  activeItem="dashboard"
  onItemSelect={handleNavigation}
/>

// Bottom tab navigation (mobile only)
<BottomTabNavigation
  items={navigationItems}
  activeItem="dashboard"
  onItemSelect={handleNavigation}
/>
```

### ResponsiveGrid, ResponsiveStack & ResponsiveContainer

Layout components that adapt to different screen sizes with configurable breakpoints.

**Features:**
- CSS Grid and Flexbox based layouts
- Configurable columns per breakpoint
- Responsive spacing and gaps
- Container max-widths and padding
- Direction changes based on screen size

**Usage:**
```tsx
import { ResponsiveGrid, ResponsiveStack, ResponsiveContainer } from './responsive/ResponsiveGrid';

// Responsive grid
<ResponsiveGrid 
  columns={{ xs: 1, sm: 2, md: 3, lg: 4 }}
  gap={4}
>
  {strategies.map(strategy => (
    <StrategyCard key={strategy.id} strategy={strategy} />
  ))}
</ResponsiveGrid>

// Responsive stack
<ResponsiveStack 
  direction={{ xs: 'column', md: 'row' }}
  spacing={4}
  align="center"
>
  <Button>Primary Action</Button>
  <Button variant="secondary">Secondary Action</Button>
</ResponsiveStack>

// Responsive container
<ResponsiveContainer 
  maxWidth="xl"
  padding={{ xs: 4, sm: 6, md: 8 }}
>
  <MainContent />
</ResponsiveContainer>
```

## Responsive Hooks

### useResponsive

Hook for detecting screen size and breakpoints.

**Features:**
- Current breakpoint detection
- Window size tracking
- Device type detection (mobile, tablet, desktop)
- Breakpoint utilities

**Usage:**
```tsx
import { useResponsive } from '../hooks/useResponsive';

function MyComponent() {
  const { 
    isMobile, 
    isTablet, 
    isDesktop, 
    currentBreakpoint,
    windowSize 
  } = useResponsive();

  return (
    <div>
      {isMobile ? <MobileLayout /> : <DesktopLayout />}
      <p>Current breakpoint: {currentBreakpoint}</p>
      <p>Window size: {windowSize.width}x{windowSize.height}</p>
    </div>
  );
}
```

### useMobileInteractions

Hook for handling mobile-specific interactions like touch events.

**Features:**
- Touch event handling
- Touch device detection
- Mobile-optimized interactions
- Touch feedback effects

**Usage:**
```tsx
import { useMobileInteractions } from '../hooks/useResponsive';

function TouchButton({ onTap, children }) {
  const { getTouchProps, isTouch } = useMobileInteractions();

  return (
    <button 
      {...getTouchProps(onTap)}
      className={isTouch ? 'touch-optimized' : ''}
    >
      {children}
    </button>
  );
}
```

## Breakpoint System

### Default Breakpoints
```typescript
const breakpoints = {
  xs: 0,      // Mobile portrait
  sm: 640,    // Mobile landscape
  md: 768,    // Tablet portrait
  lg: 1024,   // Tablet landscape / Small desktop
  xl: 1280,   // Desktop
  '2xl': 1536 // Large desktop
};
```

### Responsive Patterns

#### Mobile-First Design
```tsx
// Start with mobile layout, enhance for larger screens
<ResponsiveGrid columns={{ xs: 1, md: 2, xl: 3 }}>
  {items.map(item => <Item key={item.id} {...item} />)}
</ResponsiveGrid>
```

#### Conditional Rendering
```tsx
function AdaptiveComponent() {
  const { isMobile } = useResponsive();
  
  return (
    <>
      {isMobile ? (
        <MobileSpecificComponent />
      ) : (
        <DesktopSpecificComponent />
      )}
    </>
  );
}
```

#### Responsive Props
```tsx
// Different spacing for different screen sizes
<ResponsiveStack 
  direction={{ xs: 'column', lg: 'row' }}
  spacing={{ xs: 2, md: 4, lg: 6 }}
  align={{ xs: 'stretch', lg: 'center' }}
>
  <Content />
</ResponsiveStack>
```

## Mobile Optimization

### Touch Targets
- Minimum 44px touch targets for accessibility
- Adequate spacing between interactive elements
- Touch feedback for better user experience

### Performance
- Lazy loading for mobile devices
- Optimized images and assets
- Reduced animations on mobile

### Navigation Patterns
- **Mobile**: Hamburger menu + bottom tabs
- **Tablet**: Collapsible sidebar or tab bar
- **Desktop**: Horizontal navigation or sidebar

### Form Optimization
- Larger input fields on mobile
- Appropriate input types for mobile keyboards
- Prevent zoom on input focus (iOS)

## CSS Architecture

### Mobile Styles
```css
/* Base mobile styles */
.component {
  padding: 1rem;
  font-size: 1rem;
}

/* Tablet and up */
@media (min-width: 768px) {
  .component {
    padding: 2rem;
    font-size: 1.125rem;
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .component {
    padding: 3rem;
    font-size: 1.25rem;
  }
}
```

### Touch-Friendly Styles
```css
/* Touch targets */
.touch-target {
  min-height: 44px;
  min-width: 44px;
  padding: 0.75rem;
}

/* Touch feedback */
.touch-button:active {
  transform: scale(0.98);
  background-color: rgba(0, 0, 0, 0.1);
}

/* Prevent text selection on touch */
.no-select {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
```

## Testing

### Responsive Testing
```bash
# Run responsive component tests
npm test -- --testPathPattern=responsive

# Test specific breakpoints
npm test -- --testNamePattern="mobile|tablet|desktop"
```

### Manual Testing Checklist
- [ ] Test on actual mobile devices
- [ ] Verify touch interactions work properly
- [ ] Check navigation patterns on different screen sizes
- [ ] Ensure content is readable at all breakpoints
- [ ] Test orientation changes (portrait/landscape)
- [ ] Verify performance on slower mobile devices

### Testing Tools
- **Chrome DevTools**: Device simulation and responsive testing
- **BrowserStack**: Real device testing
- **Lighthouse**: Mobile performance auditing
- **React Testing Library**: Component behavior testing

## Performance Considerations

### Mobile Performance
- Minimize bundle size for mobile
- Use lazy loading for non-critical components
- Optimize images with responsive sizing
- Reduce animation complexity on mobile

### Memory Management
- Clean up event listeners on unmount
- Debounce resize events
- Use efficient re-rendering strategies

### Network Optimization
- Progressive loading of content
- Offline support where appropriate
- Efficient data fetching strategies

## Best Practices

### Design Principles
1. **Mobile-First**: Design for mobile, enhance for desktop
2. **Progressive Enhancement**: Core functionality works everywhere
3. **Touch-Friendly**: Adequate touch targets and spacing
4. **Performance**: Optimize for slower mobile devices
5. **Accessibility**: Maintain accessibility across all devices

### Development Guidelines
1. **Test Early**: Test on real devices throughout development
2. **Use Breakpoints**: Leverage the breakpoint system consistently
3. **Optimize Assets**: Use appropriate image sizes and formats
4. **Monitor Performance**: Regular performance auditing
5. **User Testing**: Test with real users on their devices

### Common Patterns
```tsx
// Responsive component pattern
function ResponsiveComponent() {
  const { isMobile, currentBreakpoint } = useResponsive();
  
  const columns = useMemo(() => {
    switch (currentBreakpoint) {
      case 'xs': return 1;
      case 'sm': return 2;
      case 'md': return 3;
      default: return 4;
    }
  }, [currentBreakpoint]);
  
  return (
    <ResponsiveGrid columns={{ [currentBreakpoint]: columns }}>
      {items.map(item => <Item key={item.id} {...item} />)}
    </ResponsiveGrid>
  );
}

// Conditional mobile features
function ConditionalFeature() {
  const { isMobile } = useResponsive();
  
  return (
    <div>
      <CoreFeature />
      {!isMobile && <DesktopOnlyFeature />}
      {isMobile && <MobileSpecificFeature />}
    </div>
  );
}
```

## Browser Support

### Modern Browsers
- Chrome 90+ (mobile and desktop)
- Firefox 88+ (mobile and desktop)
- Safari 14+ (mobile and desktop)
- Edge 90+

### Mobile Browsers
- Chrome Mobile 90+
- Safari Mobile 14+
- Samsung Internet 14+
- Firefox Mobile 88+

## Resources

- [Responsive Web Design Basics](https://web.dev/responsive-web-design-basics/)
- [Mobile Web Best Practices](https://developers.google.com/web/fundamentals/design-and-ux/principles)
- [Touch and Pointer Events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events)
- [CSS Grid Layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout)
- [Flexbox Guide](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)