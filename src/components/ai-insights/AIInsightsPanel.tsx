/**
 * AI Insights Panel Component
 * 
 * Displays AI-generated insights, patterns, and optimization suggestions
 * for strategy performance analysis.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  StrategyInsight, 
  PerformancePattern, 
  OptimizationSuggestion, 
  MarketCorrelation,
  ProfessionalStrategy 
} from '../../types/strategy';
import { Trade } from '../../types/trade';
import { AIInsightsService } from '../../services/AIInsightsService';

interface AIInsightsPanelProps {
  strategy?: ProfessionalStrategy;
  strategies?: ProfessionalStrategy[];
  trades?: Trade[];
  className?: string;
  onOptimizationSelect?: (suggestion: OptimizationSuggestion) => void;
}

type InsightTab = 'insights' | 'patterns' | 'optimizations' | 'correlations';

const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({
  strategy,
  strategies = [],
  trades = [],
  className = '',
  onOptimizationSelect
}) => {
  const [activeTab, setActiveTab] = useState<InsightTab>('insights');
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<StrategyInsight[]>([]);
  const [patterns, setPatterns] = useState<PerformancePattern[]>([]);
  const [optimizations, setOptimizations] = useState<OptimizationSuggestion[]>([]);
  const [correlations, setCorrelations] = useState<MarketCorrelation[]>([]);

  const aiService = useMemo(() => new AIInsightsService(), []);

  // Generate insights when strategy or trades change
  useEffect(() => {
    if (strategy && trades.length > 0) {
      generateInsights();
    }
  }, [strategy, trades]);

  const generateInsights = async () => {
    if (!strategy) return;

    setLoading(true);
    try {
      // Generate strategy-specific insights
      const strategyInsights = aiService.generateStrategyInsights(strategy, trades);
      setInsights(strategyInsights);

      // Generate optimization suggestions
      const optimizationSuggestions = aiService.suggestOptimizations(strategy);
      setOptimizations(optimizationSuggestions);

      // Generate market correlations
      const marketCorrelations = aiService.detectMarketConditionCorrelations(strategy.id);
      setCorrelations(marketCorrelations);

      // Generate patterns across strategies
      if (strategies.length > 0) {
        const performancePatterns = aiService.identifyPerformancePatterns(strategies);
        setPatterns(performancePatterns);
      }
    } catch (error) {
      console.error('Error generating AI insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-50 border-red-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderInsights = () => (
    <div className="space-y-4">
      {insights.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {loading ? 'Generating insights...' : 'No insights available. Need more trade data.'}
        </div>
      ) : (
        insights.map((insight, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${getPriorityColor(insight.priority)}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium px-2 py-1 rounded bg-white bg-opacity-50">
                  {insight.type}
                </span>
                <span className="text-sm font-medium px-2 py-1 rounded bg-white bg-opacity-50">
                  {insight.priority} Priority
                </span>
              </div>
              <span className={`text-sm font-medium ${getConfidenceColor(insight.confidence)}`}>
                {insight.confidence}% confidence
              </span>
            </div>
            <p className="text-sm mb-2">{insight.message}</p>
            {insight.actionable && (
              <div className="flex items-center text-xs text-gray-600">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Actionable insight
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );

  const renderPatterns = () => (
    <div className="space-y-4">
      {patterns.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {loading ? 'Analyzing patterns...' : 'No significant patterns detected across strategies.'}
        </div>
      ) : (
        patterns.map((pattern, index) => (
          <div key={index} className="p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium px-2 py-1 rounded bg-blue-100 text-blue-800">
                  {pattern.type}
                </span>
                <span className={`text-sm font-medium ${getConfidenceColor(pattern.confidence)}`}>
                  {pattern.confidence}% confidence
                </span>
              </div>
              <span className={`text-sm font-medium px-2 py-1 rounded ${
                pattern.impact > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {pattern.impact > 0 ? '+' : ''}{pattern.impact.toFixed(1)}% impact
              </span>
            </div>
            <h4 className="font-medium text-gray-900 mb-1">{pattern.pattern}</h4>
            <p className="text-sm text-gray-600">{pattern.description}</p>
          </div>
        ))
      )}
    </div>
  );

  const renderOptimizations = () => (
    <div className="space-y-4">
      {optimizations.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {loading ? 'Generating optimization suggestions...' : 'No optimization suggestions available.'}
        </div>
      ) : (
        optimizations.map((optimization, index) => (
          <div key={index} className="p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium px-2 py-1 rounded bg-purple-100 text-purple-800">
                  {optimization.category}
                </span>
                <span className="text-sm font-medium px-2 py-1 rounded bg-gray-100 text-gray-800">
                  {optimization.implementationDifficulty}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-green-600">
                  +{optimization.expectedImprovement}% improvement
                </div>
                <div className={`text-xs ${getConfidenceColor(optimization.confidence)}`}>
                  {optimization.confidence}% confidence
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-900 mb-2">{optimization.suggestion}</p>
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Required data: {optimization.requiredData.join(', ')}
              </div>
              {onOptimizationSelect && (
                <button
                  onClick={() => onOptimizationSelect(optimization)}
                  className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                >
                  Apply Suggestion
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderCorrelations = () => (
    <div className="space-y-4">
      {correlations.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {loading ? 'Analyzing market correlations...' : 'No significant market correlations detected.'}
        </div>
      ) : (
        correlations.map((correlation, index) => (
          <div key={index} className="p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-gray-900">{correlation.condition}</h4>
              <div className="text-right">
                <div className={`text-sm font-medium ${
                  correlation.correlation > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {correlation.correlation > 0 ? '+' : ''}{(correlation.correlation * 100).toFixed(0)}% correlation
                </div>
                <div className="text-xs text-gray-500">
                  {correlation.significance}% significance
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3">{correlation.description}</p>
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-700">Recommendations:</div>
              {correlation.recommendations.map((rec, recIndex) => (
                <div key={recIndex} className="text-xs text-gray-600 flex items-start">
                  <span className="mr-1">•</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );

  const tabs = [
    { id: 'insights', label: 'Insights', count: insights.length },
    { id: 'patterns', label: 'Patterns', count: patterns.length },
    { id: 'optimizations', label: 'Optimizations', count: optimizations.length },
    { id: 'correlations', label: 'Market Correlations', count: correlations.length }
  ];

  return (
    <div className={`bg-gray-50 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
          {strategy && (
            <button
              onClick={generateInsights}
              disabled={loading}
              className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Analyzing...' : 'Refresh Insights'}
            </button>
          )}
        </div>
        {strategy && (
          <p className="text-sm text-gray-600 mt-1">
            Analysis for "{strategy.title}" based on {trades.length} trades
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-4" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as InsightTab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-4">
        {!strategy ? (
          <div className="text-center py-8 text-gray-500">
            Select a strategy to view AI insights and recommendations.
          </div>
        ) : (
          <>
            {activeTab === 'insights' && renderInsights()}
            {activeTab === 'patterns' && renderPatterns()}
            {activeTab === 'optimizations' && renderOptimizations()}
            {activeTab === 'correlations' && renderCorrelations()}
          </>
        )}
      </div>
    </div>
  );
};

export default AIInsightsPanel;