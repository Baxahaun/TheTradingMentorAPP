import { lazy } from 'react';
import { LazyExoticComponent } from 'react';

// Define the structure for a report configuration
export interface ReportConfig {
  id: string;
  title: string;
  description: string;
  component: LazyExoticComponent<React.ComponentType<any>>;
}

// Lazy load report components to avoid circular dependencies
const StrategyPerformance = lazy(() =>
  import('@/components/reports/StrategyPerformance').then(module => ({
    default: module.StrategyPerformance
  }))
);

const TimeAnalysis = lazy(() =>
  import('@/components/reports/TimeAnalysis').then(module => ({
    default: module.TimeAnalysis
  }))
);

const VolumeAnalysis = lazy(() =>
  import('@/components/reports/VolumeAnalysis').then(module => ({
    default: module.VolumeAnalysis
  }))
);

// Configuration for all available reports
export const reports: ReportConfig[] = [
  {
    id: 'strategy-performance',
    title: 'Performance by Strategy',
    description: 'Analyze your trading performance grouped by different strategies',
    component: StrategyPerformance
  },
  {
    id: 'time-analysis',
    title: 'Performance by Time',
    description: 'Explore how your trading performance varies across different times and sessions',
    component: TimeAnalysis
  },
  {
    id: 'volume-analysis',
    title: 'Volume & Sizing',
    description: 'Understand your position sizing habits and trade volume patterns',
    component: VolumeAnalysis
  }
];

// Helper function to get a report configuration by ID
export const getReportConfig = (reportId: string): ReportConfig | undefined => {
  return reports.find(report => report.id === reportId);
};

// Helper function to get all report IDs
export const getAllReportIds = (): string[] => {
  return reports.map(report => report.id);
};