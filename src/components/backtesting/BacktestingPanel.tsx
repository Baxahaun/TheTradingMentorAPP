import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  BacktestingService, 
  BacktestResult, 
  VersionComparison, 
  SimulationResult,
  StrategyModification 
} from '../../services/BacktestingService';
import { ProfessionalStrategy, Trade } from '../../types/strategy';
import { BacktestResultsChart } from './BacktestResultsChart';
import { VersionComparisonChart } from './VersionComparisonChart';
import { SimulationResultsChart } from './SimulationResultsChart';
import { Play, BarChart3, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface BacktestingPanelProps {
  strategy: ProfessionalStrategy;
  historicalTrades: Trade[];
  onStrategyUpdate?: (strategy: ProfessionalStrategy) => void;
}

export const BacktestingPanel: React.FC<BacktestingPanelProps> = ({
  strategy,
  historicalTrades,
  onStrategyUpdate
}) => {
  const [backtestingService] = useState(() => new BacktestingService());
  const [activeTab, setActiveTab] = useState('backtest');
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Backtest state
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [modifications, setModifications] = useState<StrategyModification[]>([]);
  
  // Version comparison state
  const [comparisonResult, setComparisonResult] = useState<VersionComparison | null>(null);
  const [modifiedStrategy, setModifiedStrategy] = useState<ProfessionalStrategy | null>(null);
  
  // Simulation state
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [riskParams, setRiskParams] = useState({
    maxRiskPerTrade: strategy.riskManagement.maxRiskPerTrade,
    riskRewardRatio: strategy.riskManagement.riskRewardRatio,
    stopLossMultiplier: 2,
    takeProfitRatio: 2
  });

  const [error, setError] = useState<string | null>(null);

  /**
   * Run backtest with current modifications
   */
  const runBacktest = async () => {
    if (historicalTrades.length === 0) {
      setError('No historical trades available for backtesting');
      return;
    }

    setIsRunning(true);
    setProgress(0);
    setError(null);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await backtestingService.runBacktest(
        strategy,
        historicalTrades,
        modifications
      );

      clearInterval(progressInterval);
      setProgress(100);
      setBacktestResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Backtest failed');
    } finally {
      setIsRunning(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  /**
   * Run version comparison
   */
  const runVersionComparison = async () => {
    if (!modifiedStrategy) {
      setError('Please create a modified strategy version first');
      return;
    }

    setIsRunning(true);
    setError(null);

    try {
      const result = await backtestingService.compareStrategyVersions(
        strategy,
        modifiedStrategy,
        historicalTrades
      );
      setComparisonResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Version comparison failed');
    } finally {
      setIsRunning(false);
    }
  };

  /**
   * Run risk management simulation
   */
  const runSimulation = async () => {
    setIsRunning(true);
    setError(null);

    try {
      const result = await backtestingService.simulateRiskManagementChanges(
        strategy,
        riskParams
      );
      setSimulationResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simulation failed');
    } finally {
      setIsRunning(false);
    }
  };

  /**
   * Add a new modification
   */
  const addModification = () => {
    const newModification: StrategyModification = {
      type: 'StopLoss',
      field: 'multiplier',
      originalValue: 2,
      newValue: 1.5,
      description: 'Tighter stop loss'
    };
    setModifications([...modifications, newModification]);
  };

  /**
   * Update a modification
   */
  const updateModification = (index: number, modification: StrategyModification) => {
    const updated = [...modifications];
    updated[index] = modification;
    setModifications(updated);
  };

  /**
   * Remove a modification
   */
  const removeModification = (index: number) => {
    setModifications(modifications.filter((_, i) => i !== index));
  };

  /**
   * Create modified strategy for version comparison
   */
  const createModifiedStrategy = () => {
    const modified: ProfessionalStrategy = {
      ...strategy,
      id: `${strategy.id}_modified`,
      title: `${strategy.title} (Modified)`,
      version: strategy.version + 1,
      riskManagement: {
        ...strategy.riskManagement,
        maxRiskPerTrade: riskParams.maxRiskPerTrade,
        riskRewardRatio: riskParams.riskRewardRatio
      }
    };
    setModifiedStrategy(modified);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Strategy Backtesting & Simulation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="backtest">Backtest</TabsTrigger>
              <TabsTrigger value="comparison">Version Compare</TabsTrigger>
              <TabsTrigger value="simulation">Risk Simulation</TabsTrigger>
            </TabsList>

            {/* Backtest Tab */}
            <TabsContent value="backtest" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Modifications</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {modifications.map((mod, index) => (
                      <div key={index} className="p-3 border rounded-lg space-y-2">
                        <div className="flex justify-between items-center">
                          <Badge variant="outline">{mod.type}</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeModification(index)}
                          >
                            Remove
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Field</Label>
                            <Input
                              value={mod.field}
                              onChange={(e) => updateModification(index, {
                                ...mod,
                                field: e.target.value
                              })}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">New Value</Label>
                            <Input
                              value={mod.newValue}
                              onChange={(e) => updateModification(index, {
                                ...mod,
                                newValue: e.target.value
                              })}
                            />
                          </div>
                        </div>
                        <Input
                          placeholder="Description"
                          value={mod.description}
                          onChange={(e) => updateModification(index, {
                            ...mod,
                            description: e.target.value
                          })}
                        />
                      </div>
                    ))}
                    <Button onClick={addModification} variant="outline" className="w-full">
                      Add Modification
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Run Backtest</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Historical Trades:</span>
                        <span className="font-medium">{historicalTrades.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Modifications:</span>
                        <span className="font-medium">{modifications.length}</span>
                      </div>
                    </div>
                    
                    {isRunning && (
                      <div className="space-y-2">
                        <Progress value={progress} />
                        <p className="text-sm text-muted-foreground text-center">
                          Running backtest...
                        </p>
                      </div>
                    )}

                    <Button 
                      onClick={runBacktest} 
                      disabled={isRunning || historicalTrades.length === 0}
                      className="w-full"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Run Backtest
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {backtestResult && (
                <BacktestResultsChart result={backtestResult} />
              )}
            </TabsContent>

            {/* Version Comparison Tab */}
            <TabsContent value="comparison" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Create Modified Version</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Max Risk Per Trade (%)</Label>
                      <Input
                        type="number"
                        value={riskParams.maxRiskPerTrade}
                        onChange={(e) => setRiskParams({
                          ...riskParams,
                          maxRiskPerTrade: parseFloat(e.target.value)
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Risk-Reward Ratio</Label>
                      <Input
                        type="number"
                        value={riskParams.riskRewardRatio}
                        onChange={(e) => setRiskParams({
                          ...riskParams,
                          riskRewardRatio: parseFloat(e.target.value)
                        })}
                      />
                    </div>
                    <Button onClick={createModifiedStrategy} className="w-full">
                      Create Modified Version
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Compare Versions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {modifiedStrategy ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Modified version created</span>
                        </div>
                        <Button onClick={runVersionComparison} disabled={isRunning} className="w-full">
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Compare Versions
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm">Create a modified version first</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {comparisonResult && (
                <VersionComparisonChart result={comparisonResult} />
              )}
            </TabsContent>

            {/* Risk Simulation Tab */}
            <TabsContent value="simulation" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Risk Management Simulation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Stop Loss Multiplier</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={riskParams.stopLossMultiplier}
                        onChange={(e) => setRiskParams({
                          ...riskParams,
                          stopLossMultiplier: parseFloat(e.target.value)
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Take Profit Ratio</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={riskParams.takeProfitRatio}
                        onChange={(e) => setRiskParams({
                          ...riskParams,
                          takeProfitRatio: parseFloat(e.target.value)
                        })}
                      />
                    </div>
                  </div>
                  <Button onClick={runSimulation} disabled={isRunning} className="w-full">
                    Run Monte Carlo Simulation
                  </Button>
                </CardContent>
              </Card>

              {simulationResult && (
                <SimulationResultsChart result={simulationResult} />
              )}
            </TabsContent>
          </Tabs>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};