/**
 * Navigation Context Types
 * 
 * These types support the comprehensive trade review system's contextual navigation
 * requirements, allowing users to return to their exact previous location when
 * viewing trades from different sources (calendar, trade list, search, etc.).
 */

export interface NavigationContext {
  /** The source location from which the user navigated to the trade review */
  source: 'calendar' | 'trade-list' | 'search' | 'dashboard' | 'analytics';
  
  /** Parameters specific to the source location for restoration */
  sourceParams?: {
    /** Calendar-specific: date being viewed */
    date?: string;
    /** Trade list-specific: applied filters */
    filters?: TradeListFilters;
    /** Search-specific: search query and results context */
    searchQuery?: string;
    /** Pagination: current page number */
    page?: number;
    /** Sorting: current sort configuration */
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    /** View mode: how the data was being displayed */
    viewMode?: 'list' | 'grid' | 'calendar';
    /** Selected time range for analytics */
    timeRange?: string;
    /** Active tab or section */
    activeTab?: string;
  };
  
  /** Breadcrumb trail for complex navigation paths */
  breadcrumb: string[];
  
  /** Timestamp when context was created */
  timestamp: number;
  
  /** Optional metadata for debugging or analytics */
  metadata?: {
    userAgent?: string;
    screenSize?: string;
    referrer?: string;
  };
}

export interface TradeListFilters {
  /** Filter by trade status */
  status?: 'open' | 'closed' | 'all';
  
  /** Filter by currency pairs */
  currencyPairs?: string[];
  
  /** Filter by date range */
  dateRange?: {
    start: string;
    end: string;
  };
  
  /** Filter by profitability */
  profitability?: 'profitable' | 'losing' | 'breakeven' | 'all';
  
  /** Filter by strategy */
  strategies?: string[];
  
  /** Filter by tags */
  tags?: string[];
  
  /** Filter by account */
  accountId?: string;
  
  /** Text search filter */
  searchText?: string;
}

export interface NavigationState {
  /** Currently viewed trade ID */
  currentTradeId: string;
  
  /** Current navigation context */
  context: NavigationContext;
  
  /** Navigation history for browser-like back/forward */
  history: string[];
  
  /** Current position in history */
  historyIndex: number;
  
  /** Whether back navigation is available */
  canNavigateBack: boolean;
  
  /** Whether forward navigation is available */
  canNavigateForward: boolean;
  
  /** Pending navigation context (for async operations) */
  pendingContext?: NavigationContext;
}

export interface ViewState {
  /** Current view mode */
  mode: 'view' | 'edit' | 'review';
  
  /** Active panel in the trade review */
  activePanel: 'data' | 'analysis' | 'performance' | 'workflow';
  
  /** Expanded sections for UI state persistence */
  expandedSections: string[];
  
  /** Whether there are unsaved changes */
  unsavedChanges: boolean;
  
  /** Loading states for different sections */
  loadingStates: {
    trade?: boolean;
    notes?: boolean;
    charts?: boolean;
    analytics?: boolean;
  };
  
  /** Error states for different sections */
  errorStates: {
    trade?: string;
    notes?: string;
    charts?: string;
    analytics?: string;
  };
}

export interface NavigationContextOptions {
  /** Whether to persist context to localStorage */
  persist?: boolean;
  
  /** Maximum age of context in milliseconds before it's considered stale */
  maxAge?: number;
  
  /** Whether to include metadata in the context */
  includeMetadata?: boolean;
  
  /** Custom validation function for context */
  validator?: (context: NavigationContext) => boolean;
}

export interface NavigationContextServiceConfig {
  /** localStorage key for persisting navigation context */
  storageKey: string;
  
  /** Default maximum age for navigation context (24 hours) */
  defaultMaxAge: number;
  
  /** Whether to enable debug logging */
  enableDebugLogging: boolean;
  
  /** Maximum number of breadcrumb items to maintain */
  maxBreadcrumbLength: number;
  
  /** Maximum number of history items to maintain */
  maxHistoryLength: number;
}

/**
 * Navigation event types for event-driven navigation handling
 */
export type NavigationEvent = 
  | { type: 'CONTEXT_SET'; payload: NavigationContext }
  | { type: 'CONTEXT_CLEARED'; payload: null }
  | { type: 'CONTEXT_RESTORED'; payload: NavigationContext }
  | { type: 'NAVIGATION_BACK'; payload: NavigationContext }
  | { type: 'NAVIGATION_FORWARD'; payload: NavigationContext }
  | { type: 'TRADE_CHANGED'; payload: { tradeId: string; context: NavigationContext } };

/**
 * Navigation context validation result
 */
export interface NavigationContextValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  isStale: boolean;
  age: number;
}

/**
 * Back navigation configuration for different sources
 */
export interface BackNavigationConfig {
  source: NavigationContext['source'];
  label: string;
  icon?: string;
  url: string;
  requiresParams: boolean;
  paramMapping?: { [key: string]: string };
}

/**
 * Navigation analytics for tracking user behavior
 */
export interface NavigationAnalytics {
  sourceDistribution: { [key in NavigationContext['source']]: number };
  averageSessionDuration: number;
  mostCommonPaths: string[];
  backNavigationUsage: number;
  contextRestorationSuccess: number;
}