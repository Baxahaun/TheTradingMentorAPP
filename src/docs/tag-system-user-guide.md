# Trade Tagging System - User Guide

## Overview

The Trade Tagging System allows you to organize and categorize your trades using custom tags. Tags help you quickly identify patterns, analyze performance by strategy or market condition, and filter your trade history for better insights.

## What are Tags?

Tags are custom labels you can add to your trades. They start with a `#` symbol and can describe anything meaningful to your trading:

- **Strategies**: `#scalping`, `#swing`, `#daytrading`
- **Market Conditions**: `#trending`, `#ranging`, `#volatile`
- **Emotional States**: `#confident`, `#tired`, `#focused`
- **Setups**: `#breakout`, `#pullback`, `#reversal`
- **Time of Day**: `#morning`, `#afternoon`, `#evening`
- **Market Sessions**: `#london`, `#newyork`, `#asian`

## Adding Tags to Trades

### When Creating a New Trade

1. Open the "Add Trade" form
2. Scroll to the "Tags" section
3. Start typing in the tag input field
4. Tags are automatically formatted with `#` prefix
5. Press `Enter` to add each tag
6. Use `Backspace` to remove the last tag

**Tips:**
- Tags are automatically suggested based on your existing tags
- Use arrow keys to navigate suggestions
- Press `Tab` or `Enter` to select a suggestion
- Duplicate tags are automatically prevented

### When Editing Existing Trades

1. Open any trade for editing
2. Find the "Tags" section in the edit form
3. Add or remove tags using the same interface
4. Changes are saved when you save the trade

## Using Tag Autocomplete

The system learns from your existing tags and provides intelligent suggestions:

- **Most Used Tags**: Frequently used tags appear first
- **Recent Tags**: Recently used tags are prioritized
- **Partial Matching**: Type part of a tag to see matches
- **Case Insensitive**: Works regardless of capitalization

## Filtering Trades by Tags

### Basic Tag Filtering

1. Go to your Trade Log
2. Click the "Tags" filter button
3. Select one or more tags from the dropdown
4. Your trades are instantly filtered

### Advanced Filtering Options

**Filter Modes:**
- **AND Mode**: Shows trades that have ALL selected tags
- **OR Mode**: Shows trades that have ANY of the selected tags

**Search Within Tags:**
Use the search box in the tag filter to quickly find specific tags.

**Clear Filters:**
Click "Clear all filters" to remove all tag filters.

## Tag Manager

Access comprehensive tag management through the Tag Manager:

### Opening Tag Manager
1. Go to Trade Log
2. Click the tag filter dropdown
3. Click "Manage Tags" (or use the dedicated Tag Manager button)

### Tag Manager Features

**View All Tags:**
- See all your tags with usage statistics
- View trade counts for each tag
- See when each tag was last used

**Performance Metrics:**
- Win rate for each tag
- Average P&L per tag
- Profit factor calculations
- Performance indicators (Strong/Good/Mixed/Poor)

**Sorting Options:**
- **Usage**: Most used tags first
- **Performance**: Best performing tags first
- **Recent**: Most recently used tags first
- **Alphabetical**: A-Z sorting

**Tag Actions:**
- Click any tag to filter trades
- Delete unused or unwanted tags
- View detailed analytics

## Bulk Tag Operations

Efficiently manage tags across multiple trades:

### Selecting Multiple Trades
1. In Trade Log, use checkboxes to select trades
2. Or click "Select All" to select all visible trades

### Bulk Tag Actions
1. With trades selected, click "Edit Tags"
2. Choose your operation:
   - **Add Tags**: Add tags to all selected trades
   - **Remove Tags**: Remove specific tags from selected trades
   - **Replace All Tags**: Replace all tags with new ones

### Confirmation and Results
- Review changes before applying
- See success/failure counts after operation
- Undo is not available, so review carefully

## Advanced Tag Search

Use powerful search syntax for complex filtering:

### Search Operators
- **AND**: `#scalping AND #morning` - Trades with both tags
- **OR**: `#scalping OR #swing` - Trades with either tag
- **NOT**: `NOT #scalping` - Trades without the scalping tag

### Combining Operators
- `#morning AND (#scalping OR #swing)` - Morning trades that are either scalping or swing
- `#trending NOT #breakout` - Trending trades that aren't breakouts

### Search Tips
- Use parentheses for complex logic
- Search is case-insensitive
- Partial tag matching is supported

## Tag Analytics and Insights

### Performance Analysis
View how different tags perform:
- **Win Rate**: Percentage of winning trades for each tag
- **Average P&L**: Average profit/loss per tag
- **Profit Factor**: Ratio of gross profit to gross loss
- **Trade Count**: Number of trades using each tag

### Usage Statistics
- **Most Used Tags**: Your most frequently applied tags
- **Recent Tags**: Tags you've used recently
- **Tag Trends**: How your tag usage changes over time

### Comparative Analysis
- Compare performance between different tags
- Identify your most and least profitable strategies
- Spot patterns in your trading behavior

## Best Practices

### Tag Naming Conventions
- **Be Consistent**: Use the same format (e.g., always lowercase)
- **Be Descriptive**: `#morningscalp` vs `#ms`
- **Avoid Spaces**: Use underscores or camelCase instead
- **Keep It Short**: Shorter tags are easier to work with

### Effective Tagging Strategies
- **Start Simple**: Begin with basic strategy tags
- **Add Gradually**: Introduce new tag categories over time
- **Review Regularly**: Clean up unused or redundant tags
- **Be Specific**: More specific tags provide better insights

### Tag Categories to Consider
1. **Strategy Type**: `#scalping`, `#swing`, `#position`
2. **Market Condition**: `#trending`, `#ranging`, `#volatile`
3. **Entry Reason**: `#breakout`, `#pullback`, `#reversal`
4. **Time Context**: `#morning`, `#afternoon`, `#evening`
5. **Emotional State**: `#confident`, `#uncertain`, `#rushed`
6. **Market Session**: `#london`, `#newyork`, `#asian`
7. **News Impact**: `#news`, `#earnings`, `#economic`

## Troubleshooting

### Common Issues

**Tags Not Saving:**
- Ensure tags follow valid format (alphanumeric, underscores only)
- Check that you're not exceeding the maximum tag limit
- Verify your internet connection for cloud sync

**Autocomplete Not Working:**
- Make sure you have existing tags in your system
- Check that the tag input field is focused
- Try typing more characters for better matching

**Filter Not Showing Expected Results:**
- Verify you're using the correct filter mode (AND vs OR)
- Check for typos in tag names
- Ensure the trades actually have the tags you're filtering for

**Performance Issues:**
- Large numbers of tags may slow down operations
- Consider cleaning up unused tags periodically
- Contact support if performance doesn't improve

### Getting Help

If you encounter issues:
1. Check this user guide for solutions
2. Review the FAQ section
3. Contact customer support with specific details
4. Include screenshots when reporting problems

## Keyboard Shortcuts

Speed up your tagging workflow:

- `Enter`: Add current tag
- `Tab`: Select highlighted suggestion
- `Backspace`: Remove last tag (when input is empty)
- `Arrow Keys`: Navigate suggestions
- `Escape`: Close suggestions dropdown

## Data Export and Backup

Your tags are included in all data exports:
- **CSV Export**: Tags appear as comma-separated values
- **JSON Export**: Full tag data with metadata
- **Backup**: Tags are included in automatic backups

## Privacy and Security

- Tags are stored securely with your trade data
- Tags are private to your account
- No tag data is shared with other users
- Regular backups protect against data loss

## Updates and New Features

The tagging system is continuously improved:
- New features are announced in release notes
- Feedback is welcome for future enhancements
- Backward compatibility is maintained
- Migration tools handle any data format changes

---

*Last updated: January 2024*
*Version: 1.0*