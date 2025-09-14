# Requirements Document

## Introduction

This specification outlines the conversion of Zella Trade Scribe from forex-focused to futures-focused terminology and features while maintaining the existing design, UI, and core functionality. The conversion focuses on replacing forex-specific terms (pips, lots, currency pairs) with futures equivalents (points, contracts, futures instruments) and adapting calculations accordingly. The existing design, layout, and user experience will remain unchanged.

## Alignment with Product Vision

The conversion aligns with the product vision by maintaining the strong foundation of institutional-grade analytics and risk management while shifting the market focus from forex to futures. All existing UI components, layouts, and user workflows will be preserved with only terminology and underlying calculations updated for futures markets.

## Requirements

### Requirement 1: Terminology Conversion

**User Story:** As a futures trader, I want to see futures-appropriate terminology throughout the application, so that the interface feels natural for futures trading.

#### Acceptance Criteria

1. WHEN I view the application THEN all "pip" references SHALL be changed to "point"
2. IF I see "lot size" THEN it SHALL be changed to "contract size" or "number of contracts"
3. WHEN I see "currency pair" THEN it SHALL be changed to "futures instrument" or "contract"
4. IF I see "spread" THEN it SHALL be changed to "bid-ask spread" or "tick spread"

### Requirement 2: Trade Data Model Updates

**User Story:** As a futures trader, I want the trade data structure to reflect futures trading concepts, so that I can accurately track my futures trades.

#### Acceptance Criteria

1. WHEN I add a new trade THEN the system SHALL use "contract size" instead of "lot size"
2. IF I enter position size THEN the system SHALL use "number of contracts" instead of "lot size"
3. WHEN I view P&L THEN the system SHALL show "points" instead of "pips"
4. IF I see margin information THEN the system SHALL display "margin requirement" instead of "leverage"

### Requirement 3: Calculation Updates

**User Story:** As a futures trader, I want calculations to be appropriate for futures markets, so that my performance metrics are accurate.

#### Acceptance Criteria

1. WHEN I calculate P&L THEN the system SHALL use point value instead of pip value
2. IF I calculate position size THEN the system SHALL use contract specifications
3. WHEN I calculate risk THEN the system SHALL use margin requirements instead of leverage
4. IF I calculate returns THEN the system SHALL use contract value instead of lot value

### Requirement 4: UI Label Updates

**User Story:** As a futures trader, I want all form labels and UI text to use futures terminology, so that the interface is intuitive for futures trading.

#### Acceptance Criteria

1. WHEN I view trade forms THEN all labels SHALL use futures terminology (contract size, points, etc.)
2. IF I see analytics labels THEN they SHALL reflect futures concepts
3. WHEN I view trade details THEN the display SHALL show futures-appropriate field names
4. IF I see help text THEN it SHALL explain futures concepts instead of forex concepts

### Requirement 5: Preserve Existing Design and Functionality

**User Story:** As an existing user, I want the application to look and function exactly the same, just with futures terminology, so that my workflow is not disrupted.

#### Acceptance Criteria

1. WHEN I use the application THEN the UI layout SHALL remain identical to the current design
2. IF I view existing trades THEN they SHALL display in the same format with updated terminology
3. WHEN I use existing features THEN all functionality SHALL work exactly as before
4. IF I view analytics THEN the charts and displays SHALL look identical with updated labels

### Requirement 6: Data Migration

**User Story:** As an existing user, I want my existing trade data to be automatically updated with new terminology, so that I don't lose any historical data.

#### Acceptance Criteria

1. WHEN I open the application THEN existing trades SHALL be automatically migrated to use futures terminology
2. IF I have existing "pip" data THEN it SHALL be converted to "point" data
3. WHEN I view historical trades THEN they SHALL display with updated field names
4. IF I export data THEN it SHALL use the new futures terminology

## Non-Functional Requirements

### Code Architecture and Modularity
- **Single Responsibility Principle**: Terminology changes should be isolated in configuration files
- **Modular Design**: Futures terminology should be configurable and easily changeable
- **Dependency Management**: Changes should not affect existing business logic
- **Clear Interfaces**: Terminology updates should not change component interfaces

### Performance
- Terminology updates must not impact application performance
- Data migration must complete within 2 seconds for typical datasets
- UI updates must be instant and smooth
- Existing performance must be maintained

### Security
- Data migration must preserve all existing trade data
- No data loss during terminology conversion
- Existing security measures must remain intact
- User data must be backed up before migration

### Reliability
- System must function identically after terminology changes
- Data migration must be reversible
- All existing features must work with new terminology
- Existing reliability guarantees must be maintained

### Usability
- Terminology changes must be intuitive for futures traders
- Existing users must be able to use the application without retraining
- Help text and tooltips must be updated to reflect futures concepts
- UI must remain familiar and easy to use