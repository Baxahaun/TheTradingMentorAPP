import React, { useState } from 'react';
import { ReviewWorkflowPanel } from '../index';
import { EnhancedTrade, ReviewWorkflow, TradeReviewMode } from '../../../types/tradeReview';

/**
 * Example usage of ReviewWorkflowPanel component
 * This demonstrates how to integrate the workflow panel into a trade review system
 */
const ReviewWorkflowPanelExample: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<TradeReviewMode>('view');
  
  // Example trade with review workflow
  const [exampleTrade, setExampleTrade] = useState<EnhancedTrade>({
    id: 'example-trade-1',
    currencyPair: 'EUR/USD',
    date: '2024-01-15',
    timeIn: '10:30',
    side: 'long',
    entryPrice: 1.0950,
    exitPrice: 1.0980,
    lotSize: 1.0,
    lotType: 'standard',
    accountId: 'demo-account',
    accountCurrency: 'USD',
    pnl: 300,
    pips: 30,
    commission: 7,
    stopLoss: 1.0920,
    takeProfit: 1.1000,
    riskAmount: 300,
    confidence: 4,
    status: 'closed',
    reviewData: {
      reviewWorkflow: {
        tradeId: 'example-trade-1',
        stages: [
          {
            id: 'data_verification',
            name: 'Data Verification',
            description: 'Verify all trade data is accurate and complete',
            required: true,
            completed: true,
            completedAt: '2024-01-15T11:00:00Z',
            notes: 'All trade data verified. Entry and exit prices match broker records.'
          },
          {
            id: 'technical_analysis',
            name: 'Technical Analysis Review',
            description: 'Review charts, patterns, and technical setup',
            required: true,
            completed: false
          },
          {
            id: 'execution_analysis',
            name: 'Execution Analysis',
            description: 'Analyze trade execution and timing',
            required: true,
            completed: false
          },
          {
            id: 'risk_management',
            name: 'Risk Management Review',
            description: 'Review risk management and position sizing',
            required: true,
            completed: false
          },
          {
            id: 'lessons_learned',
            name: 'Lessons Learned',
            description: 'Document key takeaways and improvements',
            required: false,
            completed: false
          }
        ],
        overallProgress: 20,
        startedAt: '2024-01-15T10:45:00Z'
      }
    }
  });

  // Handle workflow updates
  const handleWorkflowUpdate = (updatedWorkflow: ReviewWorkflow) => {
    setExampleTrade(prev => ({
      ...prev,
      reviewData: {
        ...prev.reviewData,
        reviewWorkflow: updatedWorkflow,
        lastReviewedAt: new Date().toISOString()
      }
    }));
    
    console.log('Workflow updated:', updatedWorkflow);
  };

  // Handle mode changes
  const handleModeChange = (mode: TradeReviewMode) => {
    setCurrentMode(mode);
    console.log('Mode changed to:', mode);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Review Workflow Panel Example
        </h1>
        <p className="text-gray-600 mb-6">
          This example demonstrates the ReviewWorkflowPanel component with a sample trade.
          You can interact with the workflow stages to see how the component behaves.
        </p>
        
        {/* Mode Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Mode:
          </label>
          <div className="flex gap-2">
            {(['view', 'edit', 'review'] as TradeReviewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setCurrentMode(mode)}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  currentMode === mode
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Trade Summary */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Trade Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Pair:</span>
              <span className="ml-2 font-medium">{exampleTrade.currencyPair}</span>
            </div>
            <div>
              <span className="text-gray-500">Side:</span>
              <span className="ml-2 font-medium capitalize">{exampleTrade.side}</span>
            </div>
            <div>
              <span className="text-gray-500">P&L:</span>
              <span className={`ml-2 font-medium ${(exampleTrade.pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${exampleTrade.pnl}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Status:</span>
              <span className="ml-2 font-medium">{exampleTrade.status}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Review Workflow Panel */}
      <ReviewWorkflowPanel
        trade={exampleTrade}
        currentMode={currentMode}
        onWorkflowUpdate={handleWorkflowUpdate}
        onModeChange={handleModeChange}
      />

      {/* Debug Information */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Debug Information</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <div>Current Mode: <span className="font-mono">{currentMode}</span></div>
          <div>
            Progress: <span className="font-mono">
              {exampleTrade.reviewData?.reviewWorkflow?.overallProgress || 0}%
            </span>
          </div>
          <div>
            Completed Stages: <span className="font-mono">
              {exampleTrade.reviewData?.reviewWorkflow?.stages.filter(s => s.completed).length || 0}
            </span>
          </div>
          <div>
            Review Complete: <span className="font-mono">
              {exampleTrade.reviewData?.reviewWorkflow?.completedAt ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewWorkflowPanelExample;