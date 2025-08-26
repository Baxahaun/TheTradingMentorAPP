import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { RiskManagementBuilder } from '../RiskManagementBuilder';
import { ProfessionalStrategy } from '@/types/strategy';

describe('RiskManagementBuilder', () => {
  const mockOnChange = vi.fn();
  
  const defaultProps = {
    data: {} as Partial<ProfessionalStrategy>,
    onChange: mockOnChange
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders position sizing section', () => {
    render(<RiskManagementBuilder {...defaultProps} />);
    
    expect(screen.getByText(/position sizing method/i)).toBeInTheDocument();
    expect(screen.getByText('Fixed Percentage')).toBeInTheDocument();
    expect(screen.getByText('Fixed Dollar')).toBeInTheDocument();
    expect(screen.getByText('Volatility Based')).toBeInTheDocument();
    expect(screen.getByText('Kelly Formula')).toBeInTheDocument();
  });

  it('renders maximum risk section', () => {
    render(<RiskManagementBuilder {...defaultProps} />);
    
    expect(screen.getByText(/maximum risk per trade/i)).toBeInTheDocument();
    expect(screen.getByText(/maximum risk percentage/i)).toBeInTheDocument();
  });

  it('renders stop loss rules section', () => {
    render(<RiskManagementBuilder {...defaultProps} />);
    
    expect(screen.getByText(/stop loss rules/i)).toBeInTheDocument();
    expect(screen.getByText('ATR Based')).toBeInTheDocument();
    expect(screen.getByText('Percentage Based')).toBeInTheDocument();
    expect(screen.getByText('Structure Based')).toBeInTheDocument();
    expect(screen.getByText('Volatility Based')).toBeInTheDocument();
  });

  it('renders take profit rules section', () => {
    render(<RiskManagementBuilder {...defaultProps} />);
    
    expect(screen.getByText(/take profit rules/i)).toBeInTheDocument();
    expect(screen.getByText('Risk Reward Ratio')).toBeInTheDocument();
    expect(screen.getByText('Structure Based')).toBeInTheDocument();
    expect(screen.getByText('Trailing Stop')).toBeInTheDocument();
    expect(screen.getByText('Partial Targets')).toBeInTheDocument();
  });

  it('selects position sizing method', async () => {
    const user = userEvent.setup();
    render(<RiskManagementBuilder {...defaultProps} />);
    
    const fixedDollarOption = screen.getByText('Fixed Dollar').closest('div');
    await user.click(fixedDollarOption!);
    
    expect(mockOnChange).toHaveBeenCalledWith({
      riskManagement: expect.objectContaining({
        positionSizingMethod: {
          type: 'FixedDollar',
          parameters: { dollarAmount: 1000 }
        }
      })
    });
  });

  it('highlights selected position sizing method', () => {
    const dataWithPositionSizing = {
      riskManagement: {
        positionSizingMethod: {
          type: 'VolatilityBased' as const,
          parameters: { atrMultiplier: 1, atrPeriod: 14 }
        },
        maxRiskPerTrade: 2,
        stopLossRule: {
          type: 'PercentageBased' as const,
          parameters: { percentage: 2 },
          description: '2% stop loss'
        },
        takeProfitRule: {
          type: 'RiskRewardRatio' as const,
          parameters: { ratio: 2 },
          description: '2:1 risk-reward ratio'
        },
        riskRewardRatio: 2
      }
    };
    
    render(<RiskManagementBuilder {...defaultProps} data={dataWithPositionSizing} />);
    
    const volatilityBasedOption = screen.getByText('Volatility Based').closest('div');
    expect(volatilityBasedOption).toHaveClass('border-blue-500', 'bg-blue-50');
  });

  it('shows position sizing parameters for FixedPercentage', () => {
    const dataWithFixedPercentage = {
      riskManagement: {
        positionSizingMethod: {
          type: 'FixedPercentage' as const,
          parameters: { percentage: 2 }
        },
        maxRiskPerTrade: 2,
        stopLossRule: {
          type: 'PercentageBased' as const,
          parameters: { percentage: 2 },
          description: '2% stop loss'
        },
        takeProfitRule: {
          type: 'RiskRewardRatio' as const,
          parameters: { ratio: 2 },
          description: '2:1 risk-reward ratio'
        },
        riskRewardRatio: 2
      }
    };
    
    render(<RiskManagementBuilder {...defaultProps} data={dataWithFixedPercentage} />);
    
    expect(screen.getByText(/risk percentage per trade/i)).toBeInTheDocument();
    expect(screen.getByText('2%')).toBeInTheDocument();
  });

  it('shows position sizing parameters for FixedDollar', () => {
    const dataWithFixedDollar = {
      riskManagement: {
        positionSizingMethod: {
          type: 'FixedDollar' as const,
          parameters: { dollarAmount: 1000 }
        },
        maxRiskPerTrade: 2,
        stopLossRule: {
          type: 'PercentageBased' as const,
          parameters: { percentage: 2 },
          description: '2% stop loss'
        },
        takeProfitRule: {
          type: 'RiskRewardRatio' as const,
          parameters: { ratio: 2 },
          description: '2:1 risk-reward ratio'
        },
        riskRewardRatio: 2
      }
    };
    
    render(<RiskManagementBuilder {...defaultProps} data={dataWithFixedDollar} />);
    
    expect(screen.getByText(/dollar amount per trade/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('1000')).toBeInTheDocument();
  });

  it('shows position sizing parameters for VolatilityBased', () => {
    const dataWithVolatilityBased = {
      riskManagement: {
        positionSizingMethod: {
          type: 'VolatilityBased' as const,
          parameters: { atrMultiplier: 1.5, atrPeriod: 20 }
        },
        maxRiskPerTrade: 2,
        stopLossRule: {
          type: 'PercentageBased' as const,
          parameters: { percentage: 2 },
          description: '2% stop loss'
        },
        takeProfitRule: {
          type: 'RiskRewardRatio' as const,
          parameters: { ratio: 2 },
          description: '2:1 risk-reward ratio'
        },
        riskRewardRatio: 2
      }
    };
    
    render(<RiskManagementBuilder {...defaultProps} data={dataWithVolatilityBased} />);
    
    expect(screen.getByText(/atr multiplier/i)).toBeInTheDocument();
    expect(screen.getByText(/atr period/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('1.5')).toBeInTheDocument();
    expect(screen.getByDisplayValue('20')).toBeInTheDocument();
  });

  it('updates maximum risk per trade', async () => {
    const user = userEvent.setup();
    render(<RiskManagementBuilder {...defaultProps} />);
    
    // Find the slider and simulate changing it
    // Note: This is a simplified test - in reality, slider interaction is more complex
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '3' } });
    
    expect(mockOnChange).toHaveBeenCalledWith({
      riskManagement: expect.objectContaining({
        maxRiskPerTrade: 3
      })
    });
  });

  it('shows high risk warning when risk exceeds 5%', () => {
    const dataWithHighRisk = {
      riskManagement: {
        positionSizingMethod: {
          type: 'FixedPercentage' as const,
          parameters: { percentage: 2 }
        },
        maxRiskPerTrade: 6,
        stopLossRule: {
          type: 'PercentageBased' as const,
          parameters: { percentage: 2 },
          description: '2% stop loss'
        },
        takeProfitRule: {
          type: 'RiskRewardRatio' as const,
          parameters: { ratio: 2 },
          description: '2:1 risk-reward ratio'
        },
        riskRewardRatio: 2
      }
    };
    
    render(<RiskManagementBuilder {...defaultProps} data={dataWithHighRisk} />);
    
    expect(screen.getByText(/high risk per trade/i)).toBeInTheDocument();
    expect(screen.getByText(/consider reducing to 2-3%/i)).toBeInTheDocument();
  });

  it('selects stop loss rule', async () => {
    const user = userEvent.setup();
    render(<RiskManagementBuilder {...defaultProps} />);
    
    const atrBasedOption = screen.getByText('ATR Based').closest('div');
    await user.click(atrBasedOption!);
    
    expect(mockOnChange).toHaveBeenCalledWith({
      riskManagement: expect.objectContaining({
        stopLossRule: {
          type: 'ATRBased',
          parameters: { atrMultiplier: 2, atrPeriod: 14 },
          description: '2x ATR stop loss'
        }
      })
    });
  });

  it('highlights selected stop loss rule', () => {
    const dataWithStopLoss = {
      riskManagement: {
        positionSizingMethod: {
          type: 'FixedPercentage' as const,
          parameters: { percentage: 2 }
        },
        maxRiskPerTrade: 2,
        stopLossRule: {
          type: 'ATRBased' as const,
          parameters: { atrMultiplier: 2, atrPeriod: 14 },
          description: '2x ATR stop loss'
        },
        takeProfitRule: {
          type: 'RiskRewardRatio' as const,
          parameters: { ratio: 2 },
          description: '2:1 risk-reward ratio'
        },
        riskRewardRatio: 2
      }
    };
    
    render(<RiskManagementBuilder {...defaultProps} data={dataWithStopLoss} />);
    
    const atrBasedOption = screen.getByText('ATR Based').closest('div');
    expect(atrBasedOption).toHaveClass('border-red-500', 'bg-red-50');
  });

  it('shows stop loss parameters for PercentageBased', () => {
    const dataWithPercentageStopLoss = {
      riskManagement: {
        positionSizingMethod: {
          type: 'FixedPercentage' as const,
          parameters: { percentage: 2 }
        },
        maxRiskPerTrade: 2,
        stopLossRule: {
          type: 'PercentageBased' as const,
          parameters: { percentage: 3 },
          description: '3% stop loss'
        },
        takeProfitRule: {
          type: 'RiskRewardRatio' as const,
          parameters: { ratio: 2 },
          description: '2:1 risk-reward ratio'
        },
        riskRewardRatio: 2
      }
    };
    
    render(<RiskManagementBuilder {...defaultProps} data={dataWithPercentageStopLoss} />);
    
    expect(screen.getByText(/stop loss percentage/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('3')).toBeInTheDocument();
  });

  it('shows stop loss parameters for ATRBased', () => {
    const dataWithATRStopLoss = {
      riskManagement: {
        positionSizingMethod: {
          type: 'FixedPercentage' as const,
          parameters: { percentage: 2 }
        },
        maxRiskPerTrade: 2,
        stopLossRule: {
          type: 'ATRBased' as const,
          parameters: { atrMultiplier: 2.5, atrPeriod: 21 },
          description: '2.5x ATR stop loss'
        },
        takeProfitRule: {
          type: 'RiskRewardRatio' as const,
          parameters: { ratio: 2 },
          description: '2:1 risk-reward ratio'
        },
        riskRewardRatio: 2
      }
    };
    
    render(<RiskManagementBuilder {...defaultProps} data={dataWithATRStopLoss} />);
    
    expect(screen.getByDisplayValue('2.5')).toBeInTheDocument();
    expect(screen.getByDisplayValue('21')).toBeInTheDocument();
  });

  it('selects take profit rule', async () => {
    const user = userEvent.setup();
    render(<RiskManagementBuilder {...defaultProps} />);
    
    const trailingStopOption = screen.getByText('Trailing Stop').closest('div');
    await user.click(trailingStopOption!);
    
    expect(mockOnChange).toHaveBeenCalledWith({
      riskManagement: expect.objectContaining({
        takeProfitRule: {
          type: 'TrailingStop',
          parameters: { trailDistance: 20, trailType: 'fixed' },
          description: 'Trailing stop profit management'
        }
      })
    });
  });

  it('highlights selected take profit rule', () => {
    const dataWithTakeProfit = {
      riskManagement: {
        positionSizingMethod: {
          type: 'FixedPercentage' as const,
          parameters: { percentage: 2 }
        },
        maxRiskPerTrade: 2,
        stopLossRule: {
          type: 'PercentageBased' as const,
          parameters: { percentage: 2 },
          description: '2% stop loss'
        },
        takeProfitRule: {
          type: 'StructureBased' as const,
          parameters: { structureType: 'resistance_support' },
          description: 'Structure-based profit target'
        },
        riskRewardRatio: 2
      }
    };
    
    render(<RiskManagementBuilder {...defaultProps} data={dataWithTakeProfit} />);
    
    const structureBasedOption = screen.getByText('Structure Based').closest('div');
    expect(structureBasedOption).toHaveClass('border-green-500', 'bg-green-50');
  });

  it('shows take profit parameters for RiskRewardRatio', () => {
    const dataWithRRRatio = {
      riskManagement: {
        positionSizingMethod: {
          type: 'FixedPercentage' as const,
          parameters: { percentage: 2 }
        },
        maxRiskPerTrade: 2,
        stopLossRule: {
          type: 'PercentageBased' as const,
          parameters: { percentage: 2 },
          description: '2% stop loss'
        },
        takeProfitRule: {
          type: 'RiskRewardRatio' as const,
          parameters: { ratio: 3 },
          description: '3:1 risk-reward ratio'
        },
        riskRewardRatio: 3
      }
    };
    
    render(<RiskManagementBuilder {...defaultProps} data={dataWithRRRatio} />);
    
    expect(screen.getByText(/risk-reward ratio/i)).toBeInTheDocument();
    expect(screen.getByText('3.0:1')).toBeInTheDocument();
  });

  it('updates stop loss description', async () => {
    const user = userEvent.setup();
    render(<RiskManagementBuilder {...defaultProps} />);
    
    const descriptionInput = screen.getByLabelText(/stop loss description/i);
    await user.type(descriptionInput, 'Custom stop loss approach');
    
    expect(mockOnChange).toHaveBeenCalledWith({
      riskManagement: expect.objectContaining({
        stopLossRule: expect.objectContaining({
          description: 'Custom stop loss approach'
        })
      })
    });
  });

  it('updates take profit description', async () => {
    const user = userEvent.setup();
    render(<RiskManagementBuilder {...defaultProps} />);
    
    const descriptionInput = screen.getByLabelText(/take profit description/i);
    await user.type(descriptionInput, 'Custom profit taking approach');
    
    expect(mockOnChange).toHaveBeenCalledWith({
      riskManagement: expect.objectContaining({
        takeProfitRule: expect.objectContaining({
          description: 'Custom profit taking approach'
        })
      })
    });
  });

  it('shows position size preview', () => {
    render(<RiskManagementBuilder {...defaultProps} />);
    
    expect(screen.getByText('Position Size Preview')).toBeInTheDocument();
    expect(screen.getByText(/with a \$10,000 account/i)).toBeInTheDocument();
  });

  it('shows risk management summary', () => {
    const completeData = {
      riskManagement: {
        positionSizingMethod: {
          type: 'FixedPercentage' as const,
          parameters: { percentage: 2 }
        },
        maxRiskPerTrade: 2,
        stopLossRule: {
          type: 'ATRBased' as const,
          parameters: { atrMultiplier: 2, atrPeriod: 14 },
          description: '2x ATR stop loss'
        },
        takeProfitRule: {
          type: 'RiskRewardRatio' as const,
          parameters: { ratio: 3 },
          description: '3:1 risk-reward ratio'
        },
        riskRewardRatio: 3
      }
    };
    
    render(<RiskManagementBuilder {...defaultProps} data={completeData} />);
    
    expect(screen.getByText('Risk Management Summary')).toBeInTheDocument();
    expect(screen.getByText('Fixed Percentage (2%)')).toBeInTheDocument();
    expect(screen.getByText('2% per trade')).toBeInTheDocument();
    expect(screen.getByText('2x ATR stop loss')).toBeInTheDocument();
    expect(screen.getByText('3:1 risk-reward ratio')).toBeInTheDocument();
  });

  it('displays existing risk management data correctly', () => {
    const existingData = {
      riskManagement: {
        positionSizingMethod: {
          type: 'KellyFormula' as const,
          parameters: { winRate: 65, avgWin: 150, avgLoss: 75 }
        },
        maxRiskPerTrade: 3,
        stopLossRule: {
          type: 'StructureBased' as const,
          parameters: { structureType: 'support_resistance', buffer: 10 },
          description: 'Structure-based stop with 10 pip buffer'
        },
        takeProfitRule: {
          type: 'PartialTargets' as const,
          parameters: { 
            targets: [
              { percentage: 50, ratio: 2 },
              { percentage: 50, ratio: 4 }
            ]
          },
          description: 'Partial profit targets at 2:1 and 4:1'
        },
        riskRewardRatio: 3
      }
    };
    
    render(<RiskManagementBuilder {...defaultProps} data={existingData} />);
    
    const kellyFormulaOption = screen.getByText('Kelly Formula').closest('div');
    expect(kellyFormulaOption).toHaveClass('border-blue-500');
    
    const structureBasedStopOption = screen.getByText('Structure Based').closest('div');
    expect(structureBasedStopOption).toHaveClass('border-red-500');
    
    const partialTargetsOption = screen.getByText('Partial Targets').closest('div');
    expect(partialTargetsOption).toHaveClass('border-green-500');
    
    expect(screen.getByDisplayValue('Structure-based stop with 10 pip buffer')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Partial profit targets at 2:1 and 4:1')).toBeInTheDocument();
  });
});