# Journal Page Layout Redesign - Technical Design

## 1. Objective

This document outlines the technical approach for implementing the layout changes specified in the `requirements.md` document for the Daily Journal page.

## 2. Component Analysis

Based on the project structure and requirements, the following components are likely to be affected:

- **`src/pages/JournalPage.tsx`**: The main container for the journal page. This will likely require layout adjustments (e.g., using Flexbox or CSS Grid) to manage the main content and sidebar.
- **`src/components/journal/single-page/JournalContent.tsx`**: The primary content area that holds the journal entries and emotional state tracking. Its width will need to be increased.
- **`src/components/journal/single-page/JournalSidebar.tsx` or a similar sidebar component**: The component for the 'Session Overview'. Its width may need to be adjusted.
- **`src/components/journal/single-page/EmotionalState.tsx` (or similar)**: The component containing the 'Overall Mood' selectors. The CSS for this component will need to be modified to support a horizontal layout (e.g., using `display: flex` with `flex-direction: row`).

## 3. Implementation Strategy

### 3.1. Top Content Alignment & Sizing

- **File:** `src/pages/JournalPage.tsx`
- **Action:** Modify the root container of the page to use a CSS Grid or Flexbox layout.
- **Details:**
  - Define a two-column layout.
  - The first column will contain `JournalContent.tsx` and the second will contain the sidebar.
  - Ensure both columns are aligned to the top (`align-items: start`).
  - Adjust the column template (`grid-template-columns` or `flex-basis`) to give more space to the main content area.

### 3.2. Horizontal Mood Selection

- **File:** The component responsible for rendering the mood selectors (e.g., `EmotionalState.tsx`).
- **Action:** Refactor the CSS for the mood selection container.
- **Details:**
  - Apply `display: flex`, `flex-direction: row`, and `flex-wrap: wrap` to the container holding the mood buttons.
  - Adjust the styling of the individual mood buttons (e.g., margins, padding) to ensure they render correctly in a row.

## 4. Styling Framework

- We will leverage the existing styling solution (likely Tailwind CSS, given the `tailwind.config.ts` file) to implement these changes. Utility classes will be preferred over custom CSS where possible to maintain consistency.