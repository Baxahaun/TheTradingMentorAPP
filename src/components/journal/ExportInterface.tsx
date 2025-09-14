import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { JournalExportService } from '@/services/JournalExportService';
import { CURRENT_TERMINOLOGY } from '@/lib/terminologyConfig';
import { Trade } from '@/types/trade';
import { toast } from '@/hooks/use-toast';

interface ExportInterfaceProps {
  trades: Trade[];
  className?: string;
}

export const ExportInterface: React.FC<ExportInterfaceProps> = ({
  trades,
  className = ''
}) => {
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'html' | 'pdf'>('csv');
  const [includeSummary, setIncludeSummary] = useState(true);
  const [dateRange, setDateRange] = useState<'all' | 'last30' | 'last90' | 'thisYear'>('all');
  const [customFilename, setCustomFilename] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const getFilteredTrades = (): Trade[] => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    switch (dateRange) {
      case 'last30':
        return trades.filter(trade => new Date(trade.date) >= thirtyDaysAgo);
      case 'last90':
        return trades.filter(trade => new Date(trade.date) >= ninetyDaysAgo);
      case 'thisYear':
        return trades.filter(trade => new Date(trade.date) >= yearStart);
      default:
        return trades;
    }
  };

  const generateFilename = (): string => {
    if (customFilename.trim()) {
      return customFilename.trim();
    }

    const filteredTrades = getFilteredTrades();
    const summary = JournalExportService.getExportSummary(filteredTrades);
    const dateStr = new Date().toISOString().split('T')[0];

    return `${CURRENT_TERMINOLOGY.instrumentLabel.toLowerCase().replace(' ', '-')}-journal-${dateStr}`;
  };

  const handleExport = async () => {
    if (trades.length === 0) {
      toast({
        title: 'No Data to Export',
        description: `No ${CURRENT_TERMINOLOGY.instrumentLabel.toLowerCase()} trades found to export.`,
        variant: 'destructive'
      });
      return;
    }

    setIsExporting(true);
    const filteredTrades = getFilteredTrades();

    try {
      const filename = generateFilename();

      switch (exportFormat) {
        case 'csv':
          JournalExportService.exportToCSV(filteredTrades, `${filename}.csv`);
          break;
        case 'json':
          JournalExportService.exportToJSON(filteredTrades, `${filename}.json`);
          break;
        case 'html':
          JournalExportService.exportToHTML(filteredTrades, `${filename}.html`);
          break;
        case 'pdf':
          // For PDF, we'll generate HTML content that can be printed to PDF
          const pdfContent = JournalExportService.generatePDFContent(filteredTrades);
          const blob = new Blob([pdfContent], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${filename}.html`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          break;
      }

      toast({
        title: `${CURRENT_TERMINOLOGY.instrumentLabel} Data Exported Successfully`,
        description: `Exported ${filteredTrades.length} trades in ${exportFormat.toUpperCase()} format.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export trading data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const filteredTrades = getFilteredTrades();
  const summary = JournalExportService.getExportSummary(filteredTrades);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export {CURRENT_TERMINOLOGY.instrumentLabel} Data
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Export Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium mb-2">Export Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Trades:</span>
              <span className="font-medium ml-2">{summary.totalTrades}</span>
            </div>
            <div>
              <span className="text-gray-600">Win Rate:</span>
              <span className="font-medium ml-2">{summary.winRate.toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-gray-600">Total P&L:</span>
              <span className={`font-medium ml-2 ${summary.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${summary.totalPnL.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Terminology:</span>
              <span className="font-medium ml-2">{summary.terminology}</span>
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label htmlFor="format">Export Format</Label>
            <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    CSV (Spreadsheet)
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    JSON (Data)
                  </div>
                </SelectItem>
                <SelectItem value="html">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    HTML (Web Report)
                  </div>
                </SelectItem>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <Printer className="h-4 w-4" />
                    PDF (Print to PDF)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label htmlFor="dateRange">Date Range</Label>
            <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Trades</SelectItem>
                <SelectItem value="last30">Last 30 Days</SelectItem>
                <SelectItem value="last90">Last 90 Days</SelectItem>
                <SelectItem value="thisYear">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Custom Filename */}
        <div className="space-y-2">
          <Label htmlFor="filename">Custom Filename (Optional)</Label>
          <Input
            id="filename"
            placeholder={`Leave blank for auto-generated name`}
            value={customFilename}
            onChange={(e) => setCustomFilename(e.target.value)}
          />
          <p className="text-xs text-gray-500">
            Auto-generated: {generateFilename()}
          </p>
        </div>

        {/* Export Options */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="includeSummary"
            checked={includeSummary}
            onCheckedChange={(checked) => setIncludeSummary(checked === true)}
          />
          <Label htmlFor="includeSummary" className="text-sm">
            Include summary statistics
          </Label>
        </div>

        {/* Export Button */}
        <Button
          onClick={handleExport}
          disabled={isExporting || filteredTrades.length === 0}
          className="w-full"
        >
          {isExporting ? (
            <>Exporting...</>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export {filteredTrades.length} {CURRENT_TERMINOLOGY.instrumentLabel.toLowerCase()}(s)
            </>
          )}
        </Button>

        {/* Format Descriptions */}
        <div className="text-xs text-gray-600 space-y-1">
          <p><strong>CSV:</strong> Import into Excel, Google Sheets, or other spreadsheet applications</p>
          <p><strong>JSON:</strong> Machine-readable format for data analysis and backup</p>
          <p><strong>HTML:</strong> Formatted web report that can be viewed in any browser</p>
          <p><strong>PDF:</strong> Save HTML as PDF using browser print functionality</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExportInterface;