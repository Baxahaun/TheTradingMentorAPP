# Project Structure Steering: Zella Trade Scribe

## 1. Directory Organization

The project follows a feature-driven, layered architecture within the `src` directory:

```
src/
├── components/   # Reusable React components (UI layer)
├── contexts/     # Global state management (Context layer)
├── hooks/        # Reusable React hooks (Logic layer)
├── lib/          # Core business logic and utilities (Service layer)
├── pages/        # Top-level page components (View layer)
├── services/     # External API interactions and data management
├── styles/       # Global CSS styles
├── test/         # Test setup and mock data
├── types/        # TypeScript type definitions
└── utils/        # General utility functions
```

## 2. Naming Conventions

- **Components**: `PascalCase.tsx` (e.g., `TradeDetailsPage.tsx`)
- **Services & Hooks**: `camelCase.ts` (e.g., `useAutoSave.ts`, `journalDataService.ts`)
- **Types**: `camelCase.ts` (e.g., `trade.ts`)
- **Tests**: `[filename].test.ts` or `[filename].spec.ts`

## 3. Code Style & Formatting

- **Linting**: Enforced by ESLint with rules against duplicate imports, redeclarations, and usage of `any` type.
- **Formatting**: While not explicitly defined by a tool like Prettier, the codebase follows standard TypeScript and React formatting conventions.

## 4. Import Patterns

- **Absolute Imports**: Path aliases are configured (`@/*` pointing to `src/*`) to encourage absolute imports for better readability and maintainability.
- **Order**: 
  1. External dependencies (e.g., `react`)
  2. Internal modules using path aliases (e.g., `@/components`)
  3. Relative imports
  4. Style imports

## 5. Architectural Patterns

- **Service Layer**: Business logic is abstracted into a service layer (`/services` and `/lib`) to decouple it from the UI.
- **State Management**: Global state is managed via React's Context API (`/contexts`), with `TradeContext` and `AuthContext` as the primary providers.
- **Component-Based UI**: The user interface is built entirely from modular, reusable components located in `/components`.
- **Centralized Configuration**: Key application configurations, such as the dashboard widget registry, are centralized in the `/config` directory.

## 6. Module Boundaries & Separation of Concerns

- **UI vs. Logic**: A clear separation is maintained between UI components (dumb) and business logic (smart), which resides in hooks, services, and contexts.
- **Data Flow**: Data flows unidirectionally from services/contexts down to UI components.
- **Testing**: Each layer (`components`, `services`, `hooks`) has its own corresponding tests, ensuring modular and testable code.

## 7. Documentation Standards

- **READMEs**: High-level documentation for key modules (e.g., `/services/README.md`) is present.
- **Type Definitions**: TypeScript types in the `/types` directory serve as a form of self-documentation for data structures.
- **Inline Comments**: Used for complex logic within functions and components.