# Project Structure

## Root Directory Organization

```
├── src/                    # Main source code
├── functions/              # Firebase Cloud Functions
├── public/                 # Static assets
├── dist/                   # Production build output
├── tests/                  # End-to-end and integration tests
├── scripts/                # Build and utility scripts
├── docs/                   # Documentation
├── .kiro/                  # Kiro IDE configuration
├── .spec-workflow/         # Specification workflow files
└── config files            # Various config files at root
```

## Source Code Structure (`src/`)

### Core Application
- `App.tsx` - Main app component with providers and routing
- `main.tsx` - React app entry point
- `index.css` - Global styles and Tailwind imports
- `vite-env.d.ts` - Vite type definitions

### Components (`src/components/`)
**Feature-based organization with shared UI components:**

- `ui/` - shadcn/ui components and shared UI primitives
- `accessibility/` - Accessibility-focused components and providers
- `analytics/` - Performance analytics and metrics components
- `journal/` - Daily journaling and reflection components
- `trade-review/` - Trade analysis and review interfaces
- `strategy-*` - Strategy building and management components
- `export/` - Data export and backup functionality
- `mobile/` - Mobile-specific component variants
- `widgets/` - Dashboard widget components
- Root level: Core components (Dashboard, TradeLog, AddTrade, etc.)

### Contexts (`src/contexts/`)
- `AuthContext.tsx` - Authentication state management
- `TradeContext.tsx` - Trade data state management

### Services & Data (`src/lib/`)
- `firebase.ts` - Firebase configuration and initialization
- `firebaseService.ts` - Firestore CRUD operations
- `authService.ts` - Authentication service layer
- `dataMigration.ts` - Data migration utilities

### Types (`src/types/`)
- `trade.ts` - Comprehensive trade and trading-related type definitions
- Additional type files for specific domains

### Utilities (`src/utils/`)
- Helper functions and utility modules

### Pages (`src/pages/`)
- Route-level page components
- `Index.tsx` - Main dashboard page
- `TradeReviewPage.tsx` - Trade review interface
- `NotFound.tsx` - 404 error page

### Hooks (`src/hooks/`)
- Custom React hooks for shared logic

### Testing (`src/__tests__/`, `src/test/`)
- Component tests, integration tests, and test utilities
- `setup.ts` - Test environment configuration

## Configuration Files

### Build & Development
- `vite.config.ts` - Vite build configuration with React and path aliases
- `tsconfig.json` - TypeScript project references
- `tsconfig.app.json` - App-specific TypeScript config
- `tsconfig.node.json` - Node.js TypeScript config
- `tailwind.config.ts` - Tailwind CSS configuration with custom theme
- `postcss.config.js` - PostCSS configuration
- `eslint.config.js` - ESLint configuration

### Firebase
- `firebase.json` - Firebase project configuration
- `functions/` - Cloud Functions with separate package.json and TypeScript config

### Testing
- `vitest.config.*.ts` - Multiple Vitest configurations for different test suites

## Naming Conventions

### Files
- **Components**: PascalCase (e.g., `TradeLog.tsx`, `DailyJournal.tsx`)
- **Utilities**: camelCase (e.g., `authService.ts`, `dataMigration.ts`)
- **Types**: camelCase with descriptive names (e.g., `trade.ts`)
- **Tests**: Component name + `.test.tsx` or `.spec.ts`

### Directories
- **Feature-based**: Descriptive names (e.g., `trade-review/`, `journal/`)
- **Shared**: Generic names (e.g., `ui/`, `utils/`, `hooks/`)
- **Domain-specific**: Clear domain indication (e.g., `accessibility/`, `mobile/`)

## Import Patterns

### Path Aliases
- `@/*` maps to `./src/*` for clean imports
- Example: `import { Button } from "@/components/ui/button"`

### Component Imports
- UI components from `@/components/ui/`
- Feature components with relative or absolute paths
- Context hooks: `import { useAuth } from "@/contexts/AuthContext"`

## Architecture Principles

### Component Organization
- **Feature-first**: Group related components by feature/domain
- **Shared UI**: Reusable components in `ui/` directory
- **Accessibility**: Dedicated accessibility components and providers
- **Mobile**: Separate mobile variants when needed

### State Management
- **Global state**: React Context for auth and core data
- **Server state**: React Query for API data and caching
- **Form state**: React Hook Form for complex forms
- **Local state**: Component-level useState for UI state

### File Responsibilities
- **Pages**: Route-level components, minimal logic
- **Components**: Reusable UI and business logic components
- **Services**: External API and Firebase interactions
- **Contexts**: Global state management
- **Types**: Comprehensive type definitions
- **Utils**: Pure functions and helpers