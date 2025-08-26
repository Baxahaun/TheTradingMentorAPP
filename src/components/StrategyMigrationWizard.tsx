/**
 * Strategy Migration Wizard Component
 * Provides guided migration from legacy playbooks to professional strategies
 */

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Info,
  Upload,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  LegacyPlaybook,
  MigrationWizardState,
  MigrationStep,
  MigrationFormData,
  MigrationResult,
  MigrationValidationResult,
  MIGRATION_STEPS,
  MIGRATION_DEFAULTS
} from '../types/migration';
import {
  METHODOLOGY_TYPES,
  POSITION_SIZING_TYPES,
  STOP_LOSS_TYPES,
  TAKE_PROFIT_TYPES
} from '../types/strategy';
import { StrategyMigrationService } from '../services/StrategyMigrationService';

interface StrategyMigrationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  playbook: LegacyPlaybook | null;
  onMigrationComplete: (result: MigrationResult) => void;
  onMigrationError: (error: string) => void;
}

export const StrategyMigrationWizard: React.FC<StrategyMigrationWizardProps> = ({
  isOpen,
  onClose,
  playbook,
  onMigrationComplete,
  onMigrationError
}) => {
  const [migrationService] = useState(() => new StrategyMigrationService());
  const [wizardState, setWizardState] = useState<MigrationWizardState | null>(null);
  const [formData, setFormData] = useState<MigrationFormData | null>(null);
  const [validation, setValidation] = useState<MigrationValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize wizard when playbook changes
  useEffect(() => {
    if (playbook && isOpen) {
      initializeWizard(playbook);
    }
  }, [playbook, isOpen]);

  const initializeWizard = async (playbook: LegacyPlaybook) => {
    setIsLoading(true);

    try {
      // Validate playbook for migration
      const validationResult = await migrationService.validateForMigration(playbook);
      setValidation(validationResult);

      // Get default form data
      const defaultFormData = migrationService.getDefaultFormData(playbook);
      setFormData(defaultFormData);

      // Initialize wizard state
      const steps: MigrationStep[] = MIGRATION_STEPS.map(step => ({
        ...step,
        status: 'pending'
      }));

      setWizardState({
        currentStep: 0,
        totalSteps: steps.length,
        steps,
        sourcePlaybook: playbook,
        targetStrategy: {},
        userInputs: {},
        validationErrors: {},
        canProceed: validationResult.canProceed,
        canGoBack: false,
        isCompleted: false
      });

    } catch (error) {
      onMigrationError(error instanceof Error ? error.message : 'Failed to initialize migration wizard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = async () => {
    if (!wizardState || !formData) return;

    // Mark current step as in progress
    updateStepStatus(wizardState.currentStep, 'in_progress');

    try {
      // Validate current step
      const isValid = await validateCurrentStep();
      if (!isValid) {
        updateStepStatus(wizardState.currentStep, 'failed');
        return;
      }

      // Mark current step as completed
      updateStepStatus(wizardState.currentStep, 'completed');

      // Move to next step or complete migration
      if (wizardState.currentStep < wizardState.totalSteps - 1) {
        setWizardState(prev => prev ? {
          ...prev,
          currentStep: prev.currentStep + 1,
          canGoBack: true,
          canProceed: true
        } : null);
      } else {
        // Complete migration
        await completeMigration();
      }

    } catch (error) {
      updateStepStatus(wizardState.currentStep, 'failed',
        error instanceof Error ? error.message : 'Step validation failed');
    }
  };

  const handleBack = () => {
    if (!wizardState || wizardState.currentStep === 0) return;

    setWizardState(prev => prev ? {
      ...prev,
      currentStep: prev.currentStep - 1,
      canGoBack: prev.currentStep > 1,
      canProceed: true
    } : null);
  };

  const updateStepStatus = (stepIndex: number, status: MigrationStep['status'], error?: string) => {
    setWizardState(prev => {
      if (!prev) return null;

      const updatedSteps = [...prev.steps];
      const currentStep = updatedSteps[stepIndex];
      if (currentStep) {
        updatedSteps[stepIndex] = {
          ...currentStep,
          status,
          error,
          completedAt: status === 'completed' ? new Date().toISOString() : undefined
        };
      }

      return {
        ...prev,
        steps: updatedSteps
      };
    });
  };

  const validateCurrentStep = async (): Promise<boolean> => {
    if (!wizardState || !formData) return false;

    const currentStep = wizardState.steps[wizardState.currentStep];
    if (!currentStep) return false;

    switch (currentStep.id) {
      case 'configure_methodology':
        return !!(formData.methodology && formData.primaryTimeframe);

      case 'enhance_setup_conditions':
        return formData.technicalConditions.length > 0;

      case 'configure_entry_triggers':
        return !!(formData.confirmationSignals.length > 0 && formData.timingCriteria);

      case 'setup_risk_management':
        return !!(
          formData.positionSizingMethod &&
          formData.maxRiskPerTrade > 0 &&
          formData.stopLossRule &&
          formData.takeProfitRule &&
          formData.riskRewardRatio > 0
        );

      default:
        return true;
    }
  };

  const completeMigration = async () => {
    if (!wizardState || !formData || !playbook) return;

    setIsLoading(true);

    try {
      const result = await migrationService.migratePlaybook(playbook, formData);

      setWizardState(prev => prev ? {
        ...prev,
        isCompleted: true
      } : null);

      onMigrationComplete(result);

    } catch (error) {
      onMigrationError(error instanceof Error ? error.message : 'Migration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: keyof MigrationFormData, value: any) => {
    setFormData(prev => prev ? {
      ...prev,
      [field]: value
    } : null);
  };

  const renderStepContent = () => {
    if (!wizardState || !formData) return null;

    const currentStep = wizardState.steps[wizardState.currentStep];

    switch (currentStep.id) {
      case 'validate_source':
        return renderValidationStep();

      case 'configure_methodology':
        return renderMethodologyStep();

      case 'enhance_setup_conditions':
        return renderSetupConditionsStep();

      case 'configure_entry_triggers':
        return renderEntryTriggersStep();

      case 'setup_risk_management':
        return renderRiskManagementStep();

      case 'finalize_migration':
        return renderFinalizationStep();

      default:
        return renderDefaultStep();
    }
  };

  const renderValidationStep = () => (
    <div className="space-y-4">
      <div className="text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold">Validating Playbook Data</h3>
        <p className="text-gray-600">Checking compatibility for migration...</p>
      </div>

      {validation && (
        <div className="space-y-3">
          {validation.errors.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {validation.errors.map((error, index) => (
                    <div key={index} className="text-red-600">
                      {error.message}
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {validation.warnings.length > 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {validation.warnings.map((warning, index) => (
                    <div key={index} className="text-yellow-600">
                      {warning.message}
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );

  const renderMethodologyStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Configure Trading Methodology</h3>
        <p className="text-gray-600 mb-4">
          Define the core approach and timeframe for your strategy.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="methodology">Trading Methodology</Label>
          <Select
            value={formData?.methodology}
            onValueChange={(value) => updateFormData('methodology', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select methodology" />
            </SelectTrigger>
            <SelectContent>
              {METHODOLOGY_TYPES.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="timeframe">Primary Timeframe</Label>
          <Select
            value={formData?.primaryTimeframe}
            onValueChange={(value) => updateFormData('primaryTimeframe', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1M">1 Minute</SelectItem>
              <SelectItem value="5M">5 Minutes</SelectItem>
              <SelectItem value="15M">15 Minutes</SelectItem>
              <SelectItem value="30M">30 Minutes</SelectItem>
              <SelectItem value="1H">1 Hour</SelectItem>
              <SelectItem value="4H">4 Hours</SelectItem>
              <SelectItem value="1D">Daily</SelectItem>
              <SelectItem value="1W">Weekly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="assetClasses">Asset Classes</Label>
        <div className="mt-2 space-y-2">
          {['Forex', 'Stocks', 'Indices', 'Commodities', 'Crypto'].map(asset => (
            <label key={asset} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData?.assetClasses.includes(asset) || false}
                onChange={(e) => {
                  const current = formData?.assetClasses || [];
                  const updated = e.target.checked
                    ? [...current, asset]
                    : current.filter(a => a !== asset);
                  updateFormData('assetClasses', updated);
                }}
                className="rounded"
              />
              <span>{asset}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSetupConditionsStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Enhance Setup Conditions</h3>
        <p className="text-gray-600 mb-4">
          Transform your market conditions into professional setup criteria.
        </p>
      </div>

      <div>
        <Label htmlFor="technicalConditions">Technical Conditions</Label>
        <p className="text-sm text-gray-500 mb-2">
          Add specific technical analysis conditions (one per line)
        </p>
        <Textarea
          value={formData?.technicalConditions.join('\n') || ''}
          onChange={(e) => updateFormData('technicalConditions',
            e.target.value.split('\n').filter(line => line.trim()))}
          placeholder="RSI above 50&#10;MACD bullish crossover&#10;Price above 20 EMA"
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="volatilityRequirements">Volatility Requirements (Optional)</Label>
        <Input
          value={formData?.volatilityRequirements || ''}
          onChange={(e) => updateFormData('volatilityRequirements', e.target.value)}
          placeholder="e.g., ATR > 50 pips, Low volatility environment"
        />
      </div>
    </div>
  );

  const renderEntryTriggersStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Configure Entry Triggers</h3>
        <p className="text-gray-600 mb-4">
          Define specific signals and timing for trade execution.
        </p>
      </div>

      <div>
        <Label htmlFor="confirmationSignals">Confirmation Signals</Label>
        <p className="text-sm text-gray-500 mb-2">
          Additional signals that confirm the entry (one per line)
        </p>
        <Textarea
          value={formData?.confirmationSignals.join('\n') || ''}
          onChange={(e) => updateFormData('confirmationSignals',
            e.target.value.split('\n').filter(line => line.trim()))}
          placeholder="Volume spike&#10;Candlestick pattern&#10;Support/resistance break"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="timingCriteria">Timing Criteria</Label>
        <Input
          value={formData?.timingCriteria || ''}
          onChange={(e) => updateFormData('timingCriteria', e.target.value)}
          placeholder="e.g., London/NY session overlap, Avoid news events"
        />
      </div>
    </div>
  );

  const renderRiskManagementStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Setup Risk Management</h3>
        <p className="text-gray-600 mb-4">
          Configure professional risk management rules.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="positionSizing">Position Sizing Method</Label>
          <Select
            value={formData?.positionSizingMethod.type}
            onValueChange={(value) => updateFormData('positionSizingMethod', {
              type: value,
              parameters: MIGRATION_DEFAULTS.positionSizingMethod.parameters
            })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select method" />
            </SelectTrigger>
            <SelectContent>
              {POSITION_SIZING_TYPES.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="maxRisk">Max Risk Per Trade (%)</Label>
          <Input
            type="number"
            min="0.1"
            max="10"
            step="0.1"
            value={formData?.maxRiskPerTrade || ''}
            onChange={(e) => updateFormData('maxRiskPerTrade', parseFloat(e.target.value))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="stopLoss">Stop Loss Rule</Label>
          <Select
            value={formData?.stopLossRule.type}
            onValueChange={(value) => updateFormData('stopLossRule', {
              type: value,
              parameters: MIGRATION_DEFAULTS.stopLossRule.parameters,
              description: `${value} stop loss rule`
            })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select rule" />
            </SelectTrigger>
            <SelectContent>
              {STOP_LOSS_TYPES.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="takeProfit">Take Profit Rule</Label>
          <Select
            value={formData?.takeProfitRule.type}
            onValueChange={(value) => updateFormData('takeProfitRule', {
              type: value,
              parameters: MIGRATION_DEFAULTS.takeProfitRule.parameters,
              description: `${value} take profit rule`
            })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select rule" />
            </SelectTrigger>
            <SelectContent>
              {TAKE_PROFIT_TYPES.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="riskReward">Risk-Reward Ratio</Label>
        <Input
          type="number"
          min="1"
          max="10"
          step="0.1"
          value={formData?.riskRewardRatio || ''}
          onChange={(e) => updateFormData('riskRewardRatio', parseFloat(e.target.value))}
        />
      </div>
    </div>
  );

  const renderFinalizationStep = () => (
    <div className="space-y-4 text-center">
      <Upload className="w-12 h-12 text-blue-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold">Finalizing Migration</h3>
      <p className="text-gray-600">
        Creating your professional strategy and preserving original data...
      </p>
      {isLoading && (
        <div className="mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      )}
    </div>
  );

  const renderDefaultStep = () => (
    <div className="space-y-4 text-center">
      <Info className="w-12 h-12 text-blue-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold">Processing Step</h3>
      <p className="text-gray-600">
        {wizardState?.steps[wizardState.currentStep]?.description}
      </p>
    </div>
  );

  if (!isOpen || !playbook) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <Upload className="w-5 h-5" />
              <span>Migrate to Professional Strategy</span>
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {wizardState && (
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Step {wizardState.currentStep + 1} of {wizardState.totalSteps}</span>
                <span>{Math.round(((wizardState.currentStep + 1) / wizardState.totalSteps) * 100)}%</span>
              </div>
              <Progress value={((wizardState.currentStep + 1) / wizardState.totalSteps) * 100} />
            </div>

            {/* Current Step */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>{wizardState.steps[wizardState.currentStep]?.name}</span>
                  <Badge variant={
                    wizardState.steps[wizardState.currentStep]?.status === 'completed' ? 'default' :
                      wizardState.steps[wizardState.currentStep]?.status === 'failed' ? 'destructive' :
                        wizardState.steps[wizardState.currentStep]?.status === 'in_progress' ? 'secondary' :
                          'outline'
                  }>
                    {wizardState.steps[wizardState.currentStep]?.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderStepContent()}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={!wizardState.canGoBack || isLoading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              <div className="space-x-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!wizardState.canProceed || isLoading}
                >
                  {wizardState.currentStep === wizardState.totalSteps - 1 ? 'Complete Migration' : 'Next'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StrategyMigrationWizard;