# Export Components

This directory contains components for exporting and sharing strategy performance data.

## Components

### ExportPanel
Main component that provides export and sharing functionality for strategies.

**Props:**
- `strategy: ProfessionalStrategy` - The strategy to export
- `trades: Trade[]` - Associated trades data
- `className?: string` - Optional CSS classes

**Features:**
- Quick export actions (PDF, CSV, Print, Secure Share)
- Advanced customization options
- Strategy summary display

### ExportDialog
Modal dialog for configuring and executing exports.

**Props:**
- `open: boolean` - Dialog visibility state
- `onOpenChange: (open: boolean) => void` - Dialog state handler
- `strategy: ProfessionalStrategy` - Strategy data
- `trades: Trade[]` - Trade data

**Features:**
- Format selection (PDF/CSV)
- Template selection
- Date range filtering
- Anonymization options
- Chart inclusion toggle

### TemplateCustomizer
Dialog for creating custom report templates.

**Props:**
- `open: boolean` - Dialog visibility state
- `onOpenChange: (open: boolean) => void` - Dialog state handler
- `onTemplateCreated: (template: ReportTemplate) => void` - Template creation callback
- `baseTemplate?: ReportTemplate` - Optional base template to customize

**Features:**
- Section configuration
- Styling customization
- Color and font selection
- Header/footer options

### SecureShareDialog
Dialog for generating secure, time-limited sharing links.

**Props:**
- `open: boolean` - Dialog visibility state
- `onOpenChange: (open: boolean) => void` - Dialog state handler
- `strategy: ProfessionalStrategy` - Strategy data
- `trades: Trade[]` - Trade data

**Features:**
- Report type selection
- Anonymization options
- Password protection
- Access limits (time and view count)
- Link generation and management

## Usage

```tsx
import { ExportPanel } from './components/export/ExportPanel';

function StrategyDetailView({ strategy, trades }) {
  return (
    <div>
      {/* Other strategy content */}
      
      <ExportPanel 
        strategy={strategy} 
        trades={trades}
        className="mt-6"
      />
    </div>
  );
}
```

## Export Formats

### PDF Reports
- Comprehensive strategy analysis
- Professional formatting
- Customizable templates
- Chart integration (when available)
- Anonymization support

### CSV Data
- Raw trade data
- Strategy metadata
- Performance metrics
- Suitable for external analysis

### Printable Summaries
- Condensed overview
- Key metrics only
- Optimized for printing

## Security Features

### Anonymization
- Removes dollar amounts
- Masks sensitive information
- Preserves ratios and percentages
- Safe for sharing

### Secure Sharing
- Time-limited access
- View count limits
- Password protection
- Revocable links
- Access tracking

## Dependencies

- `jspdf` - PDF generation
- `jspdf-autotable` - Table formatting in PDFs
- `date-fns` - Date formatting
- `sonner` - Toast notifications

## Implementation Notes

1. **PDF Generation**: Uses jsPDF with autotable plugin for professional formatting
2. **CSV Export**: Generates RFC 4180 compliant CSV files
3. **Anonymization**: Preserves statistical validity while removing sensitive data
4. **Template System**: Flexible section-based template configuration
5. **Security**: Implements secure sharing with configurable access controls

## Future Enhancements

- Chart generation for PDF reports
- Email sharing integration
- Batch export for multiple strategies
- Advanced template marketplace
- Real-time collaboration features