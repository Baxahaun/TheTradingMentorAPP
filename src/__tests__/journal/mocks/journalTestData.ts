/**
 * Journal Test Data and Mocks
 * 
 * Centralized test data for consistent testing across all journal test suites
 */

import { JournalEntry, JournalTemplate, EmotionalState, ProcessMetrics, JournalImage } from '../../../types/journal';

export const mockUserId = 'test-user-123';
export const mockDate = '2024-01-15';

export const mockEmotionalState: EmotionalState = {
  preMarket: {
    confidence: 4,
    anxiety: 2,
    focus: 5,
    mood: 'confident',
    notes: 'Feeling prepared for the trading day'
  },
  duringTrading: {
    discipline: 4,
    patience: 3,
    emotionalControl: 4,
    notes: 'Maintained discipline during volatile period'
  },
  postMarket: {
    satisfaction: 4,
    learningValue: 5,
    overallMood: 'satisfied',
    notes: 'Good learning day despite small loss'
  }
};

export const mockProcessMetrics: ProcessMetrics = {
  planAdherence: 4,
  riskManagement: 5,
  entryTiming: 3,
  exitTiming: 4,
  overallDiscipline: 4,
  processScore: 85
};

export const mockJournalImage: JournalImage = {
  id: 'img-1',
  url: 'https://example.com/chart.png',
  filename: 'chart-analysis.png',
  uploadedAt: '2024-01-15T10:30:00Z',
  annotations: [
    {
      id: 'ann-1',
      type: 'arrow',
      position: { x: 100, y: 150 },
      content: 'Entry point',
      color: '#00ff00'
    }
  ],
  caption: 'EUR/USD 4H chart analysis',
  tradeId: 'trade-123'
};

export const mockJournalEntry: JournalEntry = {
  id: 'journal-entry-1',
  userId: mockUserId,
  date: mockDate,
  createdAt: '2024-01-15T08:00:00Z',
  updatedAt: '2024-01-15T18:00:00Z',
  
  // Content sections
  preMarketNotes: 'Market showing bullish sentiment. Key levels to watch: 1.0850 support, 1.0920 resistance.',
  tradingNotes: 'Executed 3 trades today. EUR/USD long at 1.0865, closed at 1.0885 for +20 pips.',
  postMarketReflection: 'Good discipline shown today. Stuck to plan despite tempting setups outside strategy.',
  lessonsLearned: 'Need to be more patient with entries. Rushed into second trade.',
  tomorrowsPlan: 'Focus on GBP/USD if it breaks above 1.2650. Wait for confirmation.',
  
  // Template and structure
  templateId: 'full-day-template',
  sections: [
    {
      id: 'section-1',
      type: 'text',
      title: 'Pre-Market Analysis',
      content: 'Market showing bullish sentiment...',
      order: 1,
      isRequired: true
    },
    {
      id: 'section-2',
      type: 'trade_reference',
      title: 'Trade Analysis',
      content: ['trade-123', 'trade-124'],
      order: 2,
      isRequired: false
    }
  ],
  
  // Trade references
  tradeReferences: [
    {
      tradeId: 'trade-123',
      insertedAt: '2024-01-15T14:30:00Z',
      context: 'Main EUR/USD position based on morning analysis',
      displayType: 'card'
    }
  ],
  
  // Emotional and performance tracking
  emotionalState: mockEmotionalState,
  processMetrics: mockProcessMetrics,
  dailyPnL: 45.50,
  
  // Media attachments
  images: [mockJournalImage],
  
  // Metadata
  tags: ['EUR/USD', 'trend-following', 'good-discipline'],
  isComplete: true,
  wordCount: 156
};

export const mockJournalTemplate: JournalTemplate = {
  id: 'full-day-template',
  userId: mockUserId,
  name: 'Full Day Trading Journal',
  description: 'Comprehensive template for complete daily trading reflection',
  category: 'full-day',
  isDefault: true,
  isPublic: false,
  
  sections: [
    {
      id: 'pre-market-section',
      type: 'text',
      title: 'Pre-Market Analysis',
      prompt: 'What is your market bias and key levels to watch today?',
      placeholder: 'Market sentiment, key levels, economic events...',
      isRequired: true,
      order: 1,
      config: { minLength: 50 }
    },
    {
      id: 'emotional-check-section',
      type: 'emotion_tracker',
      title: 'Emotional State Check',
      prompt: 'How are you feeling before the trading session?',
      isRequired: true,
      order: 2,
      config: { phase: 'preMarket' }
    },
    {
      id: 'trade-analysis-section',
      type: 'trade_reference',
      title: 'Trade Analysis',
      prompt: 'Reference and analyze your trades from today',
      isRequired: false,
      order: 3,
      config: { maxTrades: 10 }
    }
  ],
  
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T12:00:00Z',
  usageCount: 25
};

export const mockIncompleteJournalEntry: Partial<JournalEntry> = {
  id: 'journal-entry-incomplete',
  userId: mockUserId,
  date: '2024-01-16',
  createdAt: '2024-01-16T08:00:00Z',
  updatedAt: '2024-01-16T08:30:00Z',
  
  preMarketNotes: 'Started analysis but got interrupted...',
  templateId: 'full-day-template',
  sections: [],
  tradeReferences: [],
  emotionalState: {
    preMarket: {
      confidence: 3,
      anxiety: 3,
      focus: 3,
      mood: 'calm'
    }
  } as EmotionalState,
  
  images: [],
  tags: [],
  isComplete: false,
  wordCount: 8
};

export const mockLargeJournalEntry: JournalEntry = {
  ...mockJournalEntry,
  id: 'large-journal-entry',
  preMarketNotes: 'A'.repeat(5000), // 5KB of text
  tradingNotes: 'B'.repeat(10000), // 10KB of text
  postMarketReflection: 'C'.repeat(7500), // 7.5KB of text
  images: Array.from({ length: 20 }, (_, i) => ({
    ...mockJournalImage,
    id: `img-${i}`,
    filename: `chart-${i}.png`
  })),
  wordCount: 2500
};

// Mock Firebase responses
export const mockFirebaseResponses = {
  createSuccess: { id: 'new-entry-id' },
  updateSuccess: { success: true },
  deleteSuccess: { success: true },
  getSuccess: mockJournalEntry,
  getNotFound: null,
  querySuccess: [mockJournalEntry],
  queryEmpty: []
};

// Mock error responses
export const mockErrorResponses = {
  networkError: new Error('Network request failed'),
  authError: new Error('Authentication required'),
  validationError: new Error('Invalid data format'),
  storageError: new Error('Storage quota exceeded')
};

// Test utilities
export const createMockJournalEntry = (overrides: Partial<JournalEntry> = {}): JournalEntry => ({
  ...mockJournalEntry,
  ...overrides,
  id: overrides.id || `test-entry-${Date.now()}`
});

export const createMockTemplate = (overrides: Partial<JournalTemplate> = {}): JournalTemplate => ({
  ...mockJournalTemplate,
  ...overrides,
  id: overrides.id || `test-template-${Date.now()}`
});