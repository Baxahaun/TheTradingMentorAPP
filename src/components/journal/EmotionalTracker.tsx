/**
 * EmotionalTracker Component
 * 
 * Main component for tracking emotional state throughout the trading day.
 * Supports pre-market, during-trading, and post-market emotional tracking
 * with rating scales and mood selectors.
 */

import React, { useState, useCallback } from 'react';
import { EmotionalState, EmotionalMood, PreMarketEmotions, TradingEmotions, PostMarketEmotions } from '../../types/journal';
import { EmotionScale } from './EmotionScale';
import { MoodSelector } from './MoodSelector';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { TrendingUp, TrendingDown, Minus, Clock, Heart, Brain } from 'lucide-react';

interface EmotionalTrackerProps {
  emotionalState: EmotionalState;
  onChange: (emotionalState: EmotionalState) => void;
  phase?: 'preMarket' | 'duringTrading' | 'postMarket' | 'all';
  readOnly?: boolean;
  showTrends?: boolean;
  className?: string;
}

export const EmotionalTracker: React.FC<EmotionalTrackerProps> = ({
  emotionalState,
  onChange,
  phase = 'all',
  readOnly = false,
  showTrends = false,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<string>(
    phase === 'all' ? 'preMarket' : phase
  );

  // Handle pre-market emotions update
  const handlePreMarketChange = useCallback((updates: Partial<PreMarketEmotions>) => {
    const updatedState = {
      ...emotionalState,
      preMarket: {
        ...emotionalState.preMarket,
        ...updates,
        timestamp: new Date().toISOString()
      }
    };
    onChange(updatedState);
  }, [emotionalState, onChange]);

  // Handle during-trading emotions update
  const handleTradingChange = useCallback((updates: Partial<TradingEmotions>) => {
    const updatedState = {
      ...emotionalState,
      duringTrading: {
        ...emotionalState.duringTrading,
        ...updates
      }
    };
    onChange(updatedState);
  }, [emotionalState, onChange]);

  // Handle post-market emotions update
  const handlePostMarketChange = useCallback((updates: Partial<PostMarketEmotions>) => {
    const updatedState = {
      ...emotionalState,
      postMarket: {
        ...emotionalState.postMarket,
        ...updates,
        timestamp: new Date().toISOString()
      }
    };
    onChange(updatedState);
  }, [emotionalState, onChange]);

  // Handle overall emotional state updates
  const handleOverallChange = useCallback((field: keyof Pick<EmotionalState, 'overallMood' | 'stressLevel' | 'confidenceLevel' | 'emotionalNotes'>, value: any) => {
    const updatedState = {
      ...emotionalState,
      [field]: value
    };
    onChange(updatedState);
  }, [emotionalState, onChange]);

  // Calculate emotional trend indicator
  const getEmotionalTrend = (current: number, previous?: number): 'up' | 'down' | 'stable' => {
    if (!previous) return 'stable';
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'stable';
  };

  // Render trend indicator
  const renderTrendIndicator = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  // Render pre-market emotional tracking
  const renderPreMarketTracking = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold">Pre-Market Emotional State</h3>
        {emotionalState.preMarket.timestamp && (
          <Badge variant="outline" className="text-xs">
            {new Date(emotionalState.preMarket.timestamp).toLocaleTimeString()}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EmotionScale
          label="Confidence Level"
          value={emotionalState.preMarket.confidence}
          onChange={(value) => handlePreMarketChange({ confidence: value })}
          readOnly={readOnly}
          description="How confident do you feel about today's trading?"
          color="blue"
        />

        <EmotionScale
          label="Anxiety Level"
          value={emotionalState.preMarket.anxiety}
          onChange={(value) => handlePreMarketChange({ anxiety: value })}
          readOnly={readOnly}
          description="How anxious or nervous are you feeling?"
          color="orange"
          inverted
        />

        <EmotionScale
          label="Focus Level"
          value={emotionalState.preMarket.focus}
          onChange={(value) => handlePreMarketChange({ focus: value })}
          readOnly={readOnly}
          description="How focused and mentally sharp do you feel?"
          color="green"
        />

        <EmotionScale
          label="Energy Level"
          value={emotionalState.preMarket.energy}
          onChange={(value) => handlePreMarketChange({ energy: value })}
          readOnly={readOnly}
          description="How energetic and alert are you?"
          color="purple"
        />

        <EmotionScale
          label="Preparedness"
          value={emotionalState.preMarket.preparedness}
          onChange={(value) => handlePreMarketChange({ preparedness: value })}
          readOnly={readOnly}
          description="How well-prepared do you feel for trading?"
          color="indigo"
        />
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium">Overall Mood</label>
        <MoodSelector
          selectedMood={emotionalState.preMarket.mood}
          onMoodChange={(mood) => handlePreMarketChange({ mood })}
          readOnly={readOnly}
          size="medium"
          layout="horizontal"
        />
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium">Pre-Market Notes</label>
        <Textarea
          value={emotionalState.preMarket.notes || ''}
          onChange={(e) => handlePreMarketChange({ notes: e.target.value })}
          placeholder="How are you feeling before the market opens? Any specific thoughts or concerns?"
          readOnly={readOnly}
          className="min-h-[80px]"
        />
      </div>
    </div>
  );

  // Render during-trading emotional tracking
  const renderTradingTracking = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-5 h-5 text-red-500" />
        <h3 className="text-lg font-semibold">During Trading Emotions</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EmotionScale
          label="Discipline"
          value={emotionalState.duringTrading.discipline}
          onChange={(value) => handleTradingChange({ discipline: value })}
          readOnly={readOnly}
          description="How well are you sticking to your trading plan?"
          color="blue"
        />

        <EmotionScale
          label="Patience"
          value={emotionalState.duringTrading.patience}
          onChange={(value) => handleTradingChange({ patience: value })}
          readOnly={readOnly}
          description="How patient are you being with trade setups?"
          color="green"
        />

        <EmotionScale
          label="Emotional Control"
          value={emotionalState.duringTrading.emotionalControl}
          onChange={(value) => handleTradingChange({ emotionalControl: value })}
          readOnly={readOnly}
          description="How well are you managing your emotions?"
          color="purple"
        />

        <EmotionScale
          label="Decision Clarity"
          value={emotionalState.duringTrading.decisionClarity}
          onChange={(value) => handleTradingChange({ decisionClarity: value })}
          readOnly={readOnly}
          description="How clear and confident are your trading decisions?"
          color="indigo"
        />

        <EmotionScale
          label="Stress Management"
          value={emotionalState.duringTrading.stressManagement}
          onChange={(value) => handleTradingChange({ stressManagement: value })}
          readOnly={readOnly}
          description="How well are you handling trading stress?"
          color="orange"
        />
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium">Trading Session Notes</label>
        <Textarea
          value={emotionalState.duringTrading.notes || ''}
          onChange={(e) => handleTradingChange({ notes: e.target.value })}
          placeholder="How are you feeling during the trading session? Any emotional challenges or successes?"
          readOnly={readOnly}
          className="min-h-[80px]"
        />
      </div>
    </div>
  );

  // Render post-market emotional tracking
  const renderPostMarketTracking = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-green-500" />
        <h3 className="text-lg font-semibold">Post-Market Reflection</h3>
        {emotionalState.postMarket.timestamp && (
          <Badge variant="outline" className="text-xs">
            {new Date(emotionalState.postMarket.timestamp).toLocaleTimeString()}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EmotionScale
          label="Satisfaction"
          value={emotionalState.postMarket.satisfaction}
          onChange={(value) => handlePostMarketChange({ satisfaction: value })}
          readOnly={readOnly}
          description="How satisfied are you with today's trading?"
          color="green"
        />

        <EmotionScale
          label="Learning Value"
          value={emotionalState.postMarket.learningValue}
          onChange={(value) => handlePostMarketChange({ learningValue: value })}
          readOnly={readOnly}
          description="How much did you learn from today's session?"
          color="blue"
        />

        <EmotionScale
          label="Frustration Level"
          value={emotionalState.postMarket.frustrationLevel}
          onChange={(value) => handlePostMarketChange({ frustrationLevel: value })}
          readOnly={readOnly}
          description="How frustrated are you feeling?"
          color="red"
          inverted
        />

        <EmotionScale
          label="Accomplishment"
          value={emotionalState.postMarket.accomplishment}
          onChange={(value) => handlePostMarketChange({ accomplishment: value })}
          readOnly={readOnly}
          description="How accomplished do you feel?"
          color="purple"
        />
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium">Overall Mood</label>
        <MoodSelector
          selectedMood={emotionalState.postMarket.overallMood}
          onMoodChange={(mood) => handlePostMarketChange({ overallMood: mood })}
          readOnly={readOnly}
          size="medium"
          layout="horizontal"
        />
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium">Post-Market Notes</label>
        <Textarea
          value={emotionalState.postMarket.notes || ''}
          onChange={(e) => handlePostMarketChange({ notes: e.target.value })}
          placeholder="How are you feeling after the trading session? What emotional insights did you gain?"
          readOnly={readOnly}
          className="min-h-[80px]"
        />
      </div>
    </div>
  );

  // Render overall emotional summary
  const renderOverallSummary = () => (
    <div className="space-y-6 border-t pt-6">
      <h3 className="text-lg font-semibold">Overall Emotional Summary</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <EmotionScale
          label="Overall Stress Level"
          value={emotionalState.stressLevel}
          onChange={(value) => handleOverallChange('stressLevel', value)}
          readOnly={readOnly}
          description="Your overall stress level for the day"
          color="red"
          inverted
        />

        <EmotionScale
          label="Overall Confidence"
          value={emotionalState.confidenceLevel}
          onChange={(value) => handleOverallChange('confidenceLevel', value)}
          readOnly={readOnly}
          description="Your overall confidence level for the day"
          color="blue"
        />

        <div className="space-y-3">
          <label className="text-sm font-medium">Overall Mood</label>
          <MoodSelector
            selectedMood={emotionalState.overallMood}
            onMoodChange={(mood) => handleOverallChange('overallMood', mood)}
            readOnly={readOnly}
            size="small"
            layout="horizontal"
          />
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium">Emotional Insights & Notes</label>
        <Textarea
          value={emotionalState.emotionalNotes || ''}
          onChange={(e) => handleOverallChange('emotionalNotes', e.target.value)}
          placeholder="What emotional patterns did you notice today? Any insights about your emotional responses to trading?"
          readOnly={readOnly}
          className="min-h-[100px]"
        />
      </div>
    </div>
  );

  // Single phase rendering
  if (phase !== 'all') {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          {phase === 'preMarket' && renderPreMarketTracking()}
          {phase === 'duringTrading' && renderTradingTracking()}
          {phase === 'postMarket' && renderPostMarketTracking()}
        </CardContent>
      </Card>
    );
  }

  // Full emotional tracker with tabs
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500" />
          Emotional State Tracking
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preMarket">Pre-Market</TabsTrigger>
            <TabsTrigger value="duringTrading">During Trading</TabsTrigger>
            <TabsTrigger value="postMarket">Post-Market</TabsTrigger>
          </TabsList>

          <TabsContent value="preMarket" className="mt-6">
            {renderPreMarketTracking()}
          </TabsContent>

          <TabsContent value="duringTrading" className="mt-6">
            {renderTradingTracking()}
          </TabsContent>

          <TabsContent value="postMarket" className="mt-6">
            {renderPostMarketTracking()}
          </TabsContent>
        </Tabs>

        {renderOverallSummary()}
      </CardContent>
    </Card>
  );
};

export default EmotionalTracker;