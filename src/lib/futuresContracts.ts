// Futures Contract Specifications Database
// Provides contract specifications for futures trading calculations

export interface FuturesContractSpec {
  symbol: string;
  name: string;
  exchange: string;
  category: string;
  contractSize: number; // Number of units per contract
  contractSizeUnit: string; // Unit description (e.g., "barrels", "bushels")
  tickSize: number; // Minimum price movement
  tickValue: number; // Dollar value per tick
  initialMargin: number; // Initial margin requirement per contract
  maintenanceMargin: number; // Maintenance margin requirement per contract
  tradingHours: string; // Trading hours description
  expirationMonths: string[]; // Contract expiration months
  pointValue?: number; // Alternative point value if different from tick value
}

// Major futures exchanges
export const FUTURES_EXCHANGES = {
  CME: 'Chicago Mercantile Exchange',
  ICE: 'Intercontinental Exchange',
  NYMEX: 'New York Mercantile Exchange',
  CBOT: 'Chicago Board of Trade',
  COMEX: 'Commodity Exchange',
  CFE: 'CBOE Futures Exchange'
} as const;

// Futures contract categories
export const FUTURES_CATEGORIES = {
  INDEX: 'Index Futures',
  CURRENCY: 'Currency Futures',
  COMMODITY: 'Commodity Futures',
  ENERGY: 'Energy Futures',
  METAL: 'Metal Futures',
  AGRICULTURAL: 'Agricultural Futures',
  INTEREST_RATE: 'Interest Rate Futures'
} as const;

// Comprehensive futures contract specifications
export const FUTURES_CONTRACT_SPECS: FuturesContractSpec[] = [
  // Index Futures
  {
    symbol: 'ES',
    name: 'E-mini S&P 500',
    exchange: 'CME',
    category: 'Index',
    contractSize: 50,
    contractSizeUnit: 'dollars per index point',
    tickSize: 0.25,
    tickValue: 12.50,
    initialMargin: 1320,
    maintenanceMargin: 1200,
    tradingHours: 'Sunday-Friday 6:00 PM - 5:00 PM ET',
    expirationMonths: ['Mar', 'Jun', 'Sep', 'Dec']
  },
  {
    symbol: 'NQ',
    name: 'E-mini Nasdaq-100',
    exchange: 'CME',
    category: 'Index',
    contractSize: 20,
    contractSizeUnit: 'dollars per index point',
    tickSize: 0.25,
    tickValue: 5.00,
    initialMargin: 1760,
    maintenanceMargin: 1600,
    tradingHours: 'Sunday-Friday 6:00 PM - 5:00 PM ET',
    expirationMonths: ['Mar', 'Jun', 'Sep', 'Dec']
  },
  {
    symbol: 'RTY',
    name: 'E-mini Russell 2000',
    exchange: 'CME',
    category: 'Index',
    contractSize: 50,
    contractSizeUnit: 'dollars per index point',
    tickSize: 0.10,
    tickValue: 5.00,
    initialMargin: 1320,
    maintenanceMargin: 1200,
    tradingHours: 'Sunday-Friday 6:00 PM - 5:00 PM ET',
    expirationMonths: ['Mar', 'Jun', 'Sep', 'Dec']
  },

  // Currency Futures
  {
    symbol: '6E',
    name: 'Euro FX',
    exchange: 'CME',
    category: 'Currency',
    contractSize: 125000,
    contractSizeUnit: 'euros',
    tickSize: 0.00005,
    tickValue: 6.25,
    initialMargin: 2310,
    maintenanceMargin: 2100,
    tradingHours: 'Sunday-Friday 6:00 PM - 5:00 PM ET',
    expirationMonths: ['Mar', 'Jun', 'Sep', 'Dec']
  },
  {
    symbol: '6B',
    name: 'British Pound',
    exchange: 'CME',
    category: 'Currency',
    contractSize: 62500,
    contractSizeUnit: 'pounds',
    tickSize: 0.0001,
    tickValue: 6.25,
    initialMargin: 1980,
    maintenanceMargin: 1800,
    tradingHours: 'Sunday-Friday 6:00 PM - 5:00 PM ET',
    expirationMonths: ['Mar', 'Jun', 'Sep', 'Dec']
  },
  {
    symbol: '6J',
    name: 'Japanese Yen',
    exchange: 'CME',
    category: 'Currency',
    contractSize: 12500000,
    contractSizeUnit: 'yen',
    tickSize: 0.0000005,
    tickValue: 6.25,
    initialMargin: 2310,
    maintenanceMargin: 2100,
    tradingHours: 'Sunday-Friday 6:00 PM - 5:00 PM ET',
    expirationMonths: ['Mar', 'Jun', 'Sep', 'Dec']
  },

  // Energy Futures
  {
    symbol: 'CL',
    name: 'Light Sweet Crude Oil',
    exchange: 'NYMEX',
    category: 'Energy',
    contractSize: 1000,
    contractSizeUnit: 'barrels',
    tickSize: 0.01,
    tickValue: 10.00,
    initialMargin: 5502,
    maintenanceMargin: 5000,
    tradingHours: 'Sunday-Friday 6:00 PM - 5:00 PM ET',
    expirationMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  },
  {
    symbol: 'NG',
    name: 'Natural Gas',
    exchange: 'NYMEX',
    category: 'Energy',
    contractSize: 10000,
    contractSizeUnit: 'MMBtu (million British thermal units)',
    tickSize: 0.001,
    tickValue: 10.00,
    initialMargin: 2201,
    maintenanceMargin: 2000,
    tradingHours: 'Sunday-Friday 6:00 PM - 5:00 PM ET',
    expirationMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  },
  {
    symbol: 'RB',
    name: 'RBOB Gasoline',
    exchange: 'NYMEX',
    category: 'Energy',
    contractSize: 42000,
    contractSizeUnit: 'gallons',
    tickSize: 0.0001,
    tickValue: 4.20,
    initialMargin: 4402,
    maintenanceMargin: 4000,
    tradingHours: 'Sunday-Friday 6:00 PM - 5:00 PM ET',
    expirationMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  },

  // Metal Futures
  {
    symbol: 'GC',
    name: 'Gold',
    exchange: 'COMEX',
    category: 'Metal',
    contractSize: 100,
    contractSizeUnit: 'troy ounces',
    tickSize: 0.10,
    tickValue: 10.00,
    initialMargin: 8250,
    maintenanceMargin: 7500,
    tradingHours: 'Sunday-Friday 6:00 PM - 5:00 PM ET',
    expirationMonths: ['Feb', 'Apr', 'Jun', 'Aug', 'Oct', 'Dec']
  },
  {
    symbol: 'SI',
    name: 'Silver',
    exchange: 'COMEX',
    category: 'Metal',
    contractSize: 5000,
    contractSizeUnit: 'troy ounces',
    tickSize: 0.005,
    tickValue: 25.00,
    initialMargin: 9900,
    maintenanceMargin: 9000,
    tradingHours: 'Sunday-Friday 6:00 PM - 5:00 PM ET',
    expirationMonths: ['Mar', 'May', 'Jul', 'Sep', 'Dec']
  },
  {
    symbol: 'HG',
    name: 'Copper',
    exchange: 'COMEX',
    category: 'Metal',
    contractSize: 25000,
    contractSizeUnit: 'pounds',
    tickSize: 0.0005,
    tickValue: 12.50,
    initialMargin: 5502,
    maintenanceMargin: 5000,
    tradingHours: 'Sunday-Friday 6:00 PM - 5:00 PM ET',
    expirationMonths: ['Mar', 'May', 'Jul', 'Sep', 'Dec']
  },

  // Agricultural Futures
  {
    symbol: 'ZC',
    name: 'Corn',
    exchange: 'CBOT',
    category: 'Agricultural',
    contractSize: 5000,
    contractSizeUnit: 'bushels',
    tickSize: 0.25,
    tickValue: 12.50,
    initialMargin: 1650,
    maintenanceMargin: 1500,
    tradingHours: 'Sunday-Friday 7:00 PM - 7:45 AM & 8:30 AM - 1:20 PM CT',
    expirationMonths: ['Mar', 'May', 'Jul', 'Sep', 'Dec']
  },
  {
    symbol: 'ZW',
    name: 'Wheat',
    exchange: 'CBOT',
    category: 'Agricultural',
    contractSize: 5000,
    contractSizeUnit: 'bushels',
    tickSize: 0.25,
    tickValue: 12.50,
    initialMargin: 2063,
    maintenanceMargin: 1875,
    tradingHours: 'Sunday-Friday 7:00 PM - 7:45 AM & 8:30 AM - 1:20 PM CT',
    expirationMonths: ['Mar', 'May', 'Jul', 'Sep', 'Dec']
  },
  {
    symbol: 'ZS',
    name: 'Soybeans',
    exchange: 'CBOT',
    category: 'Agricultural',
    contractSize: 5000,
    contractSizeUnit: 'bushels',
    tickSize: 0.25,
    tickValue: 12.50,
    initialMargin: 3300,
    maintenanceMargin: 3000,
    tradingHours: 'Sunday-Friday 7:00 PM - 7:45 AM & 8:30 AM - 1:20 PM CT',
    expirationMonths: ['Jan', 'Mar', 'May', 'Jul', 'Aug', 'Sep', 'Nov']
  },

  // Interest Rate Futures
  {
    symbol: 'ZN',
    name: '10-Year T-Note',
    exchange: 'CBOT',
    category: 'Interest Rate',
    contractSize: 100000,
    contractSizeUnit: 'dollars face value',
    tickSize: 0.015625,
    tickValue: 15.625,
    initialMargin: 1547,
    maintenanceMargin: 1400,
    tradingHours: 'Sunday-Friday 5:00 PM - 4:00 PM ET',
    expirationMonths: ['Mar', 'Jun', 'Sep', 'Dec']
  },
  {
    symbol: 'ZB',
    name: '30-Year T-Bond',
    exchange: 'CBOT',
    category: 'Interest Rate',
    contractSize: 100000,
    contractSizeUnit: 'dollars face value',
    tickSize: 0.03125,
    tickValue: 31.25,
    initialMargin: 3080,
    maintenanceMargin: 2800,
    tradingHours: 'Sunday-Friday 5:00 PM - 4:00 PM ET',
    expirationMonths: ['Mar', 'Jun', 'Sep', 'Dec']
  }
];

// Lookup functions for efficient data access

/**
 * Get contract specification by symbol
 */
export const getContractSpec = (symbol: string): FuturesContractSpec | undefined => {
  return FUTURES_CONTRACT_SPECS.find(spec => spec.symbol === symbol);
};

/**
 * Get all contracts for a specific exchange
 */
export const getContractsByExchange = (exchange: string): FuturesContractSpec[] => {
  return FUTURES_CONTRACT_SPECS.filter(spec => spec.exchange === exchange);
};

/**
 * Get all contracts for a specific category
 */
export const getContractsByCategory = (category: string): FuturesContractSpec[] => {
  return FUTURES_CONTRACT_SPECS.filter(spec => spec.category.toLowerCase() === category.toLowerCase());
};

/**
 * Get contract symbols for a specific exchange
 */
export const getContractSymbolsByExchange = (exchange: string): string[] => {
  return getContractsByExchange(exchange).map(spec => spec.symbol);
};

/**
 * Calculate tick value for a given contract and price
 */
export const calculateTickValue = (symbol: string): number => {
  const spec = getContractSpec(symbol);
  return spec ? spec.tickValue : 0;
};

/**
 * Calculate contract value at a given price
 */
export const calculateContractValue = (symbol: string, price: number): number => {
  const spec = getContractSpec(symbol);
  if (!spec) return 0;

  // For index futures, value = contractSize * price
  if (spec.category === 'Index') {
    return spec.contractSize * price;
  }

  // For other contracts, value depends on contract size and price
  return spec.contractSize * price;
};

/**
 * Calculate margin requirement for a position
 */
export const calculateMarginRequirement = (symbol: string, contracts: number): number => {
  const spec = getContractSpec(symbol);
  return spec ? spec.initialMargin * contracts : 0;
};

/**
 * Get all available exchanges
 */
export const getAvailableExchanges = (): string[] => {
  const exchanges = new Set(FUTURES_CONTRACT_SPECS.map(spec => spec.exchange));
  return Array.from(exchanges).sort();
};

/**
 * Get all available categories
 */
export const getAvailableCategories = (): string[] => {
  const categories = new Set(FUTURES_CONTRACT_SPECS.map(spec => spec.category));
  return Array.from(categories).sort();
};

/**
 * Search contracts by name or symbol
 */
export const searchContracts = (query: string): FuturesContractSpec[] => {
  const lowercaseQuery = query.toLowerCase();
  return FUTURES_CONTRACT_SPECS.filter(spec =>
    spec.symbol.toLowerCase().includes(lowercaseQuery) ||
    spec.name.toLowerCase().includes(lowercaseQuery) ||
    spec.exchange.toLowerCase().includes(lowercaseQuery)
  );
};

// Type-safe exports (interface already exported above)