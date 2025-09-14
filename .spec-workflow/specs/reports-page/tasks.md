# Tasks Document

- [x] 1. **Create Core Architecture: `ReportsPage.tsx`**
  - **File**: `src/pages/ReportsPage.tsx`
  - **Purpose**: To create the main container component for the reports dashboard.
  - **_Leverage_**: `src/contexts/TradeContext.tsx`, `shadcn/ui`
  - **_Requirements_**: 1, 5, 6
  - **_Prompt_**: Role: Frontend Developer | Task: Create the `ReportsPage.tsx` component. It should fetch trade data using the `useTradeContext` hook and render a basic layout including a title and a container for the report widgets. Implement the logic to display the 'Empty State' component when no trades are available. | Restrictions: This component should only handle layout and data fetching; do not implement specific report logic here. | Success: The component renders without errors, displays the title, and correctly shows the empty state message when there are no trades.

- [x] 2. **Create Core Architecture: `reports.ts` Configuration**
  - **File**: `src/config/reports.ts`
  - **Purpose**: To establish a centralized, scalable configuration for all report widgets.
  - **_Leverage_**: N/A
  - **_Requirements_**: 1
  - **_Prompt_**: Role: Software Architect | Task: Create the `reports.ts` configuration file. Define a data structure for a report configuration (e.g., id, title, component). Populate it with initial entries for the first three reports (Strategy, Time, Volume). | Restrictions: Do not import the report components directly; use a lazy-loading mechanism if possible to avoid circular dependencies. | Success: The configuration file is created, well-structured, and exports an array of report configurations.

- [x] 3. **Create Core Architecture: `ReportWidget.tsx`**
  - **File**: `src/components/reports/ReportWidget.tsx`
  - **Purpose**: To create a generic wrapper component that renders any specific report based on the configuration.
  - **_Leverage_**: `src/config/reports.ts`, `shadcn/ui/card`
  - **_Requirements_**: 1
  - **_Prompt_**: Role: Frontend Developer | Task: Create the `ReportWidget.tsx` component. It should accept a `reportId` prop, look up the corresponding configuration in `reports.ts`, and render the associated component inside a `Card` element. It should also display the report's title. | Restrictions: This component should be generic and contain no logic specific to any single report. | Success: The component can render any report defined in the config simply by being passed its ID.

- [x] 4. **Create Core Architecture: `reportUtils.ts`**
  - **File**: `src/utils/reportUtils.ts`
  - **Purpose**: To create a dedicated module for all data processing and calculation logic for the reports.
  - **_Leverage_**: `src/types/trade.ts`
  - **_Requirements_**: 2, 3, 4
  - **_Prompt_**: Role: Data Engineer | Task: Create the `reportUtils.ts` file. Add placeholder functions for the initial report calculations: `calculateStrategyPerformance`, `analyzeTradingTimes`, and `calculateVolumeMetrics`. Ensure functions accept a `trades` array and return a structured data object. | Restrictions: This file should contain pure data transformation logic only, with no React hooks or JSX. | Success: The utility file is created with the placeholder functions, all correctly typed.

- [x] 5. **Implement Report: "Performance by Strategy"**
  - **Files**: `src/components/reports/StrategyPerformance.tsx`, `src/utils/reportUtils.ts`
  - **Purpose**: To build the component that visualizes trade performance grouped by strategy.
  - **_Leverage_**: `Recharts`, `shadcn/ui`
  - **_Requirements_**: 2
  - **_Prompt_**: Role: Frontend Developer with Data Visualization skills | Task: Implement the `StrategyPerformance.tsx` component and its corresponding `calculateStrategyPerformance` utility function. The function should group trades by strategy and calculate total P&L, win rate, and other required metrics. The component should render this data as a bar chart and a summary table. | Restrictions: All calculation logic must be in `reportUtils.ts`. | Success: The component correctly displays the performance for each strategy and updates when the date filter changes.

- [x] 6. **Implement Report: "Performance by Time"**
  - **Files**: `src/components/reports/TimeAnalysis.tsx`, `src/utils/reportUtils.ts`
  - **Purpose**: To build the component that visualizes trade performance grouped by time.
  - **_Leverage_**: `Recharts`, `shadcn/ui/tabs`
  - **_Requirements_**: 3
  - **_Prompt_**: Role: Frontend Developer with Data Visualization skills | Task: Implement the `TimeAnalysis.tsx` component and its `analyzeTradingTimes` utility function. The function should group trades by session and hour. The component should render the data as a bar chart and include `Tabs` to switch between the session and hourly views. | Restrictions: All calculation logic must be in `reportUtils.ts`. | Success: The component correctly displays performance by time and the view toggle works as expected.

- [x] 7. **Implement Report: "Volume & Sizing"**
  - **Files**: `src/components/reports/VolumeAnalysis.tsx`, `src/utils/reportUtils.ts`
  - **Purpose**: To build the component that analyzes and displays position sizing habits.
  - **_Leverage_**: `Recharts`, `shadcn/ui`
  - **_Requirements_**: 4
  - **_Prompt_**: Role: Frontend Developer with Data Visualization skills | Task: Implement the `VolumeAnalysis.tsx` component and its `calculateVolumeMetrics` utility function. The function should calculate stats like average and max lot size. The component should render these stats in `Card` elements and display a histogram of lot size distribution. | Restrictions: All calculation logic must be in `reportUtils.ts`. | Success: The component correctly displays all volume and sizing metrics.

- [x] 8. **Final Integration: Date Range Filter**
  - **File**: `src/pages/ReportsPage.tsx`
  - **Purpose**: To add a global date filter that controls the data for all reports.
  - **_Leverage_**: `shadcn/ui/datepicker` (or similar)
  - **_Requirements_**: 5
  - **_Prompt_**: Role: Frontend Developer | Task: Add a date range filter component to the `ReportsPage.tsx`. When the date range is changed, the component should filter the trades from `useTradeContext` and pass the filtered list down to the report widgets. | Restrictions: The filter must apply to all reports on the page simultaneously. | Success: Selecting a date range correctly filters the data and all widgets update accordingly.

- [x] 9. **Final Integration: Navigation**
  - **File**: `src/components/Sidebar.tsx` (or equivalent navigation component)
  - **Purpose**: To make the new reports page accessible to users.
  - **_Leverage_**: `react-router-dom`
  - **_Requirements_**: N/A
  - **_Prompt_**: Role: Frontend Developer | Task: Add a new navigation link to the main application sidebar (or equivalent navigation area) that points to the `/reports` route. | Restrictions: Ensure the new link follows the existing style and structure of the navigation. | Success: The "Reports" link is visible in the navigation and correctly navigates to the `ReportsPage`.