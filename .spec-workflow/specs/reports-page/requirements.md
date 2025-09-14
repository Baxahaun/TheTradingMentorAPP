# Requirements Document

## Introduction

This document outlines the requirements for the "Trading Performance Reports" page. This feature will provide users with a comprehensive and visually intuitive dashboard to analyze their trading performance based on a variety of metrics. The goal is to empower traders to identify strengths, weaknesses, and patterns in their trading, leading to more informed decisions and improved profitability.

## Alignment with Product Vision

This feature directly supports the product vision outlined in `product.md` by addressing two core pillars:
- **Performance Reporting**: It delivers "in-depth session analysis, professional visualizations, and exportable insights."
- **Advanced Analytics**: It provides the foundation for displaying asset correlation, performance distribution analysis, and other advanced metrics.

## Requirements

### Requirement 1: Modular Report Architecture

**User Story:** As a developer, I want a modular, widget-based architecture for the reports page, so that I can easily add, remove, and maintain individual report components in the future.

#### Acceptance Criteria

1. WHEN a new report is needed THEN a developer SHALL only need to create a new component and add it to a central configuration file.
2. IF the report configuration is updated THEN the reports page SHALL dynamically render the new set of reports without changes to the main page component.
3. WHEN the application loads THEN the reports page SHALL use a generic widget component to render each report defined in the configuration.

### Requirement 2: Performance by Strategy Report

**User Story:** As a trader, I want to see my performance broken down by strategy, so that I can understand which strategies are most and least profitable.

#### Acceptance Criteria

1. WHEN viewing the reports page THEN the system SHALL display a "Performance by Strategy" widget.
2. IF there are trades with strategies THEN the widget SHALL display a bar chart showing the total P&L for each strategy.
3. WHEN viewing the widget THEN the system SHALL also display a summary table with columns for Strategy, Win %, Average R-Multiple, and Number of Trades.

### Requirement 3: Performance by Time Report

**User Story:** As a trader, I want to analyze my performance based on the time of day, so that I can identify my most and least successful trading periods.

#### Acceptance Criteria

1. WHEN viewing the reports page THEN the system SHALL display a "Performance by Time" widget.
2. IF there are trades with session data THEN the widget SHALL display a bar chart showing the total P&L for each trading session (Asian, London, NY).
3. WHEN interacting with the widget THEN a user SHALL be able to toggle the view to see performance by hour of the day.

### Requirement 4: Volume and Sizing Analysis Report

**User Story:** As a trader, I want to understand my position sizing habits, so that I can ensure I am managing my risk consistently.

#### Acceptance Criteria

1. WHEN viewing the reports page THEN the system SHALL display a "Volume & Sizing" widget.
2. IF there are trades with lot size data THEN the widget SHALL display key statistics as stat cards, including Average Lot Size, Max Lot Size, and Total Volume Traded.
3. WHEN viewing the widget THEN the system SHALL display a histogram showing the distribution of different lot sizes used across all trades.

### Requirement 5: Global Date Range Filter

**User Story:** As a trader, I want to filter all reports by a specific date range, so that I can analyze my performance over different time periods (e.g., last week, last month, YTD).

#### Acceptance Criteria

1. WHEN viewing the reports page THEN the system SHALL display a global date range filter at the top of the page.
2. IF a user selects a new date range THEN all report widgets on the page SHALL update to reflect only the trade data within that range.
3. WHEN the page loads THEN the filter SHALL default to a predefined range (e.g., "Last 30 Days").

### Requirement 6: Empty State Display

**User Story:** As a new user with no trades, I want to see a helpful message on the reports page, so that I understand why no data is visible and what I need to do to see my reports.

#### Acceptance Criteria

1. IF a user has zero trades logged THEN the reports page SHALL display a clear "Empty State" message.
2. WHEN the empty state is displayed THEN the message SHALL guide the user to log their first trade to unlock the analytics.
3. IF a user logs their first trade THEN the empty state SHALL be replaced by the report widgets.

## Non-Functional Requirements

### Code Architecture and Modularity
- **Single Responsibility Principle**: Each file (e.g., `ReportsPage.tsx`, `reportUtils.ts`, `StrategyPerformance.tsx`) will have a single, well-defined purpose.
- **Modular Design**: Each report will be an independent, reusable component. The core logic will be separated into utility functions.
- **Dependency Management**: The main page will depend on a configuration file, not on the individual report components, minimizing coupling.
- **Clear Interfaces**: Props for each component will be clearly defined in TypeScript.

### Performance
- Report calculations should be memoized to prevent unnecessary re-renders when the underlying trade data has not changed.
- The page should load quickly, even with a large number of trades. Data processing for reports should be efficient.

### Security
- All data is stored locally in the browser, so there are no immediate server-side security concerns for this feature.

### Reliability
- The reports page should handle cases where trade data is incomplete or malformed without crashing.
- Calculations in `reportUtils.ts` must be accurate and thoroughly tested.

### Usability
- The reports should be visually clean, easy to understand at a glance, and use clear labels and titles.
- The page must be responsive and usable on both desktop and mobile devices.