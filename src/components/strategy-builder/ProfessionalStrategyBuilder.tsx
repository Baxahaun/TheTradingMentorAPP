import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, Info, ArrowLeft, ArrowRight } from 'lucide-react';

import { ProfessionalStrategy, ValidationResult } from '@/types/strategy';
import { StrategyValidationService } from '@/services/StrategyValidationService';
import { MethodologySelector } from './MethodologySelector';
import { SetupConditionsBuilder } from './SetupConditionsBuilder';
import { EntryTriggersBuilder } from './EntryTriggersBuilder';
import { RiskManagementBuilder } from './RiskManagementBuilder';

interface ProfessionalStrategyBuilderProps {
  strategy?: ProfessionalStrategy;
  mode: 'create' | 'edit' | 'migrate';
  isOpen: boolean;
  onSave: (strategy: ProfessionalStrategy) => void;
  onCancel: () => void;
}

interface BuilderStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  isComplete: boolean;
  hasErrors: boolean;
}

export const ProfessionalStrategyBuilder: React.FC<ProfessionalStrategyBuilderProps> = ({
  strategy,
  mode,
  isOpen,
  onSave,
  onCancel
}) => {
  // State management
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<ProfessionalStrategy>>({});
  const [validationResults, setValidationResults] = useState<Record<string, ValidationResult>>({});
  const [isValidating, setIsValidating] = useState(false);
  
  // Services
  const validationService = new StrategyValidationService();

  // Initialize form data
  useEffect(() => {
    if (strategy) {
      setFormData(strategy);
    } else {
      // Initialize with default values for new strategy
      setFormData({
        title: '',
        description: '',
        color: '#3B82F6',
        methodology: 'Technical',
        primaryTimeframe: '1H',
        assetClasses: ['Forex'],
        setupConditions: {
          marketEnvironment: '',
          technicalConditions: [],
          fundamentalConditions: [],
          volatilityRequirements: ''
        },
        entryTriggers: {
          primarySignal: '',
          confirmationSignals: [],
          timingCriteria: ''
        },
        riskManagement: {
          positionSizingMethod: {
            type: 'FixedPercentage',
            parameters: { percentage: 2 }
          },
          maxRiskPerTrade: 2,
          stopLossRule: {
            type: 'PercentageBased',
            parameters: { percentage: 2 },
            description: '2% stop loss'
          },
          takeProfitRule: {
            type: 'RiskRewardRatio',
            parameters: { ratio: 2 },
            description: '2:1 risk-reward ratio'
          },
          riskRewardRatio: 2
        },
        isActive: true
      });
    }
  }, [strategy]);

  // Define builder steps
  const steps: BuilderStep[] = [
    {
      id: 'methodology',
      title: 'Strategy Foundation',
      description: 'Define the core methodology and basic information',
      component: MethodologySelector,
      isComplete: !!(formData.title && formData.methodology && formData.primaryTimeframe),
      hasErrors: !!validationResults.methodology?.errors?.length
    },
    {
      id: 'setup',
      title: 'Setup Conditions',
      description: 'Define market environment and setup criteria',
      component: SetupConditionsBuilder,
      isComplete: !!(formData.setupConditions?.marketEnvironment && 
                     formData.setupConditions?.technicalConditions?.length),
      hasErrors: !!validationResults.setup?.errors?.length
    },
    {
      id: 'entry',
      title: 'Entry Triggers',
      description: 'Specify entry signals and timing criteria',
      component: EntryTriggersBuilder,
      isComplete: !!(formData.entryTriggers?.primarySignal && 
                     formData.entryTriggers?.timingCriteria),
      hasErrors: !!validationResults.entry?.errors?.length
    },
    {
      id: 'risk',
      title: 'Risk Management',
      description: 'Configure position sizing and risk parameters',
      component: RiskManagementBuilder,
      isComplete: !!(formData.riskManagement?.positionSizingMethod && 
                     formData.riskManagement?.stopLossRule && 
                     formData.riskManagement?.takeProfitRule),
      hasErrors: !!validationResults.risk?.errors?.length
    }
  ];

  // Calculate overall progress
  const completedSteps = steps.filter(step => step.isComplete).length;
  const progress = (completedSteps / steps.length) * 100;

  // Handle form data updates
  const handleFormDataUpdate = (updates: Partial<ProfessionalStrategy>) => {
    const newFormData = { ...formData, ...updates };
    setFormData(newFormData);
    
    // Validate the updated data
    validateCurrentStep(newFormData);
  };

  // Validate current step
  const validateCurrentStep = async (data: Partial<ProfessionalStrategy>) => {
    setIsValidating(true);
    
    try {
      const currentStepId = steps[currentStep].id;
      let validationResult: ValidationResult;

      switch (currentStepId) {
        case 'methodology':
          validationResult = validationService.validateBasicInfo(data);
          break;
        case 'setup':
          validationResult = validationService.validateSetupConditions(data.setupConditions);
          break;
        case 'entry':
          validationResult = validationService.validateEntryTriggers(data.entryTriggers);
          break;
        case 'risk':
          validationResult = validationService.validateRiskManagement(data.riskManagement);
          break;
        default:
          validationResult = { isValid: true, errors: [], warnings: [] };
      }

      setValidationResults(prev => ({
        ...prev,
        [currentStepId]: validationResult
      }));
    } catch (error) {
      console.error('Validation error:', error);
    } finally {
      setIsValidating(false);
    }
  };

  // Handle step navigation
  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validate entire strategy
    const fullValidation = validationService.validateStrategy(formData as ProfessionalStrategy);
    
    if (!fullValidation.isValid) {
      // Show validation errors
      return;
    }

    // Create complete strategy object
    const completeStrategy: ProfessionalStrategy = {
      id: strategy?.id || Date.now().toString(),
      createdAt: strategy?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: (strategy?.version || 0) + 1,
      performance: strategy?.performance || {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        profitFactor: 0,
        expectancy: 0,
        winRate: 0,
        averageWin: 0,
        averageLoss: 0,
        riskRewardRatio: 0,
        maxDrawdown: 0,
        maxDrawdownDuration: 0,
        sampleSize: 0,
        confidenceLevel: 95,
        statisticallySignificant: false,
        monthlyReturns: [],
        performanceTrend: 'Insufficient Data',
        lastCalculated: new Date().toISOString(),
        calculationVersion: 1
      },
      ...formData
    } as ProfessionalStrategy;

    onSave(completeStrategy);
  };

  // Render step indicator
  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-6">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <button
            onClick={() => handleStepClick(index)}
            className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
              index === currentStep
                ? 'border-blue-500 bg-blue-500 text-white'
                : step.isComplete
                ? 'border-green-500 bg-green-500 text-white'
                : step.hasErrors
                ? 'border-red-500 bg-red-50 text-red-500'
                : 'border-gray-300 bg-gray-50 text-gray-500'
            }`}
          >
            {step.isComplete ? (
              <CheckCircle className="w-5 h-5" />
            ) : step.hasErrors ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <span className="text-sm font-medium">{index + 1}</span>
            )}
          </button>
          
          {index < steps.length - 1 && (
            <div className={`w-16 h-0.5 mx-2 ${
              step.isComplete ? 'bg-green-500' : 'bg-gray-300'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  // Render current step content
  const renderStepContent = () => {
    const currentStepData = steps[currentStep];
    const StepComponent = currentStepData.component;
    const stepValidation = validationResults[currentStepData.id];

    return (
      <div className="space-y-6">
        {/* Step header */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{currentStepData.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{currentStepData.description}</p>
        </div>

        {/* Validation alerts */}
        {stepValidation?.errors?.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                {stepValidation.errors.map((error, index) => (
                  <div key={index}>{error.message}</div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {stepValidation?.warnings?.length > 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                {stepValidation.warnings.map((warning, index) => (
                  <div key={index}>{warning.message}</div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Step component */}
        <StepComponent
          data={formData}
          onChange={handleFormDataUpdate}
          validation={stepValidation}
          isValidating={isValidating}
        />
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>
              {mode === 'create' ? 'Create Professional Strategy' :
               mode === 'edit' ? 'Edit Strategy' :
               'Migrate to Professional Strategy'}
            </span>
            <div className="text-sm text-gray-500">
              Step {currentStep + 1} of {steps.length}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Progress indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm text-gray-500">{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step indicator */}
          {renderStepIndicator()}

          {/* Step content */}
          <Card>
            <CardContent className="p-6">
              {renderStepContent()}
            </CardContent>
          </Card>
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="outline"
            onClick={handlePreviousStep}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            
            {currentStep === steps.length - 1 ? (
              <Button 
                onClick={handleSubmit}
                disabled={!steps.every(step => step.isComplete) || isValidating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {mode === 'create' ? 'Create Strategy' : 'Save Changes'}
              </Button>
            ) : (
              <Button
                onClick={handleNextStep}
                disabled={!steps[currentStep].isComplete || isValidating}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};