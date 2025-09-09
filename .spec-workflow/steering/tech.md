# Technology Steering: Zella Trade Scribe

## 1. Project Type

A specialized web application for forex trading journaling, analytics, and risk management.

## 2. Core Technologies

- **Primary Language**: TypeScript
- **Frontend Framework**: React 18
- **Build Tool**: Vite
- **UI Components**: shadcn/ui, based on Radix UI
- **Styling**: Tailwind CSS
- **Data Visualization**: Recharts
- **State Management**: React Context API, TanStack React Query
- **Forms & Validation**: React Hook Form, Zod
- **Routing**: React Router DOM

## 3. Application Architecture

- **Client-Server Model**: A client-side rendered React application that consumes external APIs for market data.
- **Component-Based**: Built with a modular architecture using reusable React components.
- **Service Layer**: Business logic is encapsulated in services (e.g., `JournalDataService`, `JournalExportService`) for separation of concerns.

## 4. Data Storage

- **Primary Storage**: Browser `localStorage` for all user data, enabling offline-first functionality without a required backend.
- **Data Caching**: In-memory caching for external API responses to manage rate limits and improve performance.

## 5. External Integrations

- **Market Data APIs**: Integrates with Alpha Vantage and Financial Modeling Prep for economic calendar data, with a fallback strategy for reliability.
- **Backend**: Firebase is configured and ready for future integration to enable cloud data persistence and synchronization.

## 6. Development Environment

- **Package Management**: npm
- **Code Quality**: ESLint for linting, TypeScript for static type-checking.
- **Testing**: Vitest for unit and integration testing, configured with JSDOM.
- **Version Control**: Git

## 7. Deployment & Distribution

- **Target Platform**: Web browsers (desktop and mobile).
- **Distribution**: Deployed as a static site, likely via a service like Netlify or Vercel.

## 8. Technical Constraints & Known Limitations

- **Data Persistence**: Currently limited to the user's browser; data is not synced across devices.
- **API Rate Limits**: Relies on free-tier external APIs, which have usage restrictions.
- **Offline Support**: While core functionality works offline, market data integration requires an internet connection.

## 9. Key Technical Decisions

- **Vite over Create React App**: Chosen for its superior development experience and performance.
- **shadcn/ui for Components**: Selected for its high-quality, accessible, and customizable components that accelerate UI development.
- **TypeScript for Type Safety**: Adopted to improve code quality and maintainability, especially for a data-intensive application.
- **localStorage for Initial Storage**: Used to deliver a functional product quickly without the immediate need for a complex backend infrastructure.