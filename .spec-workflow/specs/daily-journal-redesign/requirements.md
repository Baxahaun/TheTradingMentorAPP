# Requirements Document

## Introduction

This specification defines the requirements for redesigning the Daily Journal feature to provide a more intuitive, calendar-based interface with enhanced trade integration and dynamic content areas. The redesigned Daily Journal will serve as a central hub for daily reflection, trade analysis, and progress tracking, specifically tailored to futures traders and prop firm challenge participants.

The feature builds upon the existing journal infrastructure while introducing a modern calendar-based navigation system, dynamic content areas based on entry type, and deeper integration with the TradeLog system for seamless reflective analysis.

## Alignment with Product Vision

This feature directly supports the product's challenge-first design principle by providing traders with a structured daily reflection tool that helps improve their prop firm challenge success rates. It aligns with the futures market expertise goal by offering specialized trade note templates and integration with existing futures trading data. The feature enhances the risk management focus by providing daily performance tracking and emotional state monitoring, crucial for maintaining discipline during funded trading evaluations.

## Requirements

### Requirement 1: Calendar-Based Navigation System

**User Story:** As a futures trader, I want to navigate between weeks and quickly jump to specific dates, so that I can efficiently access my journal entries without excessive scrolling.

#### Acceptance Criteria

1. WHEN the user opens the Daily Journal THEN the system SHALL display the current week with Monday through Friday layout
2. WHEN the user clicks the "Previous Week" button THEN the system SHALL navigate to the previous week and load relevant data
3. WHEN the user clicks the "Next Week" button THEN the system SHALL navigate to the next week and load relevant data
4. WHEN the user clicks the "Current Week" button THEN the system SHALL navigate back to the current week
5. WHEN the user clicks "Select Specific Date" THEN the system SHALL open a date picker for quick navigation
6. WHEN the user selects a specific week/day THEN the system SHALL immediately load that date's content without additional confirmation

### Requirement 2: Dynamic Content Area Based on Entry Type

**User Story:** As a prop firm challenge participant, I want the main content area to adapt based on whether I'm viewing a trade note or daily journal entry, so that I have optimal space and tools for each type of reflection.

#### Acceptance Criteria

1. WHEN the user selects a day with trade notes THEN the system SHALL display a split layout with trade-specific controls and screenshot areas
2. WHEN the user selects a day with only daily journal entries THEN the system SHALL extend the content area to full height for maximum writing space
3. WHEN the user switches between trade notes and daily journal entries THEN the system SHALL dynamically adjust the layout within 200ms
4. WHEN viewing trade notes THEN the system SHALL display trade information (P&L, entry time, strategy) alongside the note content
5. WHEN viewing daily journal entries THEN the system SHALL provide rich text editing capabilities with full vertical space utilization

### Requirement 3: Trade Note Integration with Existing TradeLog

**User Story:** As a futures trader, I want my trade notes to be linked to my actual trades from the TradeLog, so that I can reflect on specific trades with complete context and data.

#### Acceptance Criteria

1. WHEN a user creates a trade note THEN the system SHALL link it to an existing trade from the TradeLog
2. WHEN displaying a trade note THEN the system SHALL show the linked trade's P&L, entry time, and strategy
3. WHEN a user views a trade in the TradeLog THEN the system SHALL display a "View Notes" button if notes exist for that trade
4. WHEN the user clicks "View Notes" in TradeLog THEN the system SHALL navigate to the Daily Journal and highlight the relevant trade note
5. WHEN the linked trade data changes THEN the system SHALL automatically update the displayed information in the trade note

### Requirement 4: Screenshot and Media Management

**User Story:** As a prop firm trader, I want to attach screenshots and analysis charts to my trade notes, so that I can visually document my trading decisions and market analysis.

#### Acceptance Criteria

1. WHEN the user uploads a screenshot THEN the system SHALL accept files up to 5MB in size
2. WHEN the user drags and drops an image file THEN the system SHALL automatically upload and attach it to the current trade note
3. WHEN the user uses the file upload button THEN the system SHALL open a file picker and allow image selection
4. WHEN an image upload exceeds 5MB THEN the system SHALL display an error message and reject the upload
5. WHEN images are uploaded THEN the system SHALL store them using the existing Firebase Storage infrastructure
6. WHEN viewing trade notes THEN the system SHALL display all attached screenshots in an organized gallery format

### Requirement 5: Template System with Customization

**User Story:** As a trading journal user, I want access to predefined templates and the ability to create custom templates, so that I can maintain consistency in my journaling while adapting to my personal workflow.

#### Acceptance Criteria

1. WHEN creating a new journal entry THEN the system SHALL provide default templates for "Daily Reflection", "Trade Analysis", and "Market Review"
2. WHEN the user selects a template THEN the system SHALL populate the entry with the template's structured fields and prompts
3. WHEN the user modifies a template THEN the system SHALL provide options to "Save as New Template" or "Update Existing Template"
4. WHEN the user creates a custom template THEN the system SHALL save it to their personal template library
5. WHEN the user deletes a template THEN the system SHALL remove it from their available templates after confirmation
6. WHEN applying templates THEN the system SHALL work for both daily journal entries and trade notes

### Requirement 6: Daily Metrics Integration

**User Story:** As a prop firm challenge participant, I want to see my daily trading metrics automatically populated in my journal, so that I can correlate my performance with my emotional state and decision-making process.

#### Acceptance Criteria

1. WHEN viewing a specific day THEN the system SHALL display that day's P&L, trade count, and win rate from existing trading data
2. WHEN displaying daily metrics THEN the system SHALL show data only for the selected date
3. WHEN no trades exist for a day THEN the system SHALL show zero values for all metrics
4. WHEN trade data updates THEN the system SHALL refresh the daily metrics automatically
5. WHEN the user navigates between days THEN the system SHALL update metrics for each selected date within 500ms

### Requirement 7: News Events Integration

**User Story:** As a futures trader, I want to track important market news events alongside my journal entries, so that I can understand how external factors influenced my trading decisions.

#### Acceptance Criteria

1. WHEN viewing a specific day THEN the system SHALL provide options to add news events manually
2. WHEN adding a news event THEN the system SHALL allow entry of event title, time, and impact description
3. WHEN a news API becomes available THEN the system SHALL support automatic population of major economic events
4. WHEN viewing historical entries THEN the system SHALL display both manual and API-sourced news events
5. WHEN editing news events THEN the system SHALL allow modification and deletion of manually entered events

### Requirement 8: Enhanced TradeLog Integration

**User Story:** As a trader using both TradeLog and Daily Journal, I want seamless navigation between these features, so that I can efficiently move between trade execution tracking and reflective analysis.

#### Acceptance Criteria

1. WHEN viewing a trade in TradeLog THEN the system SHALL display a "View Notes" button if journal entries exist for that trade
2. WHEN clicking "View Notes" THEN the system SHALL navigate to the Daily Journal and automatically select the relevant date and trade note
3. WHEN creating a trade note THEN the system SHALL provide a dropdown to select from trades executed on that day
4. WHEN no trades exist for a day THEN the system SHALL disable trade note creation and show appropriate messaging
5. WHEN viewing trade notes THEN the system SHALL provide a "View in TradeLog" link to navigate back to the original trade

## Non-Functional Requirements

### Code Architecture and Modularity
- **Single Responsibility Principle**: Each component should handle one specific aspect (calendar navigation, content rendering, template management)
- **Modular Design**: Create reusable components for calendar navigation, dynamic content areas, and template management
- **Dependency Management**: Minimize coupling between calendar navigation and content rendering components
- **Clear Interfaces**: Define clean contracts between journal components and existing TradeLog/trade data services

### Performance
- Layout transitions between content types must complete within 200ms
- Daily metrics loading must complete within 500ms
- Image uploads must show progress indicators and complete within 30 seconds for 5MB files
- Calendar navigation must be responsive with immediate visual feedback

### Security
- All uploaded screenshots must be stored securely using existing Firebase Storage security rules
- Journal entries must maintain user-specific access controls consistent with existing data isolation
- Template data must be protected from cross-user access or modification

### Reliability
- The system must gracefully handle offline scenarios by caching the current week's data
- Failed image uploads must not corrupt the journal entry and should provide clear error messaging
- Calendar navigation must work correctly across month and year boundaries

### Usability
- The interface must be intuitive for users already familiar with the existing TradeLog interface
- Template selection and customization must be discoverable without extensive training
- The dynamic layout changes must be smooth and not jarring to the user experience


