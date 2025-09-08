import {
  calculateProcessScore,
  calculateOverallDiscipline,
  createProcessMetrics,
  analyzeTradeExecution,
  generateProcessInsights,
  validateProcessMetrics,
  getProcessScoreColor,
  getProcessScoreDescription
} from '../processMetricsUtils';
import { ProcessMetrics } from '../../types/journal';
import { Trade } from '../../types/trade';

describe('processMetricsUtils', () => {
  describe('calculateProcessScore', () => {
    it('calculates process score correctly with weighted metrics', () => {
      const metrics = {
        planAdherence: 4,
        riskManagement: 5,
        entryTiming: 3,
        exitTiming: 4,
        emotionalDiscipline: 3
      };

      const score = calculateProcessScore(metrics);
      
      // Expected calculation based on weights:
      // (4*0.25 + 5*0.25 + 3*0.15 + 4*0.15 + 3*0.20) / 5 * 100
      // = (1 + 1.25 + 0.45 + 0.6 + 0.6) / 5 * 100
      // = 3.9 / 5 * 100 = 78
      expect(score).toBe(78);
    });

    it('returns 100 for perfect scores', () => {
      const metrics = {
        planAdherence: 5,
        riskManagement: 5,
        entryTiming: 5,
        exitTiming: 5,
        emotionalDiscipline: 5
      };

      const score = calculateProcessScore(metrics);
      expect(score).toBe(100);
    });

    it('returns 20 for minimum scores', () => {
      const metrics = {
        planAdherence: 1,
        riskManagement: 1,
        entryTiming: 1,
        exitTiming: 1,
        emotionalDiscipline: 1
      };

      const score = calculateProcessScore(metrics);
      expect(score).toBe(20);
    });

    it('handles missing metrics by treating them as 0', () => {
      const metrics = {
        planAdherence: 4,
        riskManagement: 5
        // Missing other metrics
      };

      const score = calculateProcessScore(metrics);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(100);
    });
  });

  describe('calculateOverallDiscipline', () => {
    it('calculates simple average correctly', () => {
      const metrics = {
        planAdherence: 4,
        riskManagement: 5,
        entryTiming: 3,
        exitTiming: 4,
        emotionalDiscipline: 3
      };

      const discipline = calculateOverallDiscipline(metrics);
      expect(discipline).toBe(3.8); // (4+5+3+4+3)/5 = 3.8
    });

    it('handles missing metrics by treating them as 0', () => {
      const metrics = {
        planAdherence: 4,
        riskManagement: 5
      };

      const discipline = calculateOverallDiscipline(metrics);
      expect(discipline).toBe(1.8); // (4+5+0+0+0)/5 = 1.8
    });
  });

  describe('createProcessMetrics', () => {
    it('creates complete ProcessMetrics object with calculated values', () => {
      const result = createProcessMetrics(4, 5, 3, 4, 3, 'Good day overall');

      expect(result).toEqual({
        planAdherence: 4,
        riskManagement: 5,
        entryTiming: 3,
        exitTiming: 4,
        emotionalDiscipline: 3,
        overallDiscipline: 3.8,
        processScore: 78,
        processNotes: 'Good day overall',
        mistakesMade: [],
        successfulExecutions: [],
        improvementAreas: [],
        strengthsIdentified: []
      });
    });

    it('includes optional arrays when provided', () => {
      const mistakes = [{
        id: '1',
        category: 'plan_deviation' as const,
        description: 'Entered without confirmation',
        impact: 'medium' as const,
        lesson: 'Wait for all signals'
      }];

      const result = createProcessMetrics(4, 5, 3, 4, 3, undefined, mistakes);

      expect(result.mistakesMade).toEqual(mistakes);
    });
  });

  describe('analyzeTradeExecution', () => {
    const mockTrades: Trade[] = [
      {
        id: '1',
        accountId: 'acc1',
        currencyPair: 'EUR/USD',
        date: '2024-01-01',
        timeIn: '09:00',
        timeOut: '10:00',
        side: 'long',
        entryPrice: 1.1000,
        exitPrice: 1.1050,
        lotSize: 1,
        lotType: 'standard',
        units: 100000,
        stopLoss: 1.0950,
        commission: 5,
        accountCurrency: 'USD',
        status: 'closed',
        pnl: 500,
        timestamp: Date.now()
      },
      {
        id: '2',
        accountId: 'acc1',
        currencyPair: 'GBP/USD',
        date: '2024-01-01',
        timeIn: '11:00',
        timeOut: '12:00',
        side: 'short',
        entryPrice: 1.2500,
        exitPrice: 1.2450,
        lotSize: 1,
        lotType: 'standard',
        units: 100000,
        stopLoss: 1.2550,
        commission: 3,
        accountCurrency: 'USD',
        status: 'closed',
        pnl: 250,
        timestamp: Date.now()
      }
    ];

    it('identifies good stop loss usage', () => {
      const analysis = analyzeTradeExecution(mockTrades);

      expect(analysis.strengthsIdentified).toContain('Excellent stop loss discipline - 100% usage rate');
      expect(analysis.successfulExecutions).toHaveLength(1);
      expect(analysis.successfulExecutions[0].category).toBe('risk_control');
    });

    it('identifies poor stop loss usage', () => {
      const tradesWithoutStops = mockTrades.map(trade => ({ ...trade, stopLoss: undefined }));
      const analysis = analyzeTradeExecution(tradesWithoutStops);

      expect(analysis.improvementAreas).toContain('Increase stop loss usage - only 0% of trades had stops');
      expect(analysis.mistakesMade).toHaveLength(1);
      expect(analysis.mistakesMade[0].category).toBe('risk_management');
    });

    it('analyzes win rate correctly', () => {
      const analysis = analyzeTradeExecution(mockTrades);

      // Both trades are profitable, so win rate is 100%
      expect(analysis.strengthsIdentified).toContain('Strong win rate (100%) - excellent trade selection');
    });

    it('identifies low win rate', () => {
      const losingTrades = mockTrades.map(trade => ({ ...trade, pnl: -100 }));
      const analysis = analyzeTradeExecution(losingTrades);

      expect(analysis.improvementAreas).toContain('Low win rate (0%) - review entry criteria');
    });

    it('handles empty trades array', () => {
      const analysis = analyzeTradeExecution([]);

      expect(analysis.improvementAreas).toHaveLength(0);
      expect(analysis.strengthsIdentified).toHaveLength(0);
      expect(analysis.mistakesMade).toHaveLength(0);
      expect(analysis.successfulExecutions).toHaveLength(0);
    });

    it('analyzes position sizing consistency', () => {
      const inconsistentTrades = [
        { ...mockTrades[0], lotSize: 1 },
        { ...mockTrades[1], lotSize: 5 } // Very different lot size
      ];

      const analysis = analyzeTradeExecution(inconsistentTrades);

      expect(analysis.improvementAreas).toContain('Inconsistent position sizing - review risk management rules');
      expect(analysis.mistakesMade.some(m => m.category === 'position_sizing')).toBe(true);
    });
  });

  describe('generateProcessInsights', () => {
    const mockProcessMetrics: ProcessMetrics = {
      planAdherence: 4,
      riskManagement: 5,
      entryTiming: 2, // Weakest area
      exitTiming: 4,
      emotionalDiscipline: 3,
      overallDiscipline: 3.6,
      processScore: 76,
      mistakesMade: [],
      successfulExecutions: [],
      improvementAreas: [],
      strengthsIdentified: []
    };

    const mockTrades: Trade[] = [
      {
        id: '1',
        accountId: 'acc1',
        currencyPair: 'EUR/USD',
        date: '2024-01-01',
        timeIn: '09:00',
        timeOut: '10:00',
        side: 'long',
        entryPrice: 1.1000,
        exitPrice: 1.1050,
        lotSize: 1,
        lotType: 'standard',
        units: 100000,
        stopLoss: 1.0950,
        commission: 5,
        accountCurrency: 'USD',
        status: 'closed',
        pnl: 500,
        timestamp: Date.now()
      }
    ];

    it('generates appropriate insight for good process score', () => {
      const insights = generateProcessInsights(mockProcessMetrics, mockTrades);

      expect(insights.keyInsight).toContain('Good process execution with room for improvement');
      expect(insights.recommendations.length).toBeGreaterThan(0);
      expect(insights.recommendations.length).toBeLessThanOrEqual(4);
      expect(insights.focusAreas).toContain('Entry Timing');
    });

    it('generates recommendations for weakest area', () => {
      const insights = generateProcessInsights(mockProcessMetrics, mockTrades);

      expect(insights.recommendations).toContain('Wait for all confluence factors before entering');
      expect(insights.recommendations).toContain('Practice patience - better entries lead to better outcomes');
    });

    it('acknowledges strengths', () => {
      const insights = generateProcessInsights(mockProcessMetrics, mockTrades);

      expect(insights.recommendations).toContain('Continue your excellent risk management - it\'s a key strength');
    });

    it('handles excellent process score', () => {
      const excellentMetrics = { ...mockProcessMetrics, processScore: 85 };
      const insights = generateProcessInsights(excellentMetrics, mockTrades);

      expect(insights.keyInsight).toContain('Excellent process execution today');
    });

    it('handles poor process score', () => {
      const poorMetrics = { ...mockProcessMetrics, processScore: 35 };
      const insights = generateProcessInsights(poorMetrics, mockTrades);

      expect(insights.keyInsight).toContain('Process execution needs significant improvement');
    });
  });

  describe('validateProcessMetrics', () => {
    it('validates complete metrics successfully', () => {
      const metrics = {
        planAdherence: 4,
        riskManagement: 5,
        entryTiming: 3,
        exitTiming: 4,
        emotionalDiscipline: 3
      };

      const result = validateProcessMetrics(metrics);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('identifies missing required fields', () => {
      const metrics = {
        planAdherence: 4,
        riskManagement: 5
        // Missing other required fields
      };

      const result = validateProcessMetrics(metrics);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('entryTiming is required');
      expect(result.errors).toContain('exitTiming is required');
      expect(result.errors).toContain('emotionalDiscipline is required');
    });

    it('validates value ranges', () => {
      const metrics = {
        planAdherence: 6, // Invalid: > 5
        riskManagement: 0, // Invalid: < 1
        entryTiming: 3,
        exitTiming: 4,
        emotionalDiscipline: 'invalid' as any // Invalid: not a number
      };

      const result = validateProcessMetrics(metrics);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('planAdherence must be between 1 and 5');
      expect(result.errors).toContain('riskManagement must be between 1 and 5');
      expect(result.errors).toContain('emotionalDiscipline must be a number');
    });
  });

  describe('getProcessScoreColor', () => {
    it('returns correct colors for different score ranges', () => {
      expect(getProcessScoreColor(85)).toBe('green');
      expect(getProcessScoreColor(70)).toBe('yellow');
      expect(getProcessScoreColor(50)).toBe('orange');
      expect(getProcessScoreColor(30)).toBe('red');
    });
  });

  describe('getProcessScoreDescription', () => {
    it('returns appropriate descriptions for different scores', () => {
      expect(getProcessScoreDescription(85)).toBe('Excellent process execution');
      expect(getProcessScoreDescription(70)).toBe('Good process with minor improvements needed');
      expect(getProcessScoreDescription(50)).toBe('Fair process with significant room for improvement');
      expect(getProcessScoreDescription(30)).toBe('Poor process execution - focus on rebuilding discipline');
    });
  });
});