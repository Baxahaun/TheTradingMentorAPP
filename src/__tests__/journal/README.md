# Daily Trading Journal Testing Suite

This directory contains comprehensive tests for the Daily Trading Journal feature, organized by test type and coverage area.

## Test Structure

### Unit Tests (`unit/`)
- **Components**: Individual component testing with mocked dependencies
- **Services**: Business logic and data service testing
- **Utilities**: Helper functions and validation logic
- **Hooks**: Custom React hooks testing

### Integration Tests (`integration/`)
- **Workflows**: Complete user workflow testing
- **Service Integration**: Cross-service interaction testing
- **Component Integration**: Multi-component interaction testing

### End-to-End Tests (`e2e/`)
- **Critical User Journeys**: Complete application flows
- **Cross-Browser Testing**: Browser compatibility validation
- **Mobile Testing**: Mobile-specific functionality

### Performance Tests (`performance/`)
- **Large Dataset Handling**: Performance with extensive journal data
- **Memory Usage**: Memory leak detection and optimization
- **Load Testing**: Concurrent user simulation

## Test Coverage Requirements

Based on the requirements document, all tests must validate:

1. **Daily Journal Entry Management** (Requirement 1)
2. **Customizable Journal Templates** (Requirement 2)
3. **Trade Integration and Reference System** (Requirement 3)
4. **Screenshot and Image Management** (Requirement 4)
5. **Daily P&L Summary and Performance Tracking** (Requirement 5)
6. **Emotional State Tracking and Reflection** (Requirement 6)
7. **Guided Reflection and Learning Prompts** (Requirement 7)
8. **Seamless Calendar Integration** (Requirement 8)
9. **Quick Entry and Mobile Optimization** (Requirement 9)
10. **Privacy and Data Security** (Requirement 10)

## Running Tests

```bash
# Run all journal tests
npm run test:journal

# Run specific test categories
npm run test:journal:unit
npm run test:journal:integration
npm run test:journal:e2e
npm run test:journal:performance

# Run with coverage
npm run test:journal:coverage

# Run in watch mode
npm run test:journal:watch
```

## Test Data and Mocks

All test data and mock configurations are centralized in the `mocks/` directory to ensure consistency across test suites.