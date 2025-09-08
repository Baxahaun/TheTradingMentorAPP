import React, { useState, useEffect } from 'react';
import { ProcessMetrics } from '../../types/journal';
import { 
  createProcessMetrics, 
  validateProcessMetrics, 
  generateProcessInsights 
} from '../../utils/processMetricsUtils';
import { Trade } from '../../types/trade';

interface ProcessMetricsEditorProps {
  initialMetrics?: Partial<ProcessMetrics>;
  trades?: Trade[];
  onSave: (metrics: ProcessMetrics) => void;
  onCancel?: () => void;
  className?: string;
}

export const ProcessMetricsEditor: React.FC<ProcessMetricsEditorProps> = ({
  initialMetrics = {},
  trades = [],
  onSave,
  onCancel,
  className = ''
}) => {
  const [metrics, setMetrics] = useState({
    planAdherence: initialMetrics.planAdherence || 3,
    riskManagement: initialMetrics.riskManagement || 3,
    entryTiming: initialMetrics.entryTiming || 3,
    exitTiming: initialMetrics.exitTiming || 3,
    emotionalDiscipline: initialMetrics.emotionalDiscipline || 3
  });

  const [processNotes, setProcessNotes] = useState(initialMetrics.processNotes || '');
  const [improvementAreas, setImprovementAreas] = useState<string[]>(
    initialMetrics.improvementAreas || []
  );
  const [strengthsIdentified, setStrengthsIdentified] = useState<string[]>(
    initialMetrics.strengthsIdentified || []
  );
  const [newImprovementArea, setNewImprovementArea] = useState('');
  const [newStrength, setNewStrength] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  // Auto-generate insights when metrics change
  useEffect(() => {
    if (trades.length > 0) {
      const tempMetrics = createProcessMetrics(
        metrics.planAdherence,
        metrics.riskManagement,
        metrics.entryTiming,
        metrics.exitTiming,
        metrics.emotionalDiscipline,
        processNotes
      );
      
      const insights = generateProcessInsights(tempMetrics, trades);
      
      // Auto-populate improvement areas if empty
      if (improvementAreas.length === 0 && insights.recommendations.length > 0) {
        setImprovementAreas(insights.recommendations.slice(0, 3));
      }
    }
  }, [metrics, trades, processNotes, improvementAreas.length]);

  const handleMetricChange = (metric: keyof typeof metrics, value: number) => {
    setMetrics(prev => ({ ...prev, [metric]: value }));
    setErrors([]); // Clear errors when user makes changes
  };

  const handleSave = () => {
    const validation = validateProcessMetrics(metrics);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    const completeMetrics = createProcessMetrics(
      metrics.planAdherence,
      metrics.riskManagement,
      metrics.entryTiming,
      metrics.exitTiming,
      metrics.emotionalDiscipline,
      processNotes,
      initialMetrics.mistakesMade,
      initialMetrics.successfulExecutions,
      improvementAreas,
      strengthsIdentified
    );

    onSave(completeMetrics);
  };

  const addImprovementArea = () => {
    if (newImprovementArea.trim() && !improvementAreas.includes(newImprovementArea.trim())) {
      setImprovementAreas(prev => [...prev, newImprovementArea.trim()]);
      setNewImprovementArea('');
    }
  };

  const removeImprovementArea = (index: number) => {
    setImprovementAreas(prev => prev.filter((_, i) => i !== index));
  };

  const addStrength = () => {
    if (newStrength.trim() && !strengthsIdentified.includes(newStrength.trim())) {
      setStrengthsIdentified(prev => [...prev, newStrength.trim()]);
      setNewStrength('');
    }
  };

  const removeStrength = (index: number) => {
    setStrengthsIdentified(prev => prev.filter((_, i) => i !== index));
  };

  const getScoreColor = (value: number): string => {
    if (value >= 4) return 'text-green-600';
    if (value >= 3) return 'text-yellow-600';
    if (value >= 2) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreDescription = (value: number): string => {
    switch (value) {
      case 5: return 'Excellent';
      case 4: return 'Good';
      case 3: return 'Average';
      case 2: return 'Below Average';
      case 1: return 'Poor';
      default: return 'Not Rated';
    }
  };

  const metricDescriptions = {
    planAdherence: 'How well did you stick to your predetermined trading plan?',
    riskManagement: 'How disciplined were you with position sizing and stop losses?',
    entryTiming: 'How well-timed were your trade entries based on your criteria?',
    exitTiming: 'How effectively did you manage your trade exits?',
    emotionalDiscipline: 'How well did you control emotions and avoid impulsive decisions?'
  };

  const formatMetricName = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Process Metrics Assessment</h3>
        
        {/* Error Display */}
        {errors.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="text-sm font-medium text-red-800 mb-1">Please fix the following errors:</h4>
            <ul className="text-sm text-red-700 list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Process Metrics Rating */}
        <div className="space-y-6">
          {Object.entries(metrics).map(([key, value]) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-900">
                  {formatMetricName(key)}
                </label>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${getScoreColor(value)}`}>
                    {value}/5
                  </span>
                  <span className="text-xs text-gray-500">
                    ({getScoreDescription(value)})
                  </span>
                </div>
              </div>
              
              <p className="text-xs text-gray-600">
                {metricDescriptions[key as keyof typeof metricDescriptions]}
              </p>
              
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => handleMetricChange(key as keyof typeof metrics, rating)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      value >= rating
                        ? rating >= 4 ? 'bg-green-500 border-green-500 text-white' :
                          rating >= 3 ? 'bg-yellow-500 border-yellow-500 text-white' :
                          rating >= 2 ? 'bg-orange-500 border-orange-500 text-white' :
                          'bg-red-500 border-red-500 text-white'
                        : 'border-gray-300 text-gray-400 hover:border-gray-400'
                    }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Process Notes */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Process Notes (Optional)
          </label>
          <textarea
            value={processNotes}
            onChange={(e) => setProcessNotes(e.target.value)}
            placeholder="Add any specific observations about your process execution today..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
          />
        </div>

        {/* Improvement Areas */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Areas for Improvement
          </label>
          
          <div className="flex space-x-2 mb-3">
            <input
              type="text"
              value={newImprovementArea}
              onChange={(e) => setNewImprovementArea(e.target.value)}
              placeholder="Add an area for improvement..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && addImprovementArea()}
            />
            <button
              onClick={addImprovementArea}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Add
            </button>
          </div>
          
          <div className="space-y-2">
            {improvementAreas.map((area, index) => (
              <div key={index} className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-lg p-2">
                <span className="text-sm text-orange-800">{area}</span>
                <button
                  onClick={() => removeImprovementArea(index)}
                  className="text-orange-600 hover:text-orange-800"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Strengths */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Strengths Identified
          </label>
          
          <div className="flex space-x-2 mb-3">
            <input
              type="text"
              value={newStrength}
              onChange={(e) => setNewStrength(e.target.value)}
              placeholder="Add a strength you demonstrated..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && addStrength()}
            />
            <button
              onClick={addStrength}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Add
            </button>
          </div>
          
          <div className="space-y-2">
            {strengthsIdentified.map((strength, index) => (
              <div key={index} className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-2">
                <span className="text-sm text-green-800">{strength}</span>
                <button
                  onClick={() => removeStrength(index)}
                  className="text-green-600 hover:text-green-800"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-end space-x-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Save Process Metrics
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProcessMetricsEditor;