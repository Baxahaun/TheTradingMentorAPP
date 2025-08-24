/**
 * Trade Review System Types
 * Extends the base Trade interface with review-specific data structures
 */

import { Trade } from './trade';

// Trade review modes
export type TradeReviewMode = 'view' | 'edit' | 'review';

// View state for trade review system
export interface ViewState {
  mode: TradeReviewMode;
  activePanel: 'data' | 'analysis' | 'performance' | 'workflow';
  expandedSections: string[];
  unsavedChanges: boolean;
}

// Error types for trade review system
export enum TradeReviewErrorType {
  TRADE_NOT_FOUND = 'TRADE_NOT_FOUND',
  SAVE_FAILED = 'SAVE_FAILED',
  LOAD_FAILED = 'LOAD_FAILED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
}

// Error interface for trade review system
export interface TradeReviewError {
  type: TradeReviewErrorType;
  message: string;
  recoverable: boolean;
  suggestedAction?: string;
  details?: any;
}

// Review workflow stages
export interface ReviewStage {
  id: string;
  name: string;
  description: string;
  required: boolean;
  completed: boolean;
  completedAt?: string;
  notes?: string;
}

// Review workflow management
export interface ReviewWorkflow {
  tradeId: string;
  stages: ReviewStage[];
  overallProgress: number;
  startedAt: string;
  completedAt?: string;
  reviewerId?: string;
}

// Enhanced notes structure
export interface TradeNotes {
  preTradeAnalysis?: string;
  executionNotes?: string;
  postTradeReflection?: string;
  lessonsLearned?: string;
  generalNotes?: string;
  lastModified: string;
  version: number;
}

// Note versioning
export interface NoteVersion {
  version: number;
  content: TradeNotes;
  timestamp: string;
  changes: string[];
}

// Note templates
export interface NoteTemplate {
  id: string;
  name: string;
  category: string;
  template: Partial<TradeNotes>;
  description: string;
}

// Chart management
export interface TradeChart {
  id: string;
  url: string;
  type: 'entry' | 'exit' | 'analysis' | 'post_mortem';
  timeframe: string;
  annotations?: ChartAnnotation[];
  uploadedAt: string;
  description?: string;
}

// Chart annotations
export interface ChartAnnotation {
  id: string;
  type: 'line' | 'rectangle' | 'text' | 'arrow';
  coordinates: {
    x1: number;
    y1: number;
    x2?: number;
    y2?: number;
  };
  style: {
    color: string;
    thickness?: number;
    opacity?: number;
  };
  text?: string;
  timestamp: string;
}

// Performance metrics for trade review
export interface PerformanceMetrics {
  rMultiple: number;
  returnPercentage: number;
  riskRewardRatio: number;
  holdDuration: number;
  efficiency: number;
  sharpeRatio?: number;
  maxDrawdown?: number;
}

// Trade comparison data
export interface TradeComparison {
  similarTrades: Trade[];
  averagePerformance: PerformanceMetrics;
  percentileRank: number;
  outperformanceFactors: string[];
  improvementSuggestions: string[];
}

// Enhanced trade data for review system
export interface TradeReviewData {
  reviewWorkflow?: ReviewWorkflow;
  notes?: TradeNotes;
  charts?: TradeChart[];
  performanceMetrics?: PerformanceMetrics;
  lastReviewedAt?: string;
  reviewCompletionScore?: number;
}

// Extended trade interface with review data
export interface EnhancedTrade extends Trade {
  reviewData?: TradeReviewData;
}

// Validation result types
export interface ValidationError {
  field: string;
  code: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// Auto-save conflict resolution
export interface ConflictResolution {
  strategy: 'merge' | 'overwrite' | 'manual';
  conflictedFields: string[];
  localVersion: Partial<EnhancedTrade>;
  remoteVersion: Partial<EnhancedTrade>;
  resolvedVersion?: Partial<EnhancedTrade>;
}

// Auto-save state
export interface AutoSaveState {
  isEnabled: boolean;
  interval: number;
  lastSaved?: string;
  hasUnsavedChanges: boolean;
  conflictResolution?: ConflictResolution;
}