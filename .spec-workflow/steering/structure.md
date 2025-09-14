# Project Structure

## Directory Organization

```
zella-trade-scribe/
├── src/                           # Main source code
│   ├── components/                # Reusable UI components
│   │   ├── ui/                   # shadcn/ui base components
│   │   ├── futures/              # Futures-specific components
│   │   ├── prop-firm/            # Prop firm challenge components
│   │   ├── risk-management/      # Risk dashboard components
│   │   └── journal/              # Journal and analytics components
│   ├── contexts/                 # React Context providers
│   │   ├── AuthContext.tsx       # User authentication
│   │   ├── TradeContext.tsx      # Trade data management
│   │   ├── ChallengeContext.tsx  # Prop firm challenge state
│   │   └── RiskContext.tsx       # Risk management state
│   ├── hooks/                    # Custom React hooks
│   │   ├── useChallenge.ts       # Challenge management logic
│   │   ├── useRiskMonitoring.ts  # Risk calculation hooks
│   │   ├── useFuturesData.ts     # Futures market data
│   │   └── useAutoSave.ts        # Auto-save functionality
│   ├── services/                 # Business logic and API services
│   │   ├── challengeService.ts   # Prop firm challenge logic
│   │   ├── riskService.ts        # Risk calculations
│   │   ├── futuresDataService.ts # Market data integration
│   │   └── journalDataService.ts # Journal data management
│   ├── types/                    # TypeScript type definitions
│   │   ├── futures.ts            # Futures trading types
│   │   ├── challenge.ts          # Prop firm challenge types
│   │   ├── risk.ts               # Risk management types
│   │   └── journal.ts            # Journal entry types
│   ├── pages/                    # Top-level page components
│   │   ├── JournalPage.tsx       # Main journal interface
│   │   ├── ChallengePage.tsx     # Challenge management
│   │   ├── RiskDashboard.tsx     # Risk monitoring
│   │   └── TradesPage.tsx        # Trade management
│   ├── lib/                      # Core utilities and configurations
│   │   ├── utils.ts              # General utilities
│   │   ├── constants.ts          # Application constants
│   │   └── validations.ts        # Data validation schemas
│   └── styles/                   # Global styles and themes
├── public/                       # Static assets
├── tests/                        # Test files
├── docs/                         # Documentation
└── .spec-workflow/              # Specification management
    ├── steering/                 # Project steering documents
    └── specs/                    # Feature specifications
```

## Naming Conventions

### Files
- **Components/Pages**: `PascalCase.tsx` (e.g., `ChallengePage.tsx`, `RiskDashboard.tsx`)
- **Services/Hooks**: `camelCase.ts` (e.g., `challengeService.ts`, `useRiskMonitoring.ts`)
- **Types/Interfaces**: `camelCase.ts` (e.g., `futures.ts`, `challenge.ts`)
- **Tests**: `[filename].test.ts` or `[filename].spec.ts`

### Code
- **Classes/Types**: `PascalCase` (e.g., `Challenge`, `FuturesTrade`)
- **Functions/Methods**: `camelCase` (e.g., `calculateDrawdown`, `validateChallengeRules`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_DAILY_DRAWDOWN`, `CHALLENGE_RULES`)
- **Variables**: `camelCase` (e.g., `currentDrawdown`, `challengeProgress`)

## Import Patterns

### Import Order
1. External dependencies (React, libraries)
2. Internal modules using path aliases (`@/components`, `@/services`)
3. Relative imports (`./ChallengeCard`, `../types`)
4. Style imports (CSS, Tailwind classes)

### Module/Package Organization
- **Absolute imports**: Use `@/` alias for src directory
- **Feature-based imports**: Group related functionality together
- **Dependency direction**: Services depend on types, components depend on services
- **Barrel exports**: Use index.ts files for clean imports

## Code Structure Patterns

### Module/Class Organization
```typescript
// 1. Imports
import React from 'react';
import { Challenge } from '@/types/challenge';

// 2. Constants and configuration
const MAX_DRAWDOWN_WARNING = 0.8;

// 3. Type/interface definitions
interface ChallengeCardProps {
  challenge: Challenge;
  onUpdate: (challenge: Challenge) => void;
}

// 4. Main implementation
export const ChallengeCard: React.FC<ChallengeCardProps> = ({ challenge, onUpdate }) => {
  // Component logic
};

// 5. Helper/utility functions
const calculateProgress = (challenge: Challenge) => {
  // Helper logic
};
```

### Function/Method Organization
- **Input validation first**: Check parameters and preconditions
- **Core logic in the middle**: Main business logic
- **Error handling throughout**: Try-catch blocks and error boundaries
- **Clear return points**: Explicit return statements with proper typing

### File Organization Principles
- **One component per file**: Each React component in its own file
- **Related functionality grouped**: Challenge logic in challenge files
- **Public API at the top**: Export main functions and components first
- **Implementation details hidden**: Private functions and internal logic at bottom

## Code Organization Principles

1. **Single Responsibility**: Each file handles one specific concern (challenge management, risk calculation, etc.)
2. **Modularity**: Reusable components and services across the application
3. **Testability**: Clear interfaces and dependency injection for easy testing
4. **Consistency**: Follow established patterns for similar functionality

## Module Boundaries

### Core vs Features
- **Core**: Basic trading journal functionality, user management
- **Features**: Prop firm challenges, futures-specific tools, advanced analytics

### Public API vs Internal
- **Public**: Component props, service interfaces, hook returns
- **Internal**: Implementation details, private functions, internal state

### Platform-specific vs Cross-platform
- **Cross-platform**: Core business logic, data models
- **Platform-specific**: Browser APIs, localStorage, WebSocket connections

### Dependencies Direction
- **Types**: No dependencies on other modules
- **Services**: Can depend on types and utilities
- **Components**: Can depend on services, types, and other components
- **Pages**: Can depend on all other modules

## Code Size Guidelines

- **File size**: Maximum 300 lines per file
- **Function/Method size**: Maximum 50 lines per function
- **Component complexity**: Maximum 200 lines for complex components
- **Nesting depth**: Maximum 4 levels of nesting

## Futures/Prop Firm Structure

### Challenge Management
```
src/components/prop-firm/
├── ChallengeSetup.tsx           # Challenge configuration
├── ChallengeProgress.tsx        # Progress tracking
├── ChallengeRules.tsx           # Rules display and validation
├── ChallengeCompletion.tsx      # Pass/fail notifications
└── ChallengeHistory.tsx         # Historical challenge data
```

### Risk Management
```
src/components/risk-management/
├── RiskDashboard.tsx            # Main risk overview
├── DrawdownMonitor.tsx          # Drawdown tracking
├── PositionSizer.tsx            # Position size calculator
├── RiskAlerts.tsx               # Alert notifications
└── RiskHistory.tsx              # Risk metrics history
```

### Futures Trading
```
src/components/futures/
├── FuturesTradeForm.tsx         # Trade entry form
├── ContractSelector.tsx         # Futures contract selection
├── MarginCalculator.tsx         # Margin requirements
├── PnLCalculator.tsx            # Profit/loss calculations
└── FuturesCharts.tsx            # Futures-specific charts
```

## Documentation Standards

- **Component Documentation**: JSDoc comments for all public components
- **Service Documentation**: API documentation for all service methods
- **Type Documentation**: Comprehensive type definitions with comments
- **README Files**: Module-level README files for complex features
- **Inline Comments**: Complex business logic must include explanatory comments