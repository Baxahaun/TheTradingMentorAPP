export interface ReflectionPrompt {
  id: string;
  type: 'winning_trades' | 'losing_trades' | 'no_trades' | 'mixed_day' | 'general';
  category: 'learning' | 'process' | 'emotional' | 'market_analysis' | 'planning';
  question: string;
  followUpQuestions?: string[];
  context?: {
    tradeCount?: number;
    pnlRange?: 'positive' | 'negative' | 'mixed';
    emotionalState?: string;
    processScore?: number;
  };
  priority: number; // Higher number = higher priority
}

export interface ReflectionResponse {
  id: string;
  userId: string;
  date: string;
  promptId: string;
  question: string;
  answer: string;
  tags: string[];
  themes: string[];
  createdAt: string;
  updatedAt: string;
  relatedTradeIds?: string[];
  emotionalContext?: {
    preAnswer: string;
    postAnswer: string;
  };
}

export interface LearningPattern {
  id: string;
  userId: string;
  theme: string;
  description: string;
  frequency: number;
  firstOccurrence: string;
  lastOccurrence: string;
  relatedResponses: string[];
  category: 'strength' | 'weakness' | 'opportunity' | 'insight';
  actionItems: string[];
  isResolved: boolean;
}

export interface ReflectionSession {
  id: string;
  userId: string;
  date: string;
  prompts: ReflectionPrompt[];
  responses: ReflectionResponse[];
  completionStatus: 'not_started' | 'in_progress' | 'completed';
  startedAt?: string;
  completedAt?: string;
  sessionContext: {
    tradeCount: number;
    totalPnL: number;
    processScore: number;
    emotionalState: string;
    marketConditions: string;
  };
}

export interface ReflectionSearchQuery {
  query?: string;
  tags?: string[];
  themes?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  category?: string;
  sortBy?: 'date' | 'relevance' | 'theme';
  sortOrder?: 'asc' | 'desc';
}

export interface ReflectionInsight {
  id: string;
  type: 'pattern' | 'correlation' | 'trend' | 'recommendation';
  title: string;
  description: string;
  confidence: number; // 0-1
  supportingData: {
    responseIds: string[];
    patterns: string[];
    timeframe: string;
  };
  actionable: boolean;
  category: 'performance' | 'emotional' | 'process' | 'market';
}

export interface ReflectionAnalytics {
  totalReflections: number;
  averageResponseLength: number;
  mostCommonThemes: Array<{ theme: string; count: number }>;
  learningPatterns: LearningPattern[];
  insights: ReflectionInsight[];
  consistencyScore: number; // 0-100
  reflectionStreak: number;
}