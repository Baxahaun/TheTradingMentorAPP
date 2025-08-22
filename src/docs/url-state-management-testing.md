# URL State Management Testing Guide

This document describes how to test the URL state management feature for tag filters in the TradeLog component.

## Feature Overview

The URL state management feature allows users to:
- Share URLs with active tag filter states
- Use browser back/forward navigation with filters
- Persist filter state across page refreshes
- Copy shareable URLs with current filter configuration

## Implementation Status

✅ **COMPLETED** - All core URL state management functionality has been implemented:

- ✅ URL parameter encoding for active tag filters
- ✅ Browser back/forward navigation support for filters  
- ✅ Shareable URLs with tag filter states
- ✅ URL state syncs with filter component state
- ✅ URL state persistence across page refreshes

The implementation includes:
- `useUrlState` hook for generic URL state management
- `useTagFilterUrlState` hook specifically for tag filters
- `createShareableUrl` utility for generating shareable URLs
- `parseTagFiltersFromUrl` utility for parsing shared URLs
- Integration with TradeLog component for real-time URL updates

## Manual Testing Steps

### 1. Basic URL State Persistence

1. Navigate to the Trades page
2. Apply one or more tag filters using the tag filter dropdown
3. Observe that the URL updates to include `tags` and `tagMode` parameters
4. Refresh the page
5. Verify that the filters are still applied after refresh

**Expected URL format:**
```
/trades?tags=%23scalping,%23swing&tagMode=OR
```

### 2. Browser Navigation

1. Apply tag filters on the Trades page
2. Navigate to another page (e.g., Dashboard)
3. Use browser back button to return to Trades page
4. Verify that the tag filters are restored from the URL

### 3. Shareable URLs

1. Apply tag filters on the Trades page
2. Verify that a "Share" button appears when filters are active
3. Click the "Share" button
4. Verify that a success message appears indicating the URL was copied
5. Open a new browser tab/window and paste the URL
6. Verify that the filters are applied in the new tab

### 4. Filter Mode Persistence

1. Apply multiple tag filters
2. Change the filter mode from "AND" to "OR" (or vice versa)
3. Verify that the URL updates to include `tagMode=OR` or removes it for AND mode
4. Refresh the page and verify the filter mode is preserved

### 5. URL Parameter Cleanup

1. Apply tag filters (URL should have parameters)
2. Clear all filters using the "Clear All" button
3. Verify that the URL parameters are removed and URL returns to `/trades`

## URL Parameter Format

- `tags`: Comma-separated list of URL-encoded tag names (e.g., `%23scalping,%23swing`)
- `tagMode`: Filter mode, only present when set to "OR" (defaults to "AND")

## Test Cases Covered by Unit Tests

The following scenarios are automatically tested:

- URL parameter encoding/decoding
- State synchronization between URL and component
- Default value handling
- Invalid URL parameter handling
- Shareable URL generation
- Browser navigation simulation

## Browser Compatibility

The feature uses:
- `URLSearchParams` API (supported in all modern browsers)
- `navigator.clipboard` API (requires HTTPS in production)
- Fallback clipboard method for non-secure contexts

## Troubleshooting

### Share Button Not Working
- Ensure the page is served over HTTPS in production
- Check browser console for clipboard API errors
- Verify that the fallback method is working in development

### URL Not Updating
- Check browser console for navigation errors
- Verify that React Router is properly configured
- Ensure the component is wrapped in a Router context

### Filters Not Persisting
- Check that URL parameters are properly formatted
- Verify that the deserialization logic handles edge cases
- Ensure that the component re-renders when URL changes