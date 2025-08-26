# Comprehensive Testing Suite for Strategy Management System

This directory contains the comprehensive testing suite for the Professional Strategy Management & Performance Analytics System.

## Test Categories

### 1. Unit Tests
- **Location**: `unit/`
- **Purpose**: Test individual services and components in isolation
- **Coverage**: All new services (StrategyPerformanceService, StrategyAttributionService, etc.)

### 2. Integration Tests
- **Location**: `integration/`
- **Purpose**: Test strategy-trade workflow and component interactions
- **Coverage**: End-to-end workflows between components

### 3. End-to-End Tests
- **Location**: `e2e/`
- **Purpose**: Test complete strategy lifecycle from creation to performance analysis
- **Coverage**: Full user workflows

### 4. Performance Tests
- **Location**: `performance/`
- **Purpose**: Test system performance with large datasets
- **Coverage**: Load testing, memory usage, calculation speed

### 5. Visual Regression Tests
- **Location**: `visual/`
- **Purpose**: Ensure UI consistency across changes
- **Coverage**: Component rendering, responsive layouts

### 6. Accessibility Tests
- **Location**: `accessibility/`
- **Purpose**: Verify WCAG 2.1 AA compliance
- **Coverage**: Screen reader support, keyboard navigation, color contrast

## Running Tests

```bash
# Run all comprehensive tests
npm run test:comprehensive

# Run specific test categories
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:performance
npm run test:visual
npm run test:accessibility

# Run with coverage
npm run test:comprehensive:coverage

# Run in watch mode
npm run test:comprehensive:watch
```

## Test Configuration

- **Framework**: Vitest with React Testing Library
- **Environment**: jsdom for DOM simulation
- **Coverage**: v8 provider with 90%+ thresholds
- **Accessibility**: @testing-library/jest-dom with axe-core
- **Performance**: Custom benchmarking utilities