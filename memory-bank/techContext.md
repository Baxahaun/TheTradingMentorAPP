# Technical Context: Technologies and Development Environment

## 1. Core Technology Stack
-   **Language**: TypeScript 5.0+
-   **Framework**: React 18
-   **Build Tool**: Vite
-   **Package Manager**: npm
-   **Styling**: Tailwind CSS
-   **UI Components**: shadcn/ui

## 2. Key Libraries & Dependencies
-   **Data Visualization**: Recharts
-   **Form Management**: React Hook Form with Zod for validation
-   **Routing**: React Router DOM
-   **Server State & Caching**: TanStack React Query
-   **Real-time Communication**: WebSocket API for live market data and risk updates

## 3. Architecture & Data Management
-   **Application Architecture**: A feature-driven, component-based architecture with distinct layers for presentation (React), business logic (Services/Hooks), and data (Context/localStorage).
-   **Primary Data Storage**: Browser `localStorage` is used to provide robust offline-first capabilities for core journaling and challenge tracking.
-   **Data Backup & Sync**: Firebase Firestore is configured and ready for implementation to enable cloud backup and cross-device synchronization.
-   **External Integrations**: The system is designed to integrate with external APIs for futures market data and prop firm rules, using HTTP/REST and WebSockets.

## 4. Development Environment
-   **Build System**: Vite provides a fast development server with Hot Module Replacement (HMR).
-   **Code Quality**: ESLint is used for static analysis and enforcing code standards.
-   **Testing**: The testing suite is built on Vitest for unit tests and React Testing Library for component testing.
-   **Version Control**: Git with a feature-branch workflow hosted on GitHub.

## 5. Technical Rationale & Decisions
-   **React 18**: Chosen for its mature ecosystem, strong TypeScript support, and concurrent features, which are ideal for real-time financial applications.
-   **Vite**: Selected over Create React App for its superior development performance and faster build times.
-   **localStorage First**: Prioritizes offline functionality and reduces initial infrastructure complexity, making the application immediately usable.
-   **TypeScript**: Considered non-negotiable for ensuring the accuracy and maintainability required for financial calculations.

## 6. Known Limitations
-   **Data Synchronization**: Cross-device sync is not yet implemented and relies on the future activation of the Firebase backend.
-   **API Dependencies**: Real-time market data and automated rule checking are dependent on free-tier or manually configured external APIs, which may have rate limits.
-   **Offline Functionality**: While core journaling is available offline, real-time features like market data and risk alerts require an active internet connection.
