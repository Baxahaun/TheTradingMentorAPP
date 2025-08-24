import { toast } from 'sonner';

export enum TradeReviewErrorType {
  TRADE_NOT_FOUND = 'TRADE_NOT_FOUND',
  NAVIGATION_CONTEXT_INVALID = 'NAVIGATION_CONTEXT_INVALID',
  SAVE_FAILED = 'SAVE_FAILED',
  CHART_UPLOAD_FAILED = 'CHART_UPLOAD_FAILED',
  PERFORMANCE_CALCULATION_ERROR = 'PERFORMANCE_CALCULATION_ERROR',
  REVIEW_WORKFLOW_ERROR = 'REVIEW_WORKFLOW_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  STORAGE_QUOTA_EXCEEDED = 'STORAGE_QUOTA_EXCEEDED',
  OFFLINE_ERROR = 'OFFLINE_ERROR'
}

export interface TradeReviewError {
  type: TradeReviewErrorType;
  message: string;
  details?: any;
  recoverable: boolean;
  suggestedAction?: string;
  timestamp: number;
  context?: {
    tradeId?: string;
    userId?: string;
    action?: string;
    component?: string;
  };
}

export interface ErrorRecoveryAction {
  id: string;
  label: string;
  action: () => Promise<void> | void;
  primary?: boolean;
}

export interface ErrorHandlingConfig {
  enableLogging: boolean;
  enableToasts: boolean;
  enableRetry: boolean;
  maxRetryAttempts: number;
  retryDelay: number;
  enableOfflineMode: boolean;
}

class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private config: ErrorHandlingConfig;
  private errorLog: TradeReviewError[] = [];
  private retryAttempts: Map<string, number> = new Map();

  private constructor() {
    this.config = {
      enableLogging: true,
      enableToasts: true,
      enableRetry: true,
      maxRetryAttempts: 3,
      retryDelay: 1000,
      enableOfflineMode: true
    };
  }

  static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  configure(config: Partial<ErrorHandlingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  handleError(error: TradeReviewError): void {
    // Log the error
    if (this.config.enableLogging) {
      this.logError(error);
    }

    // Show user-friendly message
    if (this.config.enableToasts) {
      this.showErrorToast(error);
    }

    // Attempt recovery if possible
    if (error.recoverable) {
      this.attemptRecovery(error);
    }
  }

  createError(
    type: TradeReviewErrorType,
    message: string,
    details?: any,
    context?: TradeReviewError['context']
  ): TradeReviewError {
    return {
      type,
      message,
      details,
      recoverable: this.isRecoverable(type),
      suggestedAction: this.getSuggestedAction(type),
      timestamp: Date.now(),
      context
    };
  }

  private isRecoverable(type: TradeReviewErrorType): boolean {
    const recoverableTypes = [
      TradeReviewErrorType.SAVE_FAILED,
      TradeReviewErrorType.CHART_UPLOAD_FAILED,
      TradeReviewErrorType.NETWORK_ERROR,
      TradeReviewErrorType.OFFLINE_ERROR
    ];
    return recoverableTypes.includes(type);
  }

  private getSuggestedAction(type: TradeReviewErrorType): string {
    const suggestions: Record<TradeReviewErrorType, string> = {
      [TradeReviewErrorType.TRADE_NOT_FOUND]: 'Return to trade list and select a valid trade',
      [TradeReviewErrorType.NAVIGATION_CONTEXT_INVALID]: 'Use browser navigation or return to dashboard',
      [TradeReviewErrorType.SAVE_FAILED]: 'Check your connection and try saving again',
      [TradeReviewErrorType.CHART_UPLOAD_FAILED]: 'Verify file format and size, then try uploading again',
      [TradeReviewErrorType.PERFORMANCE_CALCULATION_ERROR]: 'Verify trade data completeness',
      [TradeReviewErrorType.REVIEW_WORKFLOW_ERROR]: 'Refresh the page and try again',
      [TradeReviewErrorType.NETWORK_ERROR]: 'Check your internet connection and retry',
      [TradeReviewErrorType.VALIDATION_ERROR]: 'Please correct the highlighted fields',
      [TradeReviewErrorType.PERMISSION_DENIED]: 'You may not have permission to perform this action',
      [TradeReviewErrorType.STORAGE_QUOTA_EXCEEDED]: 'Clear some data or contact support',
      [TradeReviewErrorType.OFFLINE_ERROR]: 'Your changes will be saved when connection is restored'
    };
    return suggestions[type] || 'Please try again or contact support';
  }

  private logError(error: TradeReviewError): void {
    console.error('[TradeReview Error]', {
      type: error.type,
      message: error.message,
      details: error.details,
      context: error.context,
      timestamp: new Date(error.timestamp).toISOString()
    });

    // Store in memory for debugging
    this.errorLog.push(error);
    
    // Keep only last 100 errors
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100);
    }
  }

  private showErrorToast(error: TradeReviewError): void {
    const actions = this.getRecoveryActions(error);
    
    if (actions.length > 0) {
      toast.error(error.message, {
        description: error.suggestedAction,
        action: actions[0] ? {
          label: actions[0].label,
          onClick: actions[0].action
        } : undefined,
        duration: 5000
      });
    } else {
      toast.error(error.message, {
        description: error.suggestedAction,
        duration: 4000
      });
    }
  }

  private attemptRecovery(error: TradeReviewError): void {
    const recoveryKey = `${error.type}_${error.context?.tradeId || 'global'}`;
    const attempts = this.retryAttempts.get(recoveryKey) || 0;

    if (attempts < this.config.maxRetryAttempts) {
      this.retryAttempts.set(recoveryKey, attempts + 1);
      
      setTimeout(() => {
        this.executeRecovery(error);
      }, this.config.retryDelay * (attempts + 1));
    } else {
      // Max attempts reached, show final error
      toast.error('Recovery failed', {
        description: 'Please refresh the page or contact support',
        duration: 6000
      });
    }
  }

  private executeRecovery(error: TradeReviewError): void {
    // Recovery logic based on error type
    switch (error.type) {
      case TradeReviewErrorType.SAVE_FAILED:
        this.recoverSaveOperation(error);
        break;
      case TradeReviewErrorType.CHART_UPLOAD_FAILED:
        this.recoverChartUpload(error);
        break;
      case TradeReviewErrorType.NETWORK_ERROR:
        this.recoverNetworkOperation(error);
        break;
      default:
        console.warn('No recovery strategy for error type:', error.type);
    }
  }

  private recoverSaveOperation(error: TradeReviewError): void {
    // Attempt to save from local backup
    const backupData = this.getLocalBackup(error.context?.tradeId);
    if (backupData) {
      toast.info('Attempting to recover unsaved changes...');
      // Recovery logic would be implemented here
    }
  }

  private recoverChartUpload(error: TradeReviewError): void {
    // Retry chart upload with different strategy
    toast.info('Retrying chart upload...');
    // Recovery logic would be implemented here
  }

  private recoverNetworkOperation(error: TradeReviewError): void {
    // Check network status and retry
    if (navigator.onLine) {
      toast.info('Connection restored, retrying...');
      // Recovery logic would be implemented here
    }
  }

  getRecoveryActions(error: TradeReviewError): ErrorRecoveryAction[] {
    const actions: ErrorRecoveryAction[] = [];

    switch (error.type) {
      case TradeReviewErrorType.SAVE_FAILED:
        actions.push({
          id: 'retry-save',
          label: 'Retry Save',
          action: () => this.executeRecovery(error),
          primary: true
        });
        break;
      
      case TradeReviewErrorType.CHART_UPLOAD_FAILED:
        actions.push({
          id: 'retry-upload',
          label: 'Retry Upload',
          action: () => this.executeRecovery(error),
          primary: true
        });
        break;
      
      case TradeReviewErrorType.TRADE_NOT_FOUND:
        actions.push({
          id: 'go-to-list',
          label: 'Go to Trade List',
          action: () => window.location.href = '/trades',
          primary: true
        });
        break;
    }

    return actions;
  }

  getErrorLog(): TradeReviewError[] {
    return [...this.errorLog];
  }

  clearErrorLog(): void {
    this.errorLog = [];
    this.retryAttempts.clear();
  }

  // Local backup functionality
  private getLocalBackup(tradeId?: string): any {
    if (!tradeId) return null;
    
    try {
      const backup = localStorage.getItem(`trade_backup_${tradeId}`);
      return backup ? JSON.parse(backup) : null;
    } catch {
      return null;
    }
  }

  saveLocalBackup(tradeId: string, data: any): void {
    try {
      localStorage.setItem(`trade_backup_${tradeId}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to save local backup:', error);
    }
  }

  clearLocalBackup(tradeId: string): void {
    try {
      localStorage.removeItem(`trade_backup_${tradeId}`);
    } catch (error) {
      console.warn('Failed to clear local backup:', error);
    }
  }

  // Network status monitoring
  isOnline(): boolean {
    return navigator.onLine;
  }

  onNetworkChange(callback: (online: boolean) => void): () => void {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }
}

export const errorHandlingService = ErrorHandlingService.getInstance();