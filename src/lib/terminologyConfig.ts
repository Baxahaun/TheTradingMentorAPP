// Terminology Configuration System
// Centralizes all terminology mappings from forex to futures trading

export interface TerminologyConfig {
  // Core instrument terminology
  instrumentLabel: string;
  instrumentPlaceholder: string;
  instrumentDescription: string;

  // Position sizing terminology
  positionSizeLabel: string;
  positionSizePlaceholder: string;
  positionSizeDescription: string;
  positionSizeTypeLabel: string;

  // Price movement terminology
  priceMovementLabel: string;
  priceMovementDescription: string;
  priceMovementUnit: string;

  // P&L terminology
  profitLossLabel: string;
  profitLossDescription: string;

  // Risk management terminology
  stopLossLabel: string;
  takeProfitLabel: string;
  riskAmountLabel: string;

  // Trading terminology
  entryPriceLabel: string;
  exitPriceLabel: string;
  spreadLabel: string;
  commissionLabel: string;
  swapLabel: string;

  // Account terminology
  accountCurrencyLabel: string;

  // Validation messages
  validationMessages: {
    required: string;
    invalidFormat: string;
    outOfRange: string;
    exceedsBalance: string;
  };

  // Help text
  helpText: {
    instrumentSelection: string;
    positionSizing: string;
    riskManagement: string;
    pipsVsPoints: string;
  };
}

export interface TerminologyMapping {
  forex: string;
  futures: string;
  description: string;
  context: string[];
}

// Core terminology mappings
export const TERMINOLOGY_MAPPINGS: TerminologyMapping[] = [
  {
    forex: 'pip',
    futures: 'point',
    description: 'Unit of price movement measurement',
    context: ['price movement', 'calculations', 'display']
  },
  {
    forex: 'lot size',
    futures: 'contract size',
    description: 'Size of trading position',
    context: ['position sizing', 'calculations', 'display']
  },
  {
    forex: 'lot type',
    futures: 'contract type',
    description: 'Type of position sizing (standard/mini/micro)',
    context: ['position sizing', 'calculations']
  },
  {
    forex: 'currency pair',
    futures: 'futures instrument',
    description: 'Trading instrument identifier',
    context: ['instrument selection', 'display', 'reporting']
  },
  {
    forex: 'pips gained/lost',
    futures: 'points gained/lost',
    description: 'Profit/loss measurement in price units',
    context: ['p&l calculation', 'display', 'analytics']
  },
  {
    forex: 'pip value',
    futures: 'point value',
    description: 'Monetary value per unit of price movement',
    context: ['p&l calculation', 'risk management']
  },
  {
    forex: 'spread',
    futures: 'commission',
    description: 'Trading cost per transaction',
    context: ['cost calculation', 'p&l calculation']
  },
  {
    forex: 'swap',
    futures: 'carrying cost',
    description: 'Overnight financing cost',
    context: ['cost calculation', 'p&l calculation']
  }
];

// Forex-specific terminology configuration
export const FOREX_TERMINOLOGY: TerminologyConfig = {
  // Core instrument terminology
  instrumentLabel: 'Currency Pair',
  instrumentPlaceholder: 'Select currency pair (e.g., EUR/USD)',
  instrumentDescription: 'The currency pair you want to trade',

  // Position sizing terminology
  positionSizeLabel: 'Lot Size',
  positionSizePlaceholder: 'Enter lot size (e.g., 1.5)',
  positionSizeDescription: 'Number of lots to trade',
  positionSizeTypeLabel: 'Lot Type',

  // Price movement terminology
  priceMovementLabel: 'Pips',
  priceMovementDescription: 'Price movement measured in pips',
  priceMovementUnit: 'pips',

  // P&L terminology
  profitLossLabel: 'P&L',
  profitLossDescription: 'Profit or loss in account currency',

  // Risk management terminology
  stopLossLabel: 'Stop Loss',
  takeProfitLabel: 'Take Profit',
  riskAmountLabel: 'Risk Amount',

  // Trading terminology
  entryPriceLabel: 'Entry Price',
  exitPriceLabel: 'Exit Price',
  spreadLabel: 'Spread',
  commissionLabel: 'Commission',
  swapLabel: 'Swap',

  // Account terminology
  accountCurrencyLabel: 'Account Currency',

  // Validation messages
  validationMessages: {
    required: 'This field is required',
    invalidFormat: 'Invalid format',
    outOfRange: 'Value is out of acceptable range',
    exceedsBalance: 'Position size exceeds account balance'
  },

  // Help text
  helpText: {
    instrumentSelection: 'Select the currency pair you want to trade from the dropdown list.',
    positionSizing: 'Enter the number of lots and select the lot type (Standard=100k, Mini=10k, Micro=1k units).',
    riskManagement: 'Set stop loss and take profit levels to manage your risk and lock in profits.',
    pipsVsPoints: 'Pips are the standard unit for measuring price movements in forex trading.'
  }
};

// Futures-specific terminology configuration
export const FUTURES_TERMINOLOGY: TerminologyConfig = {
  // Core instrument terminology
  instrumentLabel: 'Futures Instrument',
  instrumentPlaceholder: 'Select futures instrument (e.g., ES, NQ, CL)',
  instrumentDescription: 'The futures contract you want to trade',

  // Position sizing terminology
  positionSizeLabel: 'Contract Size',
  positionSizePlaceholder: 'Enter contract size (e.g., 5)',
  positionSizeDescription: 'Number of contracts to trade',
  positionSizeTypeLabel: 'Contract Type',

  // Price movement terminology
  priceMovementLabel: 'Points',
  priceMovementDescription: 'Price movement measured in points',
  priceMovementUnit: 'points',

  // P&L terminology
  profitLossLabel: 'P&L',
  profitLossDescription: 'Profit or loss in account currency',

  // Risk management terminology
  stopLossLabel: 'Stop Loss',
  takeProfitLabel: 'Take Profit',
  riskAmountLabel: 'Risk Amount',

  // Trading terminology
  entryPriceLabel: 'Entry Price',
  exitPriceLabel: 'Exit Price',
  spreadLabel: 'Commission',
  commissionLabel: 'Commission',
  swapLabel: 'Carrying Cost',

  // Account terminology
  accountCurrencyLabel: 'Account Currency',

  // Validation messages
  validationMessages: {
    required: 'This field is required',
    invalidFormat: 'Invalid format',
    outOfRange: 'Value is out of acceptable range',
    exceedsBalance: 'Position size exceeds account balance'
  },

  // Help text
  helpText: {
    instrumentSelection: 'Select the futures instrument you want to trade from the dropdown list.',
    positionSizing: 'Enter the number of contracts you want to trade.',
    riskManagement: 'Set stop loss and take profit levels to manage your risk and lock in profits.',
    pipsVsPoints: 'Points are the standard unit for measuring price movements in futures trading.'
  }
};

// Current active terminology configuration
export let CURRENT_TERMINOLOGY: TerminologyConfig = FUTURES_TERMINOLOGY;

// Terminology switching functions
export const switchToForexTerminology = (): void => {
  CURRENT_TERMINOLOGY = FOREX_TERMINOLOGY;
};

export const switchToFuturesTerminology = (): void => {
  CURRENT_TERMINOLOGY = FUTURES_TERMINOLOGY;
};

export const getCurrentTerminology = (): TerminologyConfig => {
  return CURRENT_TERMINOLOGY;
};

// Utility functions for terminology conversion
export const getTerminologyLabel = (key: keyof TerminologyConfig): string => {
  return CURRENT_TERMINOLOGY[key] as string;
};

export const getValidationMessage = (key: keyof TerminologyConfig['validationMessages']): string => {
  return CURRENT_TERMINOLOGY.validationMessages[key];
};

export const getHelpText = (key: keyof TerminologyConfig['helpText']): string => {
  return CURRENT_TERMINOLOGY.helpText[key];
};

// Mapping utility functions
export const getFuturesEquivalent = (forexTerm: string): string => {
  const mapping = TERMINOLOGY_MAPPINGS.find(m => m.forex === forexTerm);
  return mapping ? mapping.futures : forexTerm;
};

export const getForexEquivalent = (futuresTerm: string): string => {
  const mapping = TERMINOLOGY_MAPPINGS.find(m => m.futures === futuresTerm);
  return mapping ? mapping.forex : futuresTerm;
};

// Type-safe terminology keys
export type TerminologyKeys = keyof TerminologyConfig;
export type ValidationKeys = keyof TerminologyConfig['validationMessages'];
export type HelpKeys = keyof TerminologyConfig['helpText'];