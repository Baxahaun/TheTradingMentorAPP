# Tasks Document

<!-- AI Instructions: For each task, generate a _Prompt field with structured AI guidance following this format:
_Prompt: Role: [specialized developer role] | Task: [clear task description with context references] | Restrictions: [what not to do, constraints] | Success: [specific completion criteria]_
This helps provide better AI agent guidance beyond simple "work on this task" prompts. -->

- [x] 1. Create Trading Performance Widget Types
  - File: src/types/tradingPerformance.ts
  - Define TypeScript interfaces for PerformanceMetrics, ChartDataPoint, CurrencyPairMetrics, and RiskMetrics
  - Extend existing Trade interface from src/types/trade.ts
  - Purpose: Establish type safety for performance calculations and widget props
  - _Leverage: src/types/trade.ts, src/types/widget.ts_
  - _Requirements: Requirement 1 (Performance Metrics Overview), Requirement 4 (Risk Metrics Display)_
  - _Prompt: Role: TypeScript Developer specializing in trading systems and type safety | Task: Create comprehensive TypeScript interfaces for trading performance data structures following Requirements 1 and 4, extending existing Trade interface from src/types/trade.ts | Restrictions: Must maintain compatibility with existing Trade interface, follow project naming conventions, do not modify base types | Success: All interfaces compile without errors, proper inheritance from base types, comprehensive coverage of performance metrics, risk metrics, and chart data structures_

- [x] 2. Create Trading Performance Service
  - File: src/services/TradingPerformanceService.ts
  - Implement service class for performance calculations, currency pair analysis, and risk metrics
  - Add methods for data transformation and time range filtering
  - Purpose: Separate business logic from presentation layer
  - _Leverage: src/services/PerformanceMonitoringService.ts, src/types/trade.ts_
  - _Requirements: Requirement 1, 2, 3, 4_
  - _Prompt: Role: Backend Developer with expertise in financial calculations and data analysis | Task: Create comprehensive trading performance service implementing all calculation methods for Requirements 1-4, leveraging existing performance monitoring patterns from src/services/PerformanceMonitoringService.ts | Restrictions: Must handle edge cases like zero trades, maintain calculation accuracy, do not bypass existing validation patterns | Success: Service correctly calculates P&L, win rates, currency pair performance, risk metrics with proper error handling and data validation_

- [x] 3. Create Performance Chart Utilities
  - File: src/utils/performanceChartUtils.ts
  - Implement chart data transformation functions, color schemes, and formatters
  - Add responsive chart configuration helpers
  - Purpose: Provide reusable chart utilities for consistent visualization
  - _Leverage: src/components/PerformanceChartWidget.tsx patterns_
  - _Requirements: Requirement 2 (Visual Performance Chart), Requirement 5 (Responsive Design)_
  - _Prompt: Role: Frontend Developer specializing in data visualization and Recharts | Task: Create comprehensive chart utilities for performance visualization following Requirements 2 and 5, reusing successful patterns from existing PerformanceChartWidget.tsx | Restrictions: Must maintain chart performance with large datasets, follow existing color scheme patterns, ensure accessibility | Success: Chart utilities support all required visualizations, responsive behavior works correctly, color schemes are accessible and consistent_

- [x] 4. Create Performance Metrics Panel Component
  - File: src/components/trading-performance/PerformanceMetricsPanel.tsx
  - Implement metric display cards for P&L, win rate, pip analysis, and R:R ratio
  - Add color-coded indicators and trend arrows
  - Purpose: Display key performance indicators in compact, readable format
  - _Leverage: src/lib/widgetRegistry.tsx metric widget patterns_
  - _Requirements: Requirement 1 (Performance Metrics Overview)_
  - _Prompt: Role: React Developer with expertise in dashboard components and metric visualization | Task: Create performance metrics panel component following Requirement 1, reusing successful metric display patterns from src/lib/widgetRegistry.tsx | Restrictions: Must follow existing metric widget patterns, maintain responsive design, use established color coding | Success: Component displays all required metrics clearly, responsive across widget sizes, proper color coding for positive/negative values_

- [x] 5. Create Performance Chart Panel Component
  - File: src/components/trading-performance/PerformanceChartPanel.tsx
  - Implement interactive area chart with cumulative P&L visualization
  - Add hover tooltips with detailed trade information
  - Purpose: Provide visual trend analysis of performance over time
  - _Leverage: src/components/PerformanceChartWidget.tsx chart patterns, src/utils/performanceChartUtils.ts_
  - _Requirements: Requirement 2 (Visual Performance Chart)_
  - _Prompt: Role: React Developer specializing in interactive charts and Recharts library | Task: Create performance chart panel with interactive features following Requirement 2, leveraging existing chart patterns from PerformanceChartWidget.tsx and utilities | Restrictions: Must maintain 60fps performance, handle responsive resizing, follow existing tooltip patterns | Success: Chart renders smoothly with large datasets, interactive features work correctly, responsive design adapts to container size_

- [x] 6. Create Currency Pair Breakdown Component
  - File: src/components/trading-performance/CurrencyPairBreakdown.tsx
  - Implement top/worst performing currency pairs display
  - Add click handlers for pair filtering functionality
  - Purpose: Show pair-specific performance insights
  - _Leverage: src/lib/widgetRegistry.tsx RecentTradesWidget patterns_
  - _Requirements: Requirement 3 (Currency Pair Performance Breakdown)_
  - _Prompt: Role: React Developer with expertise in list components and forex trading interfaces | Task: Create currency pair breakdown component following Requirement 3, reusing list display patterns from RecentTradesWidget in widgetRegistry.tsx | Restrictions: Must handle empty states gracefully, maintain consistent styling with existing components, ensure click interactions work properly | Success: Component displays top/worst performing pairs correctly, click handlers enable filtering, empty states are handled gracefully_

- [x] 7. Create Risk Metrics Display Component
  - File: src/components/trading-performance/RiskMetricsDisplay.tsx
  - Implement drawdown indicators, risk warnings, and threshold visualizations
  - Add color-coded risk level indicators
  - Purpose: Provide clear risk assessment and warnings
  - _Leverage: Badge and indicator patterns from existing widgets_
  - _Requirements: Requirement 4 (Risk Metrics Display)_
  - _Prompt: Role: React Developer with expertise in financial risk visualization and warning systems | Task: Create risk metrics display component following Requirement 4, using existing Badge and indicator patterns for warning states | Restrictions: Must use appropriate warning colors, handle threshold configurations, ensure warnings are clearly visible | Success: Risk metrics are clearly displayed, warning states trigger appropriately, visual indicators match established design patterns_

- [x] 8. Create Interactive Controls Component
  - File: src/components/trading-performance/InteractiveControls.tsx
  - Implement time period selectors and metric toggle controls
  - Add control state management and event handlers
  - Purpose: Enable user customization of widget display
  - _Leverage: src/components/SetupAnalyticsWidget.tsx control patterns_
  - _Requirements: Requirement 6 (Interactive Controls)_
  - _Prompt: Role: React Developer specializing in form controls and user interaction patterns | Task: Create interactive controls component following Requirement 6, leveraging successful control patterns from SetupAnalyticsWidget.tsx | Restrictions: Must maintain control state properly, follow existing UI component patterns, ensure accessibility | Success: All controls function correctly, state management works reliably, user preferences persist during session_

- [x] 9. Create Main Trading Performance Widget Component
  - File: src/components/TradingPerformanceWidget.tsx
  - Assemble all sub-components into cohesive widget layout
  - Implement responsive design and size adaptation logic
  - Purpose: Main widget component orchestrating all performance displays
  - _Leverage: src/components/SetupAnalyticsWidget.tsx layout patterns, src/services/TradingPerformanceService.ts_
  - _Requirements: All requirements (1-6)_
  - _Prompt: Role: Senior React Developer with expertise in complex widget architecture and responsive design | Task: Create main trading performance widget component integrating all sub-components and following all Requirements 1-6, using layout patterns from SetupAnalyticsWidget.tsx | Restrictions: Must maintain performance with large datasets, handle all responsive breakpoints, ensure proper error boundaries | Success: Widget integrates all components seamlessly, responsive design works across all sizes, error handling prevents crashes_

- [x] 10. Register Widget in Widget Registry
  - File: src/lib/widgetRegistry.tsx (modify existing)
  - Add TradingPerformanceWidget to WIDGET_REGISTRY array
  - Configure widget metadata including category, sizes, and description
  - Purpose: Enable widget integration with dashboard system
  - _Leverage: existing widget registry patterns_
  - _Requirements: Integration requirement_
  - _Prompt: Role: Frontend Systems Developer with expertise in widget architecture and registry patterns | Task: Register TradingPerformanceWidget in existing widget registry following established patterns from src/lib/widgetRegistry.tsx | Restrictions: Must follow existing registration patterns exactly, ensure proper category assignment, maintain registry type safety | Success: Widget is properly registered and appears in dashboard widget selection, metadata is accurate and complete_

- [x] 11. Create Widget Unit Tests
  - File: src/components/__tests__/TradingPerformanceWidget.test.tsx
  - Write comprehensive tests for widget rendering, interactions, and edge cases
  - Test responsive behavior and data transformation
  - Purpose: Ensure widget reliability and prevent regressions
  - _Leverage: existing test patterns from src/components/__tests__/_
  - _Requirements: All requirements for testing coverage_
  - _Prompt: Role: QA Engineer with expertise in React Testing Library and Jest frameworks | Task: Create comprehensive unit tests for TradingPerformanceWidget covering all functionality and edge cases, following existing test patterns from component test directory | Restrictions: Must test behavior not implementation, ensure test isolation, cover all user interactions | Success: All widget functionality is tested with good coverage, edge cases are handled, tests run reliably and independently_

- [x] 12. Create Service Unit Tests
  - File: src/services/__tests__/TradingPerformanceService.test.ts
  - Write tests for performance calculations, data transformations, and error handling
  - Test edge cases like empty data, extreme values, and invalid inputs
  - Purpose: Ensure calculation accuracy and service reliability
  - _Leverage: existing service test patterns from src/services/__tests__/_
  - _Requirements: Service layer testing for all calculations_
  - _Prompt: Role: QA Engineer with expertise in financial calculation testing and service layer validation | Task: Create comprehensive unit tests for TradingPerformanceService covering all calculations and edge cases, following existing service test patterns | Restrictions: Must test calculation accuracy, handle floating point precision, ensure proper error handling | Success: All service methods are tested with mathematical accuracy, edge cases are covered, error scenarios are properly handled_

- [x] 13. Create Integration Tests
  - File: src/__tests__/integration/TradingPerformanceWidget.integration.test.tsx
  - Write tests for widget integration with trade data and dashboard system
  - Test widget behavior with real trade datasets
  - Purpose: Validate end-to-end widget functionality in realistic scenarios
  - _Leverage: existing integration test patterns and mock trade data_
  - _Requirements: Integration testing for all widget functionality_
  - _Prompt: Role: Integration Test Engineer with expertise in React component integration and data flow testing | Task: Create comprehensive integration tests for TradingPerformanceWidget with real trade data scenarios, following existing integration test patterns | Restrictions: Must use realistic test data, test actual data flow, avoid testing external dependencies | Success: Widget works correctly with realistic trade data, all user workflows are validated, performance is acceptable with large datasets_

- [x] 14. Update Widget Types Definition
  - File: src/types/widget.ts (modify existing)
  - Add TradingPerformanceWidget to widget types and extend WidgetProps interface if needed
  - Ensure type compatibility with existing widget system
  - Purpose: Maintain type safety across widget ecosystem
  - _Leverage: existing widget type patterns_
  - _Requirements: Type system integration_
  - _Prompt: Role: TypeScript Developer specializing in type system integration and widget architecture | Task: Update widget type definitions to include TradingPerformanceWidget while maintaining backward compatibility with existing widget system | Restrictions: Must not break existing widget types, maintain type safety, follow established patterns | Success: New widget types integrate seamlessly, no type compilation errors, backward compatibility maintained_

- [x] 15. Performance Optimization and Final Polish
  - Files: All trading performance widget files
  - Optimize rendering performance, implement memoization where needed
  - Add loading states, error boundaries, and accessibility improvements
  - Purpose: Ensure production-ready widget performance and user experience
  - _Leverage: existing performance optimization patterns_
  - _Requirements: Non-functional requirements (Performance, Usability, Reliability)_
  - _Prompt: Role: Senior Frontend Developer with expertise in React performance optimization and accessibility | Task: Optimize trading performance widget for production use including performance, accessibility, and error handling following non-functional requirements | Restrictions: Must not compromise functionality, maintain existing performance standards, ensure accessibility compliance | Success: Widget performs smoothly with large datasets, accessibility guidelines are met, error boundaries prevent crashes, loading states provide good UX_