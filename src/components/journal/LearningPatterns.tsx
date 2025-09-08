import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  Plus,
  X,
  Calendar,
  BarChart3
} from 'lucide-react';
import { LearningPattern, ReflectionAnalytics } from '../../types/reflection';
import { reflectionService } from '../../services/ReflectionService';

interface LearningPatternsProps {
  userId: string;
  onPatternClick?: (pattern: LearningPattern) => void;
}

export const LearningPatterns: React.FC<LearningPatternsProps> = ({
  userId,
  onPatternClick
}) => {
  const [patterns, setPatterns] = useState<LearningPattern[]>([]);
  const [analytics, setAnalytics] = useState<ReflectionAnalytics | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<LearningPattern | null>(null);
  const [newActionItem, setNewActionItem] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [patternsData, analyticsData] = await Promise.all([
        reflectionService.getLearningPatterns(userId),
        reflectionService.getReflectionAnalytics(userId)
      ]);
      
      setPatterns(patternsData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading learning patterns:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryIcon = (category: LearningPattern['category']) => {
    switch (category) {
      case 'strength': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'weakness': return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'opportunity': return <Target className="h-4 w-4 text-blue-600" />;
      case 'insight': return <Lightbulb className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getCategoryColor = (category: LearningPattern['category']) => {
    switch (category) {
      case 'strength': return 'bg-green-100 text-green-800 border-green-200';
      case 'weakness': return 'bg-red-100 text-red-800 border-red-200';
      case 'opportunity': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'insight': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getFrequencyLevel = (frequency: number) => {
    if (frequency >= 10) return { level: 'Very High', color: 'text-red-600' };
    if (frequency >= 5) return { level: 'High', color: 'text-orange-600' };
    if (frequency >= 3) return { level: 'Medium', color: 'text-yellow-600' };
    return { level: 'Low', color: 'text-green-600' };
  };

  const addActionItem = (patternId: string) => {
    if (!newActionItem.trim()) return;

    const updatedPatterns = patterns.map(pattern => {
      if (pattern.id === patternId) {
        return {
          ...pattern,
          actionItems: [...pattern.actionItems, newActionItem.trim()]
        };
      }
      return pattern;
    });

    setPatterns(updatedPatterns);
    setNewActionItem('');
    
    // In a real implementation, this would save to Firebase
    localStorage.setItem(`learning-patterns-${userId}`, JSON.stringify(updatedPatterns));
  };

  const removeActionItem = (patternId: string, actionIndex: number) => {
    const updatedPatterns = patterns.map(pattern => {
      if (pattern.id === patternId) {
        return {
          ...pattern,
          actionItems: pattern.actionItems.filter((_, index) => index !== actionIndex)
        };
      }
      return pattern;
    });

    setPatterns(updatedPatterns);
    localStorage.setItem(`learning-patterns-${userId}`, JSON.stringify(updatedPatterns));
  };

  const markPatternResolved = (patternId: string) => {
    const updatedPatterns = patterns.map(pattern => {
      if (pattern.id === patternId) {
        return { ...pattern, isResolved: !pattern.isResolved };
      }
      return pattern;
    });

    setPatterns(updatedPatterns);
    localStorage.setItem(`learning-patterns-${userId}`, JSON.stringify(updatedPatterns));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activePatterns = patterns.filter(p => !p.isResolved);
  const resolvedPatterns = patterns.filter(p => p.isResolved);

  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Learning Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {analytics.totalReflections}
                </div>
                <div className="text-sm text-gray-600">Total Reflections</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {analytics.consistencyScore}%
                </div>
                <div className="text-sm text-gray-600">Consistency Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {analytics.reflectionStreak}
                </div>
                <div className="text-sm text-gray-600">Day Streak</div>
              </div>
            </div>

            {analytics.mostCommonThemes.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Most Common Themes</h4>
                <div className="flex flex-wrap gap-2">
                  {analytics.mostCommonThemes.slice(0, 5).map(({ theme, count }) => (
                    <Badge key={theme} variant="outline">
                      {theme} ({count})
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Active Patterns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Active Learning Patterns
            <Badge variant="outline">{activePatterns.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activePatterns.length === 0 ? (
            <div className="text-center py-8">
              <Lightbulb className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Patterns</h3>
              <p className="text-gray-600">
                Keep reflecting on your trades to identify learning patterns and areas for improvement.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activePatterns.map((pattern) => {
                const frequencyInfo = getFrequencyLevel(pattern.frequency);
                
                return (
                  <div
                    key={pattern.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                      selectedPattern?.id === pattern.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => {
                      setSelectedPattern(selectedPattern?.id === pattern.id ? null : pattern);
                      onPatternClick?.(pattern);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getCategoryIcon(pattern.category)}
                          <Badge className={getCategoryColor(pattern.category)}>
                            {pattern.category}
                          </Badge>
                          <Badge variant="outline" className={frequencyInfo.color}>
                            {pattern.frequency}x - {frequencyInfo.level}
                          </Badge>
                        </div>
                        
                        <h3 className="font-medium text-gray-900 mb-1 capitalize">
                          {pattern.theme.replace('-', ' ')}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {pattern.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            First: {new Date(pattern.firstOccurrence).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Last: {new Date(pattern.lastOccurrence).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        variant={pattern.isResolved ? "outline" : "default"}
                        onClick={(e) => {
                          e.stopPropagation();
                          markPatternResolved(pattern.id);
                        }}
                      >
                        {pattern.isResolved ? (
                          <>
                            <X className="h-4 w-4 mr-1" />
                            Reopen
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Resolve
                          </>
                        )}
                      </Button>
                    </div>

                    {selectedPattern?.id === pattern.id && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="font-medium text-gray-900 mb-2">Action Items</h4>
                        
                        {pattern.actionItems.length > 0 && (
                          <div className="space-y-2 mb-3">
                            {pattern.actionItems.map((item, index) => (
                              <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                <span className="text-sm">{item}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeActionItem(pattern.id, index);
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <Textarea
                            value={newActionItem}
                            onChange={(e) => setNewActionItem(e.target.value)}
                            placeholder="Add an action item to address this pattern..."
                            className="flex-1"
                            rows={2}
                          />
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              addActionItem(pattern.id);
                            }}
                            disabled={!newActionItem.trim()}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resolved Patterns */}
      {resolvedPatterns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Resolved Patterns
              <Badge variant="outline">{resolvedPatterns.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {resolvedPatterns.map((pattern) => (
                <div
                  key={pattern.id}
                  className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(pattern.category)}
                    <span className="font-medium capitalize">
                      {pattern.theme.replace('-', ' ')}
                    </span>
                    <Badge variant="outline" className="text-green-600">
                      {pattern.frequency}x resolved
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => markPatternResolved(pattern.id)}
                  >
                    Reopen
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};