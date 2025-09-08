/**
 * EmotionalTracker Example Usage
 * 
 * Demonstrates how to integrate the EmotionalTracker component
 * into the daily journal system.
 */

import React, { useState } from 'react';
import { EmotionalTracker } from './EmotionalTracker';
import { EmotionalTrendChart } from './EmotionalTrendChart';
import { EmotionalState, JournalEntry } from '../../types/journal';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Calendar, TrendingUp, Save, RotateCcw } from 'lucide-react';

interface EmotionalTrackerExampleProps {
  journalEntry?: JournalEntry;
  onSave?: (emotionalState: EmotionalState) => void;
  showTrends?: boolean;
  readOnly?: boolean;
}

export const EmotionalTrackerExample: React.FC<EmotionalTrackerExampleProps> = ({
  journalEntry,
  onSave,
  showTrends = true,
  readOnly = false
}) => {
  // Initialize emotional state from journal entry or default values
  const [emotionalState, setEmotionalState] = useState<EmotionalState>(
    journalEntry?.emotionalState || {
      preMarket: {
        confidence: 0,
        anxiety: 0,
        focus: 0,
        energy: 0,
        mood: 'neutral',
        preparedness: 0,
        notes: '',
        timestamp: ''
      },
      duringTrading: {
        discipline: 0,
        patience: 0,
        emotionalControl: 0,
        decisionClarity: 0,
        stressManagement: 0,
        notes: '',
        emotionalEvents: []
      },
      postMarket: {
        satisfaction: 0,
        learningValue: 0,
        frustrationLevel: 0,
        accomplishment: 0,
        overallMood: 'neutral',
        notes: '',
        timestamp: ''
      },
      overallMood: 'neutral',
      stressLevel: 0,
      confidenceLevel: 0,
      emotionalNotes: '',
      triggers: []
    }
  );

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('tracker');

  // Handle emotional state changes
  const handleEmotionalStateChange = (newState: EmotionalState) => {
    setEmotionalState(newState);
    setHasUnsavedChanges(true);
  };

  // Save emotional state
  const handleSave = () => {
    onSave?.(emotionalState);
    setHasUnsavedChanges(false);
  };

  // Reset to original state
  const handleReset = () => {
    if (journalEntry?.emotionalState) {
      setEmotionalState(journalEntry.emotionalState);
    }
    setHasUnsavedChanges(false);
  };

  // Calculate completion percentage
  const calculateCompletionPercentage = () => {
    const fields = [
      emotionalState.preMarket.confidence,
      emotionalState.preMarket.anxiety,
      emotionalState.preMarket.focus,
      emotionalState.duringTrading.discipline,
      emotionalState.duringTrading.patience,
      emotionalState.postMarket.satisfaction,
      emotionalState.postMarket.learningValue,
      emotionalState.overallMood !== 'neutral' ? 1 : 0
    ];

    const completedFields = fields.filter(field => field > 0).length;
    return Math.round((completedFields / fields.length) * 100);
  };

  // Mock journal entries for trend chart
  const mockJournalEntries: JournalEntry[] = [
    // This would normally come from the journal service
    // Adding a few mock entries to demonstrate the trend chart
  ];

  const completionPercentage = calculateCompletionPercentage();

  return (
    <div className="space-y-6">
      {/* Header with status and actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              Daily Emotional Tracking
              {journalEntry && (
                <Badge variant="outline">
                  {new Date(journalEntry.date).toLocaleDateString()}
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-3">
              <Badge 
                variant={completionPercentage >= 80 ? "default" : "secondary"}
                className="px-3 py-1"
              >
                {completionPercentage}% Complete
              </Badge>
              {hasUnsavedChanges && (
                <Badge variant="destructive" className="px-2 py-1">
                  Unsaved Changes
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        {!readOnly && (
          <CardContent>
            <div className="flex gap-2">
              <Button 
                onClick={handleSave} 
                disabled={!hasUnsavedChanges}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
              <Button 
                variant="outline" 
                onClick={handleReset}
                disabled={!hasUnsavedChanges}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Main content with tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tracker">Emotional Tracker</TabsTrigger>
          {showTrends && (
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Trends & Insights
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="tracker" className="mt-6">
          <EmotionalTracker
            emotionalState={emotionalState}
            onChange={handleEmotionalStateChange}
            readOnly={readOnly}
            className="w-full"
          />
        </TabsContent>

        {showTrends && (
          <TabsContent value="trends" className="mt-6">
            <EmotionalTrendChart
              journalEntries={mockJournalEntries}
              timeframe="month"
              showCorrelations={true}
            />
          </TabsContent>
        )}
      </Tabs>

      {/* Quick insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Today's Emotional Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {emotionalState.confidenceLevel || 'N/A'}
              </div>
              <div className="text-sm text-blue-800">Overall Confidence</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {emotionalState.duringTrading.discipline || 'N/A'}
              </div>
              <div className="text-sm text-green-800">Trading Discipline</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {emotionalState.postMarket.satisfaction || 'N/A'}
              </div>
              <div className="text-sm text-purple-800">Session Satisfaction</div>
            </div>
          </div>

          {emotionalState.emotionalNotes && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Key Emotional Insights</h4>
              <p className="text-gray-700 text-sm">{emotionalState.emotionalNotes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmotionalTrackerExample;