/**
 * Services Index
 * 
 * Central export point for all service classes and utilities
 */

export { 
  StrategyPerformanceService, 
  createStrategyPerformanceService, 
  validatePerformanceInputs,
  type PerformanceCalculationConfig 
} from './StrategyPerformanceService';

export {
  JournalDataService,
  createJournalDataService,
  journalDataService,
  validateJournalServiceInputs,
  type JournalDataServiceConfig
} from './JournalDataService';