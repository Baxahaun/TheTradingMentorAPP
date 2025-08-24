import React, { useState, useEffect } from 'react';
import { 
  ReviewWorkflow, 
  ReviewStage, 
  EnhancedTrade,
  TradeReviewMode 
} from '../../../types/tradeReview';
import { TradeReviewService } from '../../../lib/tradeReviewService';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Progress } from '../../ui/progress';
import { Badge } from '../../ui/badge';
import { Textarea } from '../../ui/textarea';
import { Label } from '../../ui/label';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle,
  PlayCircle,
  CheckSquare,
  FileText,
  Target,
  TrendingUp
} from 'lucide-react';

interface ReviewWorkflowPanelProps {
  trade: EnhancedTrade;
  currentMode: TradeReviewMode;
  onWorkflowUpdate: (workflow: ReviewWorkflow) => void;
  onModeChange?: (mode: TradeReviewMode) => void;
}

const ReviewWorkflowPanel: React.FC<ReviewWorkflowPanelProps> = ({
  trade,
  currentMode,
  onWorkflowUpdate,
  onModeChange
}) => {
  const [workflow, setWorkflow] = useState<ReviewWorkflow | null>(null);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [stageNotes, setStageNotes] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  
  const reviewService = TradeReviewService.getInstance();

  // Initialize workflow on component mount
  useEffect(() => {
    const existingWorkflow = trade.reviewData?.reviewWorkflow;
    if (existingWorkflow) {
      setWorkflow(existingWorkflow);
      // Initialize stage notes from existing workflow
      const notes: { [key: string]: string } = {};
      existingWorkflow.stages.forEach(stage => {
        if (stage.notes) {
          notes[stage.id] = stage.notes;
        }
      });
      setStageNotes(notes);
    } else {
      // Initialize new workflow
      const newWorkflow = reviewService.initializeReview(trade.id);
      setWorkflow(newWorkflow);
    }
  }, [trade.id, trade.reviewData?.reviewWorkflow, reviewService]);

  // Handle stage completion toggle
  const handleStageToggle = async (stageId: string, completed: boolean) => {
    if (!workflow) return;

    setIsLoading(true);
    try {
      const notes = stageNotes[stageId] || '';
      const updatedWorkflow = reviewService.updateStage(workflow, stageId, completed, notes);
      
      setWorkflow(updatedWorkflow);
      onWorkflowUpdate(updatedWorkflow);
      
      // If stage is completed, collapse it
      if (completed && expandedStage === stageId) {
        setExpandedStage(null);
      }
    } catch (error) {
      console.error('Failed to update stage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle stage notes update
  const handleStageNotesChange = (stageId: string, notes: string) => {
    setStageNotes(prev => ({
      ...prev,
      [stageId]: notes
    }));
  };

  // Save stage notes
  const handleSaveStageNotes = async (stageId: string) => {
    if (!workflow) return;

    setIsLoading(true);
    try {
      const stage = workflow.stages.find(s => s.id === stageId);
      if (stage) {
        const notes = stageNotes[stageId] || '';
        const updatedWorkflow = reviewService.updateStage(workflow, stageId, stage.completed, notes);
        setWorkflow(updatedWorkflow);
        onWorkflowUpdate(updatedWorkflow);
      }
    } catch (error) {
      console.error('Failed to save stage notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Complete entire review
  const handleCompleteReview = async () => {
    if (!workflow) return;

    setIsLoading(true);
    try {
      const completedWorkflow = reviewService.markReviewComplete(workflow);
      setWorkflow(completedWorkflow);
      onWorkflowUpdate(completedWorkflow);
      onModeChange?.('view');
    } catch (error) {
      console.error('Failed to complete review:', error);
      // Show error message to user
    } finally {
      setIsLoading(false);
    }
  };

  // Start review mode
  const handleStartReview = () => {
    onModeChange?.('review');
  };

  // Get stage icon
  const getStageIcon = (stage: ReviewStage) => {
    if (stage.completed) {
      return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    }
    
    switch (stage.id) {
      case 'data_verification':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'technical_analysis':
        return <TrendingUp className="w-5 h-5 text-purple-600" />;
      case 'execution_analysis':
        return <Target className="w-5 h-5 text-orange-600" />;
      case 'risk_management':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'lessons_learned':
        return <CheckSquare className="w-5 h-5 text-indigo-600" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  // Get stage status badge
  const getStageStatusBadge = (stage: ReviewStage) => {
    if (stage.completed) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Complete
        </Badge>
      );
    }
    
    if (stage.required) {
      return (
        <Badge variant="outline" className="border-orange-200 text-orange-700">
          <Clock className="w-3 h-3 mr-1" />
          Required
        </Badge>
      );
    }
    
    return (
      <Badge variant="secondary" className="bg-gray-100 text-gray-600">
        Optional
      </Badge>
    );
  };

  if (!workflow) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            Loading review workflow...
          </div>
        </CardContent>
      </Card>
    );
  }

  const isReviewComplete = workflow.completedAt !== undefined;
  const requiredStagesComplete = workflow.stages
    .filter(s => s.required)
    .every(s => s.completed);
  const canCompleteReview = requiredStagesComplete && !isReviewComplete;

  return (
    <div className="space-y-6">
      {/* Review Progress Overview */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg">
            <CheckSquare className="w-5 h-5 text-blue-600" />
            Review Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                Overall Progress
              </span>
              <span className="text-sm font-bold text-blue-600">
                {Math.round(workflow.overallProgress)}%
              </span>
            </div>
            <Progress 
              value={workflow.overallProgress} 
              className="h-3"
            />
          </div>

          {/* Status Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3 rounded-lg border text-center">
              <div className="text-lg font-bold text-gray-900">
                {workflow.stages.filter(s => s.completed).length}
              </div>
              <div className="text-xs text-gray-500 font-medium">Completed</div>
            </div>
            <div className="bg-white p-3 rounded-lg border text-center">
              <div className="text-lg font-bold text-gray-900">
                {workflow.stages.filter(s => s.required && !s.completed).length}
              </div>
              <div className="text-xs text-gray-500 font-medium">Required</div>
            </div>
            <div className="bg-white p-3 rounded-lg border text-center">
              <div className="text-lg font-bold text-gray-900">
                {workflow.stages.filter(s => !s.required && !s.completed).length}
              </div>
              <div className="text-xs text-gray-500 font-medium">Optional</div>
            </div>
            <div className="bg-white p-3 rounded-lg border text-center">
              <div className={`text-lg font-bold ${isReviewComplete ? 'text-green-600' : 'text-gray-400'}`}>
                {isReviewComplete ? 'Done' : 'Pending'}
              </div>
              <div className="text-xs text-gray-500 font-medium">Status</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {currentMode !== 'review' && !isReviewComplete && (
              <Button 
                onClick={handleStartReview}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <PlayCircle className="w-4 h-4 mr-2" />
                Start Review
              </Button>
            )}
            
            {canCompleteReview && (
              <Button 
                onClick={handleCompleteReview}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Complete Review
              </Button>
            )}

            {isReviewComplete && (
              <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 px-3 py-1">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Review Completed
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Review Stages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg">
            <FileText className="w-5 h-5 text-gray-600" />
            Review Stages
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {workflow.stages.map((stage, index) => (
            <div 
              key={stage.id}
              className={`border rounded-lg transition-all duration-200 ${
                stage.completed 
                  ? 'border-green-200 bg-green-50' 
                  : stage.required 
                    ? 'border-orange-200 bg-orange-50' 
                    : 'border-gray-200 bg-gray-50'
              }`}
            >
              {/* Stage Header */}
              <div 
                className="p-4 cursor-pointer hover:bg-opacity-80 transition-colors"
                onClick={() => setExpandedStage(
                  expandedStage === stage.id ? null : stage.id
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStageIcon(stage)}
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {stage.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {stage.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {getStageStatusBadge(stage)}
                    
                    {/* Toggle Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStageToggle(stage.id, !stage.completed);
                      }}
                      disabled={isLoading || isReviewComplete}
                      className={
                        stage.completed 
                          ? 'border-green-600 text-green-600 hover:bg-green-50' 
                          : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                      }
                    >
                      {stage.completed ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Done
                        </>
                      ) : (
                        <>
                          <Circle className="w-4 h-4 mr-1" />
                          Mark Done
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Expanded Stage Content */}
              {expandedStage === stage.id && (
                <div className="border-t border-gray-200 p-4 bg-white">
                  <div className="space-y-4">
                    {/* Stage Notes */}
                    <div>
                      <Label htmlFor={`notes-${stage.id}`} className="text-sm font-semibold text-gray-700 mb-2 block">
                        Notes & Comments
                      </Label>
                      <Textarea
                        id={`notes-${stage.id}`}
                        value={stageNotes[stage.id] || ''}
                        onChange={(e) => handleStageNotesChange(stage.id, e.target.value)}
                        placeholder={`Add notes for ${stage.name.toLowerCase()}...`}
                        className="min-h-[100px] resize-none"
                        disabled={isReviewComplete}
                      />
                    </div>

                    {/* Save Notes Button */}
                    {!isReviewComplete && (
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSaveStageNotes(stage.id)}
                          disabled={isLoading}
                        >
                          Save Notes
                        </Button>
                      </div>
                    )}

                    {/* Completion Info */}
                    {stage.completed && stage.completedAt && (
                      <div className="text-xs text-gray-500 border-t pt-2">
                        Completed on {new Date(stage.completedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Review Summary */}
      {isReviewComplete && workflow.completedAt && (
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-lg text-green-800">
              <CheckCircle2 className="w-5 h-5" />
              Review Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-green-700">
                This trade review was completed on{' '}
                <span className="font-semibold">
                  {new Date(workflow.completedAt).toLocaleString()}
                </span>
              </p>
              <p className="text-sm text-green-600">
                All required review stages have been completed successfully.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReviewWorkflowPanel;