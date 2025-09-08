import React, { useState } from 'react';
import { ProcessMetrics } from '../../types/journal';
import { Trade } from '../../types/trade';
import ProcessScore from './ProcessScore';
import PnLSummary from './PnLSummary';
import { generateProcessInsights } from '../../utils/processMetricsUtils';

interface PerformanceMetricsProps {
  processMetrics: ProcessMetrics;
  dailyPnL: number;
  trades: Trade[];
  accountCurrency?: string;
  onUpdateProcessMetrics?: (metrics: ProcessMetrics) => void;
  className?: string;
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({
  processMetrics,
  dailyPnL,
  trades,
  accountCurrency = 'USD',
  onUpdateProcessMetrics,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'process' | 'pnl' | 'insights'>('overview');
  
  const insights = generateProcessInsights(processMetrics, trades);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'process', label: 'Process Score', icon: '⚡' },
    { id: 'pnl', label: 'P&L Analysis', icon: '💰' },
    { id: 'insights', label: 'Insights', icon: '💡' }
  ];

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
      {/* Header with Tabs */}
      <div className="border-b">
        <div className="p-4 pb-0">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Metrics</h2>
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Process Score</p>
                    <p className="text-2xl font-bold text-blue-900">{processMetrics.processScore}/100</p>
                  </div>
                  <div className="text-2xl">⚡</div>
                </div>
              </div>
              
              <div className={`rounded-lg p-4 ${
                dailyPnL > 0 ? 'bg-gradient-to-r from-green-50 to-green-100' :
                dailyPnL < 0 ? 'bg-gradient-to-r from-red-50 to-red-100' :
                'bg-gradient-to-r from-gray-50 to-gray-100'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${
                      dailyPnL > 0 ? 'text-green-600' :
                      dailyPnL < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      Daily P&L
                    </p>
                    <p className={`text-2xl font-bold ${
                      dailyPnL > 0 ? 'text-green-900' :
                      dailyPnL < 0 ? 'text-red-900' : 'text-gray-900'
                    }`}>
                      {dailyPnL > 0 ? '+' : ''}{accountCurrency === 'USD' ? '$' : accountCurrency + ' '}{Math.abs(dailyPnL).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-2xl">💰</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Trades</p>
                    <p className="text-2xl font-bold text-purple-900">{trades.length}</p>
                  </div>
                  <div className="text-2xl">📈</div>
                </div>
              </div>
            </div>

            {/* Key Insight */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="text-2xl">💡</div>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-900">Key Insight</h4>
                  <p className="text-sm text-blue-800 mt-1">{insights.keyInsight}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setActiveTab('process')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Review Process Score</h4>
                    <p className="text-sm text-gray-600">Analyze execution quality</p>
                  </div>
                  <div className="text-xl">⚡</div>
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('insights')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">View Insights</h4>
                    <p className="text-sm text-gray-600">Get improvement recommendations</p>
                  </div>
                  <div className="text-xl">💡</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'process' && (
          <ProcessScore 
            processMetrics={processMetrics}
            showDetails={true}
          />
        )}

        {activeTab === 'pnl' && (
          <PnLSummary
            dailyPnL={dailyPnL}
            processMetrics={processMetrics}
            trades={trades}
            accountCurrency={accountCurrency}
          />
        )}

        {activeTab === 'insights' && (
          <div className="space-y-6">
            {/* Key Insight */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Today's Key Insight</h4>
              <p className="text-blue-800">{insights.keyInsight}</p>
            </div>

            {/* Recommendations */}
            {insights.recommendations.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Recommendations for Improvement</h4>
                <div className="space-y-2">
                  {insights.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                      </div>
                      <p className="ml-3 text-sm text-yellow-800">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Focus Areas */}
            {insights.focusAreas.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Primary Focus Areas</h4>
                <div className="flex flex-wrap gap-2">
                  {insights.focusAreas.map((area, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full border border-orange-200"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Process Strengths */}
            {processMetrics.strengthsIdentified && processMetrics.strengthsIdentified.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Strengths to Maintain</h4>
                <div className="space-y-2">
                  {processMetrics.strengthsIdentified.map((strength, index) => (
                    <div key={index} className="flex items-start bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      </div>
                      <p className="ml-3 text-sm text-green-800">{strength}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Process Mistakes */}
            {processMetrics.mistakesMade && processMetrics.mistakesMade.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Mistakes to Learn From</h4>
                <div className="space-y-3">
                  {processMetrics.mistakesMade.map((mistake) => (
                    <div key={mistake.id} className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-red-900 capitalize">
                            {mistake.category.replace('_', ' ')}
                          </h5>
                          <p className="text-sm text-red-800 mt-1">{mistake.description}</p>
                          {mistake.lesson && (
                            <p className="text-sm text-red-700 mt-2">
                              <strong>Lesson:</strong> {mistake.lesson}
                            </p>
                          )}
                          {mistake.preventionStrategy && (
                            <p className="text-sm text-red-700 mt-1">
                              <strong>Prevention:</strong> {mistake.preventionStrategy}
                            </p>
                          )}
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          mistake.impact === 'high' ? 'bg-red-200 text-red-800' :
                          mistake.impact === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                          'bg-gray-200 text-gray-800'
                        }`}>
                          {mistake.impact} impact
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Items */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Tomorrow's Action Items</h4>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input type="checkbox" className="mr-3 rounded" />
                  <span className="text-sm text-gray-700">Review today's process score and identify one area for improvement</span>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" className="mr-3 rounded" />
                  <span className="text-sm text-gray-700">Implement the top recommendation from today's analysis</span>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" className="mr-3 rounded" />
                  <span className="text-sm text-gray-700">Continue leveraging identified strengths</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceMetrics;