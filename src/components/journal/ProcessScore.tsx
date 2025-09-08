import React from 'react';
import { ProcessMetrics } from '../../types/journal';
import { JOURNAL_CONSTANTS } from '../../types/journal';

interface ProcessScoreProps {
  processMetrics: ProcessMetrics;
  className?: string;
  showDetails?: boolean;
}

export const ProcessScore: React.FC<ProcessScoreProps> = ({
  processMetrics,
  className = '',
  showDetails = true
}) => {
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (score >= 40) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excellent Process';
    if (score >= 60) return 'Good Process';
    if (score >= 40) return 'Fair Process';
    return 'Needs Improvement';
  };

  const getMetricColor = (value: number): string => {
    if (value >= 4) return 'text-green-600';
    if (value >= 3) return 'text-yellow-600';
    if (value >= 2) return 'text-orange-600';
    return 'text-red-600';
  };

  const formatMetricName = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
      {/* Header with Process Score */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Process Score</h3>
          <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getScoreColor(processMetrics.processScore)}`}>
            {processMetrics.processScore}/100
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {getScoreLabel(processMetrics.processScore)} - Focus on execution quality over outcomes
        </p>
      </div>

      {/* Process Score Visualization */}
      <div className="p-4">
        <div className="relative">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Poor</span>
            <span>Fair</span>
            <span>Good</span>
            <span>Excellent</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                processMetrics.processScore >= 80 ? 'bg-green-500' :
                processMetrics.processScore >= 60 ? 'bg-yellow-500' :
                processMetrics.processScore >= 40 ? 'bg-orange-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(processMetrics.processScore, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0</span>
            <span>25</span>
            <span>50</span>
            <span>75</span>
            <span>100</span>
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      {showDetails && (
        <div className="p-4 border-t bg-gray-50">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Process Breakdown</h4>
          <div className="space-y-3">
            {Object.entries(JOURNAL_CONSTANTS.PROCESS_SCORE_WEIGHTS).map(([key, weight]) => {
              const value = processMetrics[key as keyof typeof JOURNAL_CONSTANTS.PROCESS_SCORE_WEIGHTS] || 0;
              const percentage = (value / 5) * 100;
              
              return (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700">{formatMetricName(key)}</span>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${getMetricColor(value)}`}>
                          {value}/5
                        </span>
                        <span className="text-xs text-gray-500">
                          ({Math.round(weight * 100)}%)
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          value >= 4 ? 'bg-green-500' :
                          value >= 3 ? 'bg-yellow-500' :
                          value >= 2 ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Overall Discipline Score */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">Overall Discipline</span>
              <span className={`text-sm font-semibold ${getMetricColor(processMetrics.overallDiscipline)}`}>
                {processMetrics.overallDiscipline.toFixed(1)}/5
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Process Notes */}
      {processMetrics.processNotes && (
        <div className="p-4 border-t">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Process Notes</h4>
          <p className="text-sm text-gray-600">{processMetrics.processNotes}</p>
        </div>
      )}

      {/* Improvement Areas */}
      {processMetrics.improvementAreas && processMetrics.improvementAreas.length > 0 && (
        <div className="p-4 border-t">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Areas for Improvement</h4>
          <ul className="space-y-1">
            {processMetrics.improvementAreas.map((area, index) => (
              <li key={index} className="text-sm text-orange-600 flex items-center">
                <span className="w-1.5 h-1.5 bg-orange-400 rounded-full mr-2" />
                {area}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Strengths */}
      {processMetrics.strengthsIdentified && processMetrics.strengthsIdentified.length > 0 && (
        <div className="p-4 border-t">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Strengths Identified</h4>
          <ul className="space-y-1">
            {processMetrics.strengthsIdentified.map((strength, index) => (
              <li key={index} className="text-sm text-green-600 flex items-center">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2" />
                {strength}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ProcessScore;