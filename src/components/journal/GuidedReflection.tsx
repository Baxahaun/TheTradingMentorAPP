import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle, 
  Clock, 
  Lightbulb,
  MessageSquare,
  Target,
  TrendingUp
} from 'lucide-react';
import { 
  ReflectionSession, 
  ReflectionPrompt, 
  ReflectionResponse 
} from '../../types/reflection';
import { reflectionService } from '../../services/ReflectionService';

interface GuidedReflectionProps {
  userId: string;
  date: string;
  session?: ReflectionSession;
  onSessionUpdate?: (session: ReflectionSession) => void;
  onComplete?: () => void;
}

export const GuidedReflection: React.FC<GuidedReflectionProps> = ({
  userId,
  date,
  session: initialSession,
  onSessionUpdate,
  onComplete
}) => {
  const [session, setSession] = useState<ReflectionSession | null>(initialSession || null);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [responses, setResponses] = useState<ReflectionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpAnswers, setFollowUpAnswers] = useState<string[]>([]);

  useEffect(() => {
    if (session) {
      setResponses(session.responses);
      // Find the first unanswered prompt
      const unansweredIndex = session.prompts.findIndex(prompt => 
        !session.responses.some(response => response.promptId === prompt.id)
      );
      setCurrentPromptIndex(unansweredIndex >= 0 ? unansweredIndex : 0);
    }
  }, [session]);

  const currentPrompt = session?.prompts[currentPromptIndex];
  const progress = session ? (responses.length / session.prompts.length) * 100 : 0;
  const isLastPrompt = session ? currentPromptIndex === session.prompts.length - 1 : false;
  const isAnswered = currentPrompt ? responses.some(r => r.promptId === currentPrompt.id) : false;

  const handleAnswerSubmit = async () => {
    if (!currentPrompt || !currentAnswer.trim() || !session) return;

    setIsLoading(true);
    try {
      const response: Omit<ReflectionResponse, 'id' | 'createdAt' | 'updatedAt'> = {
        userId,
        date,
        promptId: currentPrompt.id,
        question: currentPrompt.question,
        answer: currentAnswer.trim(),
        tags: [],
        themes: []
      };

      const responseId = await reflectionService.saveReflectionResponse(response);
      
      const newResponse: ReflectionResponse = {
        ...response,
        id: responseId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: [],
        themes: []
      };

      const updatedResponses = [...responses, newResponse];
      setResponses(updatedResponses);

      const updatedSession = {
        ...session,
        responses: updatedResponses,
        completionStatus: updatedResponses.length === session.prompts.length ? 'completed' as const : 'in_progress' as const,
        completedAt: updatedResponses.length === session.prompts.length ? new Date().toISOString() : undefined
      };

      setSession(updatedSession);
      onSessionUpdate?.(updatedSession);

      // Show follow-up questions if available
      if (currentPrompt.followUpQuestions && currentPrompt.followUpQuestions.length > 0) {
        setShowFollowUp(true);
        setFollowUpAnswers(new Array(currentPrompt.followUpQuestions.length).fill(''));
      } else {
        moveToNextPrompt();
      }

      setCurrentAnswer('');
    } catch (error) {
      console.error('Error saving reflection response:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowUpSubmit = async () => {
    if (!currentPrompt || !session) return;

    // Save follow-up answers as additional responses
    for (let i = 0; i < followUpAnswers.length; i++) {
      const answer = followUpAnswers[i].trim();
      if (answer) {
        const followUpResponse: Omit<ReflectionResponse, 'id' | 'createdAt' | 'updatedAt'> = {
          userId,
          date,
          promptId: `${currentPrompt.id}-followup-${i}`,
          question: currentPrompt.followUpQuestions![i],
          answer,
          tags: [],
          themes: []
        };

        await reflectionService.saveReflectionResponse(followUpResponse);
      }
    }

    setShowFollowUp(false);
    setFollowUpAnswers([]);
    moveToNextPrompt();
  };

  const moveToNextPrompt = () => {
    if (session && currentPromptIndex < session.prompts.length - 1) {
      setCurrentPromptIndex(currentPromptIndex + 1);
    } else {
      // Session completed
      onComplete?.();
    }
  };

  const moveToPreviousPrompt = () => {
    if (currentPromptIndex > 0) {
      setCurrentPromptIndex(currentPromptIndex - 1);
      setShowFollowUp(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'learning': return <Lightbulb className="h-4 w-4" />;
      case 'process': return <Target className="h-4 w-4" />;
      case 'emotional': return <MessageSquare className="h-4 w-4" />;
      case 'market_analysis': return <TrendingUp className="h-4 w-4" />;
      case 'planning': return <Clock className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'learning': return 'bg-blue-100 text-blue-800';
      case 'process': return 'bg-green-100 text-green-800';
      case 'emotional': return 'bg-purple-100 text-purple-800';
      case 'market_analysis': return 'bg-orange-100 text-orange-800';
      case 'planning': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!session) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Reflection Session</h3>
            <p className="text-gray-600">
              Start a guided reflection session to learn from today's trading experience.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showFollowUp && currentPrompt?.followUpQuestions) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Follow-up Questions
          </CardTitle>
          <Progress value={progress} className="w-full" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800 mb-2">Great answer! Let's dive deeper:</p>
          </div>

          {currentPrompt.followUpQuestions.map((question, index) => (
            <div key={index} className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {question}
              </label>
              <Textarea
                value={followUpAnswers[index] || ''}
                onChange={(e) => {
                  const newAnswers = [...followUpAnswers];
                  newAnswers[index] = e.target.value;
                  setFollowUpAnswers(newAnswers);
                }}
                placeholder="Your thoughts..."
                className="min-h-[80px]"
              />
            </div>
          ))}

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setShowFollowUp(false)}
            >
              Skip Follow-up
            </Button>
            <Button
              onClick={handleFollowUpSubmit}
              disabled={followUpAnswers.every(answer => !answer.trim())}
            >
              Continue
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Guided Reflection
            <Badge variant="outline">
              {currentPromptIndex + 1} of {session.prompts.length}
            </Badge>
          </CardTitle>
          {isAnswered && (
            <CheckCircle className="h-5 w-5 text-green-600" />
          )}
        </div>
        <Progress value={progress} className="w-full" />
      </CardHeader>
      <CardContent className="space-y-4">
        {currentPrompt && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <Badge className={getCategoryColor(currentPrompt.category)}>
                {getCategoryIcon(currentPrompt.category)}
                <span className="ml-1 capitalize">
                  {currentPrompt.category.replace('_', ' ')}
                </span>
              </Badge>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">
                {currentPrompt.question}
              </h3>
              {currentPrompt.context && (
                <p className="text-sm text-gray-600">
                  This question is tailored to your trading activity today.
                </p>
              )}
            </div>

            {isAnswered ? (
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-800 mb-2">✓ Already answered</p>
                <p className="text-gray-700">
                  {responses.find(r => r.promptId === currentPrompt.id)?.answer}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Your reflection:
                </label>
                <Textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Take your time to reflect thoughtfully..."
                  className="min-h-[120px]"
                />
                <p className="text-xs text-gray-500">
                  Tip: Be honest and specific. The more detailed your reflection, the more you'll learn.
                </p>
              </div>
            )}
          </>
        )}

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={moveToPreviousPrompt}
            disabled={currentPromptIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {isAnswered ? (
            <Button onClick={moveToNextPrompt}>
              {isLastPrompt ? 'Complete Session' : 'Next Question'}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleAnswerSubmit}
              disabled={!currentAnswer.trim() || isLoading}
            >
              {isLoading ? 'Saving...' : 'Save & Continue'}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>

        {session.completionStatus === 'completed' && (
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg mt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">
                Reflection Complete!
              </span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              Great job reflecting on today's trading. Your insights have been saved and will help identify patterns over time.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};