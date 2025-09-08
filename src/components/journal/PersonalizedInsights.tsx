import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  Lightbulb, 
  TrendingUp, 
  Brain, 
  Target,
  Calendar,
  AlertTriangle,
  CheckCircle,
  X,
  ChevronRight,
  Star,
  Clock
} from 'lucide-react';
import { PersonalizedInsight } from '../../services/JournalAnalyticsService';

interface PersonalizedInsightsProps {
  insights: PersonalizedInsight[];
}

export const PersonalizedInsights: React.FC<PersonalizedInsightsProps> = ({
  insights
}) => {
  const [dismissedInsights, setDismissedInsights] = useState<Set<string>>(new Set());
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'consistency':
        return <Calendar className="h-5 w-5" />;
      case 'emotional':
        return <Brain className="h-5 w-5" />;
      case 'process':
        return <Target className="h-5 w-5" />;
      case 'performance':
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <Lightbulb className="h-5 w-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleDismissInsight = (insightId: string) => {
    setDismissedInsights(prev => new Set([...prev, insightId]));
  };

  const handleToggleExpand = (insightId: string) => {
    setExpandedInsight(expandedInsight === insightId ? null : insightId);
  };

  const visibleInsights = insights.filter(insight => !dismissedInsights.has(insight.id));

  if (visibleInsights.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Insights</h3>
            <p className="text-gray-600">
              Continue journaling to generate personalized insights and recommendations.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Lightbulb className="h-5 w-5 mr-2" />
            Personalized Insights
          </div>
          <Badge variant="secondary">
            {visibleInsights.length} active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {visibleInsights.map((insight) => (
            <div
              key={insight.id}
              className={`border-l-4 rounded-lg p-4 ${getPriorityColor(insight.priority)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="text-gray-600 mt-1">
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                      <Badge className={`text-xs ${getPriorityBadgeColor(insight.priority)}`}>
                        {insight.priority}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span className={`text-xs ${getConfidenceColor(insight.confidence)}`}>
                          {(insight.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 text-sm mb-3">{insight.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleExpand(insight.id)}
                          className="text-blue-600 hover:text-blue-700 p-0 h-auto"
                        >
                          <span className="text-sm">View Details</span>
                          <ChevronRight 
                            className={`h-4 w-4 ml-1 transition-transform ${
                              expandedInsight === insight.id ? 'rotate-90' : ''
                            }`} 
                          />
                        </Button>
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(insight.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDismissInsight(insight.id)}
                        className="text-gray-400 hover:text-gray-600 p-1 h-auto"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {expandedInsight === insight.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="space-y-3">
                          <div>
                            <h5 className="font-medium text-gray-900 mb-2">Recommendation</h5>
                            <div className="flex items-start space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-gray-700">{insight.recommendation}</p>
                            </div>
                          </div>

                          {insight.dataPoints && insight.dataPoints.length > 0 && (
                            <div>
                              <h5 className="font-medium text-gray-900 mb-2">Supporting Data</h5>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {insight.dataPoints.slice(0, 4).map((point, index) => (
                                  <div key={index} className="bg-white p-2 rounded border text-center">
                                    <p className="text-lg font-semibold text-gray-900">
                                      {typeof point === 'number' ? point.toFixed(1) : point}
                                    </p>
                                    <p className="text-xs text-gray-600">Data Point {index + 1}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs">
                                {insight.type}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                Confidence: {(insight.confidence * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Insight Categories Summary */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Insight Categories</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['consistency', 'emotional', 'process', 'performance'].map((type) => {
              const typeInsights = visibleInsights.filter(i => i.type === type);
              const highPriorityCount = typeInsights.filter(i => i.priority === 'high').length;
              
              return (
                <div key={type} className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-gray-600 mb-1">
                    {getInsightIcon(type)}
                  </div>
                  <p className="text-sm font-medium text-gray-900 capitalize">{type}</p>
                  <p className="text-xs text-gray-600">
                    {typeInsights.length} insight{typeInsights.length !== 1 ? 's' : ''}
                  </p>
                  {highPriorityCount > 0 && (
                    <Badge variant="destructive" className="text-xs mt-1">
                      {highPriorityCount} high priority
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Items */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Recommended Actions</h4>
          <div className="space-y-2">
            {visibleInsights
              .filter(i => i.priority === 'high')
              .slice(0, 3)
              .map((insight, index) => (
                <div key={insight.id} className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{insight.title}</p>
                    <p className="text-xs text-gray-600">{insight.recommendation}</p>
                  </div>
                </div>
              ))}
          </div>
          
          {visibleInsights.filter(i => i.priority === 'high').length === 0 && (
            <div className="text-center py-4">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No high-priority actions needed right now!</p>
            </div>
          )}
        </div>

        {/* Tips for Better Insights */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Getting Better Insights</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Improve Data Quality</h5>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Complete daily journal entries consistently</li>
                <li>• Track emotions and process metrics accurately</li>
                <li>• Include detailed trade reflections</li>
              </ul>
            </div>
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Enhance Analysis</h5>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Journal for at least 2-3 weeks for patterns</li>
                <li>• Be honest about emotional states</li>
                <li>• Review and act on insights regularly</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalizedInsights;