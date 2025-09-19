# Technology Stack

## Build System & Development

- **Build Tool**: Vite 5.4+ with React SWC plugin for fast builds and HMR
- **Package Manager**: npm (package-lock.json present)
- **TypeScript**: Strict TypeScript configuration with path aliases (`@/*` → `./src/*`)
- **Development Server**: Vite dev server on port 8080 with polling for file changes

## Frontend Stack

- **Framework**: React 18 with functional components and hooks
- **Language**: TypeScript with relaxed strictness settings for rapid development
- **Styling**: Tailwind CSS 3.4+ with custom design system
- **UI Components**: shadcn/ui built on Radix UI primitives
- **Icons**: Lucide React
- **Routing**: React Router DOM v6 with protected routes

## Backend & Data

- **Backend**: Firebase (Firestore, Auth, Storage, Functions)
- **Database**: Firestore NoSQL with user-scoped security rules
- **Authentication**: Firebase Auth (email/password + Google OAuth)
- **File Storage**: Firebase Storage for trade screenshots
- **Real-time Sync**: Firestore real-time listeners

## State Management

- **Global State**: React Context (AuthContext, TradeContext)
- **Server State**: TanStack React Query for caching and synchronization
- **Form State**: React Hook Form with Zod validation
- **UI State**: Local component state with hooks

## Key Libraries

- **Charts**: Recharts for analytics, Lightweight Charts for trading charts
- **Forms**: React Hook Form + Zod validation + Hookform Resolvers
- **Date Handling**: date-fns and moment.js
- **Drag & Drop**: @dnd-kit for sortable interfaces
- **PDF Export**: jsPDF with autotable for reports
- **Rich Text**: React Quill for journal entries
- **Calendar**: React Big Calendar for scheduling
- **Grid Layouts**: React Grid Layout for dashboard widgets

## Common Commands

```bash
# Development
npm run dev                    # Start dev server on port 8080
npm run build                  # Production build
npm run preview               # Preview production build

# Code Quality
npm run lint                  # ESLint check
npm run lint:fix             # Auto-fix ESLint issues
npm run type-check           # TypeScript type checking
npm run type-check:watch     # Watch mode type checking

# Testing
npm run test                 # Run all tests
npm run test:watch          # Watch mode testing
npm run test:coverage       # Test with coverage report
npm run test:comprehensive  # Run comprehensive test suite

# Validation
npm run verify              # Type check + lint + build
npm run check-all          # Type check + lint only
npm run pre-commit         # Pre-commit validation
```

## Development Patterns

- **Component Organization**: Feature-based folders under `src/components/`
- **Type Safety**: Comprehensive TypeScript interfaces in `src/types/`
- **Error Handling**: Error boundaries and validation feedback
- **Performance**: Lazy loading, virtualization, and React Query caching
- **Accessibility**: ARIA compliance and keyboard navigation support
- **Testing**: Vitest with React Testing Library and comprehensive test suites