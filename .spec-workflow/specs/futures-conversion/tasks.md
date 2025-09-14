# Tasks Document

- [x] 1. Create terminology configuration system
  - File: src/lib/terminologyConfig.ts
  - Create centralized configuration for all terminology mappings
  - Define TypeScript interfaces for terminology types
  - Purpose: Centralized management of forex to futures terminology conversion
  - _Leverage: src/lib/constants.ts_
  - _Requirements: 1.1, 1.2_
  - _Prompt: Role: TypeScript Developer specializing in configuration management | Task: Create comprehensive terminology configuration system following requirements 1.1 and 1.2, establishing centralized mapping from forex terms (pip, lot, currency pair) to futures terms (point, contract, futures instrument) | Restrictions: Do not hardcode terminology in components, maintain type safety, ensure easy maintenance and updates | Success: All terminology mappings are centralized and type-safe, configuration is easily maintainable, interfaces are well-defined for all terminology types_

- [x] 2. Update Trade interface with futures extensions
  - File: src/types/trade.ts
  - Add optional futures-specific fields to existing Trade interface
  - Maintain backward compatibility with existing trade data
  - Purpose: Extend trade data model for futures trading while preserving existing functionality
  - _Leverage: existing Trade interface in src/types/trade.ts_
  - _Requirements: 2.1, 2.2_
  - _Prompt: Role: TypeScript Developer specializing in data modeling and backward compatibility | Task: Extend existing Trade interface with optional futures-specific fields (contractSize, tickValue, tickSize, marginRequirement, exchange) following requirements 2.1 and 2.2, ensuring full backward compatibility | Restrictions: Do not modify existing required fields, make futures fields optional, maintain existing data structure integrity | Success: Trade interface supports both forex and futures data, existing code continues to work, new futures fields are properly typed and optional_

- [x] 3. Create futures contract specifications database
  - File: src/lib/futuresContracts.ts
  - Define contract specifications for major futures instruments
  - Create lookup functions for contract data
  - Purpose: Provide contract specifications for futures trading calculations
  - _Leverage: src/lib/constants.ts_
  - _Requirements: 4.1, 4.2_
  - _Prompt: Role: Data Engineer specializing in financial instrument databases | Task: Create comprehensive futures contract specifications database following requirements 4.1 and 4.2, including major exchanges (CME, ICE, NYMEX) with contract size, tick value, margin requirements | Restrictions: Must include accurate contract specifications, provide efficient lookup functions, maintain data consistency | Success: Contract database is comprehensive and accurate, lookup functions are fast and reliable, covers major futures instruments_

- [x] 4. Update AddTrade form with futures terminology
  - File: src/components/AddTrade.tsx
  - Replace hardcoded forex terminology with configurable futures terms
  - Update form labels and validation messages
  - Purpose: Convert trade entry form to use futures terminology
  - _Leverage: src/lib/terminologyConfig.ts, existing form components_
  - _Requirements: 4.1, 4.2_
  - _Prompt: Role: Frontend Developer specializing in form components and user experience | Task: Update AddTrade form to use futures terminology following requirements 4.1 and 4.2, replacing "pip" with "point", "lot size" with "contract size", using terminology configuration | Restrictions: Do not change form layout or functionality, maintain existing validation logic, preserve user experience | Success: Form displays futures terminology correctly, validation messages use new terms, form functionality remains identical_

- [x] 5. Update trade display components with futures terminology
  - File: src/pages/JournalPage.tsx
  - Replace hardcoded forex terminology in trade displays
  - Update trade detail views with futures terms
  - Purpose: Convert trade display to use futures terminology
  - _Leverage: src/lib/terminologyConfig.ts, existing display components_
  - _Requirements: 4.1, 4.2_
  - _Prompt: Role: Frontend Developer specializing in data display and user interface | Task: Update trade display components to use futures terminology following requirements 4.1 and 4.2, replacing "currency pair" with "futures instrument", "pips" with "points" in all trade views | Restrictions: Do not change display layout or functionality, maintain existing data structure, preserve visual design | Success: All trade displays show futures terminology, data is correctly formatted, visual design remains unchanged_

- [x] 6. Update analytics components with futures terminology
  - File: src/components/TradingPerformanceWidget.tsx
  - Replace forex terminology in analytics displays
  - Update chart labels and tooltips
  - Purpose: Convert analytics to use futures terminology
  - _Leverage: src/lib/terminologyConfig.ts, existing analytics components_
  - _Requirements: 5.1, 5.2_
  - _Prompt: Role: Frontend Developer specializing in data visualization and analytics | Task: Update analytics components to use futures terminology following requirements 5.1 and 5.2, replacing "currency pair" with "futures instrument" in metrics, updating chart labels and tooltips | Restrictions: Do not change chart functionality or calculations, maintain existing visual design, preserve data accuracy | Success: Analytics displays futures terminology correctly, charts are properly labeled, calculations remain accurate_

- [x] 7. Update performance calculation services
  - File: src/services/TradingPerformanceService.ts
  - Update calculation methods for futures-specific math
  - Add point-based P&L calculations
  - Purpose: Adapt performance calculations for futures markets
  - _Leverage: existing calculation patterns in src/services/TradingPerformanceService.ts_
  - _Requirements: 3.1, 3.2_
  - _Prompt: Role: Backend Developer specializing in financial calculations and performance metrics | Task: Update performance calculation services for futures markets following requirements 3.1 and 3.2, adding point-based P&L calculations, contract value calculations, margin calculations | Restrictions: Do not break existing calculation logic, maintain calculation accuracy, preserve performance | Success: Calculations work correctly for futures data, point-based P&L is accurate, contract value calculations are correct_

- [x] 8. Update form validation with futures terminology
  - File: src/components/AddTrade.tsx
  - Update validation messages to use futures terms
  - Update error messages and help text
  - Purpose: Ensure all validation uses futures terminology
  - _Leverage: src/lib/terminologyConfig.ts, existing validation logic_
  - _Requirements: 4.1, 4.2_
  - _Prompt: Role: Frontend Developer specializing in form validation and user experience | Task: Update form validation messages to use futures terminology following requirements 4.1 and 4.2, replacing validation text with futures terms, updating error messages and help text | Restrictions: Do not change validation logic, maintain existing error handling, preserve user experience | Success: All validation messages use futures terminology, error messages are clear and helpful, validation logic works correctly_

- [x] 9. Update chart components with futures terminology
  - File: src/components/trading-performance/PerformanceChartPanel.tsx
  - Update chart axis labels and tooltips
  - Replace forex terminology in chart displays
  - Purpose: Convert charts to use futures terminology
  - _Leverage: src/lib/terminologyConfig.ts, existing chart components_
  - _Requirements: 5.1, 5.2_
  - _Prompt: Role: Frontend Developer specializing in data visualization and chart components | Task: Update chart components to use futures terminology following requirements 5.1 and 5.2, updating axis labels, tooltips, and chart titles with futures terms | Restrictions: Do not change chart functionality or data processing, maintain existing visual design, preserve chart performance | Success: Charts display futures terminology correctly, tooltips are helpful and accurate, visual design remains unchanged_

- [x] 10. Update report components with futures terminology
  - File: src/components/reports/ReportWidget.tsx
  - Replace forex terminology in report displays
  - Update report labels and descriptions
  - Purpose: Convert reports to use futures terminology
  - _Leverage: src/lib/terminologyConfig.ts, existing report components_
  - _Requirements: 5.1, 5.2_
  - _Prompt: Role: Frontend Developer specializing in report generation and data presentation | Task: Update report components to use futures terminology following requirements 5.1 and 5.2, replacing report labels and descriptions with futures terms | Restrictions: Do not change report functionality or data processing, maintain existing report layout, preserve data accuracy | Success: Reports display futures terminology correctly, labels are clear and accurate, report functionality remains unchanged_

- [x] 11. Create data migration utility for existing trades
  - File: src/lib/dataMigration.ts
  - Create utility to migrate existing trade data
  - Add terminology conversion for historical data
  - Purpose: Convert existing trade data to use futures terminology
  - _Leverage: existing data migration patterns in src/lib/dataMigrationService.ts_
  - _Requirements: 6.1, 6.2_
  - _Prompt: Role: Backend Developer specializing in data migration and data transformation | Task: Create data migration utility following requirements 6.1 and 6.2, converting existing trade data to use futures terminology, ensuring no data loss | Restrictions: Do not modify original data structure, create backup before migration, maintain data integrity | Success: Migration utility converts data correctly, no data loss occurs, existing trades display with new terminology_

- [x] 12. Update help text and documentation
  - File: src/components/AddTrade.tsx
  - Update help text and tooltips with futures terminology
  - Update form descriptions and hints
  - Purpose: Ensure all help text uses futures terminology
  - _Leverage: src/lib/terminologyConfig.ts, existing help text patterns_
  - _Requirements: 4.1, 4.2_
  - _Prompt: Role: Technical Writer specializing in user documentation and help text | Task: Update help text and documentation following requirements 4.1 and 4.2, replacing forex terminology with futures terms in tooltips, descriptions, and hints | Restrictions: Do not change help text functionality, maintain clarity and usefulness, preserve existing help patterns | Success: All help text uses futures terminology, descriptions are clear and helpful, user experience is improved_

- [x] 13. Update error messages and notifications
  - File: src/components/AddTrade.tsx
  - Update error messages to use futures terminology
  - Update notification text and alerts
  - Purpose: Ensure all error messages use futures terminology
  - _Leverage: src/lib/terminologyConfig.ts, existing error handling patterns_
  - _Requirements: 4.1, 4.2_
  - _Prompt: Role: Frontend Developer specializing in error handling and user experience | Task: Update error messages and notifications following requirements 4.1 and 4.2, replacing forex terminology with futures terms in error messages and alerts | Restrictions: Do not change error handling logic, maintain error message clarity, preserve existing error patterns | Success: All error messages use futures terminology, notifications are clear and helpful, error handling works correctly_

- [x] 14. Update export functionality with futures terminology
  - File: src/services/JournalExportService.ts
  - Update export labels and headers with futures terms
  - Update CSV/PDF export formatting
  - Purpose: Ensure exported data uses futures terminology
  - _Leverage: src/lib/terminologyConfig.ts, existing export patterns_
  - _Requirements: 6.1, 6.2_
  - _Prompt: Role: Backend Developer specializing in data export and file generation | Task: Update export functionality following requirements 6.1 and 6.2, replacing export labels and headers with futures terminology, updating CSV/PDF formatting | Restrictions: Do not change export functionality or data structure, maintain export performance, preserve data accuracy | Success: Exported data uses futures terminology, export formatting is correct, data accuracy is maintained_

- [x] 15. Create comprehensive testing for terminology changes
  - File: tests/terminology.test.ts
  - Write tests for all terminology conversions
  - Test data migration and display updates
  - Purpose: Ensure terminology changes work correctly across the application
  - _Leverage: existing test patterns in tests/ directory_
  - _Requirements: All_
  - _Prompt: Role: QA Engineer specializing in comprehensive testing and regression testing | Task: Create comprehensive test suite following all requirements, testing terminology conversions, data migration, and display updates across the entire application | Restrictions: Must test all components and services, ensure no regressions, maintain test coverage | Success: All terminology changes are thoroughly tested, no regressions found, test coverage is comprehensive and reliable_

- [x] 16. Update constants and configuration files
  - File: src/lib/constants.ts
  - Update application constants with futures terminology
  - Update configuration values and defaults
  - Purpose: Ensure all constants use futures terminology
  - _Leverage: existing constants in src/lib/constants.ts_
  - _Requirements: 1.1, 1.2_
  - _Prompt: Role: Configuration Developer specializing in application constants and configuration management | Task: Update constants and configuration files following requirements 1.1 and 1.2, replacing forex terminology with futures terms in all constants and configuration values | Restrictions: Do not change constant functionality, maintain configuration structure, preserve existing behavior | Success: All constants use futures terminology, configuration is consistent, application behavior is preserved_

- [x] 17. Update type definitions and interfaces
  - File: src/types/tradingPerformance.ts
  - Update type definitions with futures terminology
  - Update interface documentation and comments
  - Purpose: Ensure all type definitions use futures terminology
  - _Leverage: existing type definitions in src/types/_
  - _Requirements: 2.1, 2.2_
  - _Prompt: Role: TypeScript Developer specializing in type definitions and interface design | Task: Update type definitions and interfaces following requirements 2.1 and 2.2, replacing forex terminology with futures terms in all type definitions and interface documentation | Restrictions: Do not change type functionality, maintain type safety, preserve existing interfaces | Success: All type definitions use futures terminology, type safety is maintained, interfaces are properly documented_

- [x] 18. Final integration testing and validation
  - File: tests/integration/terminology.test.ts
  - Test complete application with futures terminology
  - Validate all components work together correctly
  - Purpose: Ensure complete application works with futures terminology
  - _Leverage: existing integration test patterns_
  - _Requirements: All_
  - _Prompt: Role: Integration Engineer specializing in end-to-end testing and system validation | Task: Perform comprehensive integration testing following all requirements, validating complete application functionality with futures terminology, ensuring all components work together correctly | Restrictions: Must test complete user workflows, ensure no functionality is broken, validate data integrity | Success: Complete application works correctly with futures terminology, all user workflows function properly, no regressions found, system is ready for production_