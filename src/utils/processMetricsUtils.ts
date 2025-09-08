import { ProcessMetrics, ProcessMistake, ProcessSuccess } from '../types/journal';
import { JOURNAL_CONSTANTS } from '../types/journal';
import { Trade } from '../types/trade';

/**
 * Calculate the overall process score based on individual metrics
 */
export const calculateProcessScore = (metrics: Partial<ProcessMetrics>): number => {
  const weights = JOURNAL_CONSTANTS.PROCESS_SCORE_WEIGHTS;
  
  const planAdherence = metrics.planAdherence || 0;
  const riskManagement = metrics.riskManagement || 0;
  const entryTiming = metrics.entryTiming || 0;
  const exitTiming = metrics.exitTiming || 0;
  const emotionalDiscipline = metrics.emotionalDiscipline || 0;

  // Calculate weighted score (out of 5)
  const weightedScore = (
    planAdherence * weights.planAdherence +
    riskManagement * weights.riskManagement +
    entryTiming * weights.entryTiming +
    exitTiming * weights.exitTiming +
    emotionalDiscipline * weights.emotionalDiscipline
  );

  // Convert to 0-100 scale
  return Math.round((weightedScore / 5) * 100);
};

/**
 * Calculate overall discipline score as simple average
 */
export const calculateOverallDiscipline = (metrics: Partial<ProcessMetrics>): number => {
  const values = [
    metrics.planAdherence || 0,
    metrics.riskManagement || 0,
    metrics.entryTiming || 0,
    metrics.exitTiming || 0,
    metrics.emotionalDiscipline || 0
  ];

  const sum = values.reduce((acc, val) => acc + val, 0);
  return Number((sum / values.length).toFixed(1));
};

/**
 * Create a complete ProcessMetrics object with calculated values
 */
export const createProcessMetrics = (
  planAdherence: number,
  riskManagement: number,
  entryTiming: number,
  exitTiming: number,
  emotionalDiscipline: number,
  processNotes?: string,
  mistakesMade?: ProcessMistake[],
  successfulExecutions?: ProcessSuccess[],
  improvementAreas?: string[],
  strengthsIdentified?: string[]
): ProcessMetrics => {
  const baseMetrics = {
    planAdherence,
    riskManagement,
    entryTiming,
    exitTiming,
    emotionalDiscipline
  };

  const overallDiscipline = calculateOverallDiscipline(baseMetrics);
  const processScore = calculateProcessScore(baseMetrics);

  return {
    ...baseMetrics,
    overallDiscipline,
    processScore,
    processNotes,
    mistakesMade: mistakesMade || [],
    successfulExecutions: successfulExecutions || [],
    improvementAreas: improvementAreas || [],
    strengthsIdentified: strengthsIdentified || []
  };
};

/**
 * Analyze trades to suggest process improvements
 */
export const analyzeTradeExecution = (trades: Trade[]): {
  improvementAreas: string[];
  strengthsIdentified: string[];
  mistakesMade: ProcessMistake[];
  successfulExecutions: ProcessSuccess[];
} => {
  const improvementAreas: string[] = [];
  const strengthsIdentified: string[] = [];
  const mistakesMade: ProcessMistake[] = [];
  const successfulExecutions: ProcessSuccess[] = [];

  if (trades.length === 0) {
    return { improvementAreas, strengthsIdentified, mistakesMade, successfulExecutions };
  }

  const winningTrades = trades.filter(trade => (trade.pnl || 0) > 0);
  const losingTrades = trades.filter(trade => (trade.pnl || 0) < 0);
  const winRate = (winningTrades.length / trades.length) * 100;

  // Analyze risk management
  const tradesWithStops = trades.filter(trade => trade.stopLoss !== undefined && trade.stopLoss !== null);
  const stopLossUsage = (tradesWithStops.length / trades.length) * 100;

  if (stopLossUsage < 80) {
    improvementAreas.push('Increase stop loss usage - only ' + stopLossUsage.toFixed(0) + '% of trades had stops');
    mistakesMade.push({
      id: `risk-${Date.now()}`,
      category: 'risk_management',
      description: 'Insufficient stop loss usage',
      impact: 'high',
      lesson: 'Always use stop losses to protect capital',
      preventionStrategy: 'Set stop loss before entering any trade'
    });
  } else {
    strengthsIdentified.push('Excellent stop loss discipline - ' + stopLossUsage.toFixed(0) + '% usage rate');
    successfulExecutions.push({
      id: `risk-success-${Date.now()}`,
      category: 'risk_control',
      description: 'Consistent stop loss usage',
      impact: 'high',
      replicationStrategy: 'Continue setting stops before every trade entry'
    });
  }

  // Analyze position sizing consistency
  const lotSizes = trades.map(trade => trade.lotSize).filter(size => size > 0);
  if (lotSizes.length > 1) {
    const avgLotSize = lotSizes.reduce((sum, size) => sum + size, 0) / lotSizes.length;
    const maxDeviation = Math.max(...lotSizes.map(size => Math.abs(size - avgLotSize)));
    const deviationPercentage = (maxDeviation / avgLotSize) * 100;

    if (deviationPercentage > 50) {
      improvementAreas.push('Inconsistent position sizing - review risk management rules');
      mistakesMade.push({
        id: `sizing-${Date.now()}`,
        category: 'position_sizing',
        description: 'Inconsistent lot sizes across trades',
        impact: 'medium',
        lesson: 'Maintain consistent risk per trade',
        preventionStrategy: 'Calculate position size based on stop loss distance'
      });
    } else {
      strengthsIdentified.push('Consistent position sizing discipline');
    }
  }

  // Analyze win rate and suggest improvements
  if (winRate < 40) {
    improvementAreas.push('Low win rate (' + winRate.toFixed(0) + '%) - review entry criteria');
  } else if (winRate > 70) {
    strengthsIdentified.push('Strong win rate (' + winRate.toFixed(0) + '%) - excellent trade selection');
  }

  // Analyze trade timing
  const tradeTimes = trades.map(trade => {
    if (trade.timeIn && trade.timeOut) {
      const timeIn = new Date(`1970-01-01T${trade.timeIn}:00`);
      const timeOut = new Date(`1970-01-01T${trade.timeOut}:00`);
      return (timeOut.getTime() - timeIn.getTime()) / (1000 * 60); // minutes
    }
    return null;
  }).filter(time => time !== null) as number[];

  if (tradeTimes.length > 0) {
    const avgHoldTime = tradeTimes.reduce((sum, time) => sum + time, 0) / tradeTimes.length;
    
    if (avgHoldTime < 5) {
      improvementAreas.push('Very short hold times - consider if you\'re being too impatient');
    } else if (avgHoldTime > 480) { // 8 hours
      improvementAreas.push('Very long hold times - review exit strategy');
    } else {
      strengthsIdentified.push('Reasonable trade hold times showing patience');
    }
  }

  return {
    improvementAreas,
    strengthsIdentified,
    mistakesMade,
    successfulExecutions
  };
};

/**
 * Generate process insights based on metrics and trades
 */
export const generateProcessInsights = (
  processMetrics: ProcessMetrics,
  trades: Trade[]
): {
  keyInsight: string;
  recommendations: string[];
  focusAreas: string[];
} => {
  const recommendations: string[] = [];
  const focusAreas: string[] = [];
  let keyInsight = '';

  // Determine key insight based on process score
  if (processMetrics.processScore >= 80) {
    keyInsight = 'Excellent process execution today. Your discipline is building the foundation for consistent profitability.';
  } else if (processMetrics.processScore >= 60) {
    keyInsight = 'Good process execution with room for improvement. Focus on the specific areas where you can tighten your discipline.';
  } else if (processMetrics.processScore >= 40) {
    keyInsight = 'Mixed process execution. Identify the specific breakdowns and create action plans to address them.';
  } else {
    keyInsight = 'Process execution needs significant improvement. Focus on rebuilding your trading discipline step by step.';
  }

  // Generate specific recommendations based on weakest areas
  const metrics = {
    'Plan Adherence': processMetrics.planAdherence,
    'Risk Management': processMetrics.riskManagement,
    'Entry Timing': processMetrics.entryTiming,
    'Exit Timing': processMetrics.exitTiming,
    'Emotional Discipline': processMetrics.emotionalDiscipline
  };

  const sortedMetrics = Object.entries(metrics).sort(([,a], [,b]) => a - b);
  const weakestArea = sortedMetrics[0];
  const strongestArea = sortedMetrics[sortedMetrics.length - 1];

  // Recommendations based on weakest area
  if (weakestArea[1] < 3) {
    focusAreas.push(weakestArea[0]);
    
    switch (weakestArea[0]) {
      case 'Plan Adherence':
        recommendations.push('Review your trading plan before each session');
        recommendations.push('Write down your plan and check it before each trade');
        break;
      case 'Risk Management':
        recommendations.push('Always set stop losses before entering trades');
        recommendations.push('Calculate position size based on risk amount, not account size');
        break;
      case 'Entry Timing':
        recommendations.push('Wait for all confluence factors before entering');
        recommendations.push('Practice patience - better entries lead to better outcomes');
        break;
      case 'Exit Timing':
        recommendations.push('Define exit criteria before entering trades');
        recommendations.push('Stick to your profit targets and stop losses');
        break;
      case 'Emotional Discipline':
        recommendations.push('Take breaks between trades to reset emotionally');
        recommendations.push('Practice mindfulness and emotional awareness');
        break;
    }
  }

  // Acknowledge strengths
  if (strongestArea[1] >= 4) {
    recommendations.push(`Continue your excellent ${strongestArea[0].toLowerCase()} - it's a key strength`);
  }

  // Trade-specific recommendations
  if (trades.length > 0) {
    const analysis = analyzeTradeExecution(trades);
    recommendations.push(...analysis.improvementAreas.slice(0, 2)); // Top 2 improvement areas
  }

  return {
    keyInsight,
    recommendations: recommendations.slice(0, 4), // Limit to 4 recommendations
    focusAreas
  };
};

/**
 * Validate process metrics input
 */
export const validateProcessMetrics = (metrics: Partial<ProcessMetrics>): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  const requiredFields = ['planAdherence', 'riskManagement', 'entryTiming', 'exitTiming', 'emotionalDiscipline'];
  
  for (const field of requiredFields) {
    const value = metrics[field as keyof ProcessMetrics] as number;
    
    if (value === undefined || value === null) {
      errors.push(`${field} is required`);
    } else if (typeof value !== 'number') {
      errors.push(`${field} must be a number`);
    } else if (value < 1 || value > 5) {
      errors.push(`${field} must be between 1 and 5`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Get process score color class for UI
 */
export const getProcessScoreColor = (score: number): string => {
  if (score >= 80) return 'green';
  if (score >= 60) return 'yellow';
  if (score >= 40) return 'orange';
  return 'red';
};

/**
 * Get process score description
 */
export const getProcessScoreDescription = (score: number): string => {
  if (score >= 80) return 'Excellent process execution';
  if (score >= 60) return 'Good process with minor improvements needed';
  if (score >= 40) return 'Fair process with significant room for improvement';
  return 'Poor process execution - focus on rebuilding discipline';
};