import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  TrendingUp, 
  Search, 
  Calendar,
  Target,
  Lightbulb,
  BarChart3,
  Clock
} from 'lucide-react';
import { GuidedReflection } from './GuidedReflection';
import { LearningPatterns } from './LearningPatterns';
import { ReflectionSearch } from './ReflectionSearch';
import { 
  ReflectionSession, 
  ReflectionResponse, 
  LearningPattern,
  ReflectionAnalytics 
} from '../../types/reflection';
import { JournalEntry, ProcessMetrics, EmotionalState } from '../../types/journal';
import { Trade } from '../../types/trade';
import { reflectionService } from '../../services/ReflectionService';

interface ReflectionDashboardProps {
  userId: string;
  date: string;
  journalEntry?: JournalEntry;
  trades?: Trade[];
  processMetrics?: ProcessMetrics;
  emotionalState?: EmotionalState;
  onReflectionComplete?: () => void;
}

export const ReflectionDashboard: React.FC<ReflectionDashboardProps> = ({
  userId,
  date,
  journalEntry,
  trades = [],
  processMetrics,
  emotionalState,
  onReflectionComplete
}) => {
  const [activeTab, setActiveTab] = useState('reflection');
  const [reflectionSession, setReflectionSession] = useState<ReflectionSession | null>(null);
  const [analytics, setAnalytics] = useState<ReflectionAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedResponse, setSelectedResponse] = useState<ReflectionResponse | null>(null);

  useEffect(() => {
    initializeReflectionSession();
    loadAnalytics();
  }, [userId, date, trades, processMetrics, emotionalState]);

  const initializeReflectionSession = async () => {
    if (!processMetrics || !emotionalState) return;

    setIsLoading(true);
    try {
      // Check if session already exists
      const existingSessionId = `reflection-${userId}-${date}`;
      let session = await reflectionService.getReflectionSession(existingSessionId);

      if (!session) {
        // Generate new session
        session = await reflectionService.generateReflectionSession(
          userId,
          date,
          trades,
          processMetrics,
          emotionalState
        );
        
        // Save the session
        localStorage.setItem(`reflection-session-${existingSessionId}`, JSON.stringify(session));
      }

      setReflectionSession(session);
    } catch (error) {
      console.error('Error initializing reflection session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const analyticsData = await reflectionService.getReflectionAnalytics(userId);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const handleSessionUpdate = (updatedSession: ReflectionSession) => {
    setReflectionSession(updatedSession);
    
    // Save updated session
    localStorage.setItem(
      `reflection-session-${updatedSession.id}`, 
      JSON.stringify(updatedSession)
    );

    // Reload analytics to reflect new data
    loadAnalytics();
  };

  const handleReflectionComplete = () => {
    onReflectionComplete?.();
    loadAnalytics(); // Refresh analytics after completion
  };

  const handlePatternClick = (pattern: LearningPattern) => {
    // Could navigate to detailed pattern view or show related reflections
    console.log('Pattern clicked:', pattern);
  };

  const handleSearchResultClick = (response: ReflectionResponse) => {
    setSelectedResponse(response);
    // Could show detailed view or navigate to the original journal entry
  };

  const getSessionStatus = () => {
    if (!reflectionSession) return null;
    
    const { completionStatus, responses, prompts } = reflectionSession;
    const completedCount = responses.length;
    const totalCount = prompts.length;
    
    return {
      status: completionStatus,
      progress: totalCount > 0 ? (completedCount / totalCount) * 100 : 0,
      completedCount,
      totalCount
    };
  };

  const sessionStatus = getSessionStatus();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Session Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Reflection & Learning Center
            </CardTitle>
            {sessionStatus && (
              <div className="flex items-center gap-2">
                <Badge 
                  variant={sessionStatus.status === 'completed' ? 'default' : 'outline'}
                  className={
                    sessionStatus.status === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : sessionStatus.status === 'in_progress'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }
                >
                  {sessionStatus.status === 'completed' && '✓ '}
                  {sessionStatus.completedCount}/{sessionStatus.totalCount} Complete
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>
        {analytics && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="text-sm font-medium">{analytics.totalReflections}</div>
                  <div className="text-xs text-gray-600">Total Reflections</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-green-600" />
                <div>
                  <div className="text-sm font-medium">{analytics.consistencyScore}%</div>
                  <div className="text-xs text-gray-600">Consistency</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <div>
                  <div className="text-sm font-medium">{analytics.reflectionStreak}</div>
                  <div className="text-xs text-gray-600">Day Streak</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <div>
                  <div className="text-sm font-medium">{analytics.learningPatterns.length}</div>
                  <div className="text-xs text-gray-600">Active Patterns</div>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reflection" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Daily Reflection
            {sessionStatus?.status === 'completed' && (
              <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 flex items-center justify-center">
                ✓
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="patterns" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Learning Patterns
            {analytics && analytics.learningPatterns.length > 0 && (
              <Badge variant="outline" className="ml-1">
                {analytics.learningPatterns.filter(p => !p.isResolved).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search & Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reflection" className="space-y-4">
          {reflectionSession ? (
            <GuidedReflection
              userId={userId}
              date={date}
              session={reflectionSession}
              onSessionUpdate={handleSessionUpdate}
              onComplete={handleReflectionComplete}
            />
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Reflection Not Available
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Complete your process metrics and emotional tracking to unlock guided reflection.
                  </p>
                  <Button variant="outline" onClick={initializeReflectionSession}>
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <LearningPatterns
            userId={userId}
            onPatternClick={handlePatternClick}
          />
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <ReflectionSearch
            userId={userId}
            onResultClick={handleSearchResultClick}
          />
        </TabsContent>
      </Tabs>

      {/* Selected Response Detail Modal */}
      {selectedResponse && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Reflection Detail</CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedResponse(null)}
              >
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-600 mb-1">
                  {new Date(selectedResponse.date).toLocaleDateString()} • Question
                </div>
                <div className="font-medium">{selectedResponse.question}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Your Reflection</div>
                <div className="text-gray-900">{selectedResponse.answer}</div>
              </div>
              {selectedResponse.tags.length > 0 && (
                <div>
                  <div className="text-sm text-gray-600 mb-1">Tags</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedResponse.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};