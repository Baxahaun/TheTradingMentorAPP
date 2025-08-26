import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { DatePicker } from '../ui/date-picker';
import { ProfessionalStrategy } from '../../types/strategy';
import { Trade } from '../../types/trade';
import { ExportOptions, ReportTemplate } from '../../types/export';
import { StrategyExportService } from '../../services/StrategyExportService';
import { Download, FileText, Table, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  strategy: ProfessionalStrategy;
  trades: Trade[];
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  open,
  onOpenChange,
  strategy,
  trades
}) => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    includeCharts: true,
    anonymize: false
  });
  const [selectedTemplate, setSelectedTemplate] = useState<string>('default');
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});
  const [isExporting, setIsExporting] = useState(false);

  const exportService = new StrategyExportService();
  const availableTemplates = exportService.getAvailableTemplates();

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const template = availableTemplates.find(t => t.id === selectedTemplate);
      const options: ExportOptions = {
        ...exportOptions,
        template,
        dateRange: dateRange.start && dateRange.end ? {
          start: dateRange.start,
          end: dateRange.end
        } : undefined
      };

      let result;
      switch (exportOptions.format) {
        case 'pdf':
          result = await exportService.exportToPDF(strategy, trades, options);
          break;
        case 'csv':
          result = await exportService.exportToCSV(strategy, trades, options);
          break;
        default:
          throw new Error('Unsupported export format');
      }

      if (result.success && result.data) {
        // Create download link
        const url = URL.createObjectURL(
          result.data instanceof Blob 
            ? result.data 
            : new Blob([result.data], { type: 'text/csv' })
        );
        
        const link = document.createElement('a');
        link.href = url;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(`Strategy report exported successfully as ${result.filename}`);
        onOpenChange(false);
      } else {
        toast.error(result.error || 'Export failed');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrintableSummary = async () => {
    setIsExporting(true);
    
    try {
      const result = await exportService.generatePrintableSummary(strategy, trades, {
        format: 'pdf',
        anonymize: exportOptions.anonymize
      });

      if (result.success && result.data) {
        const url = URL.createObjectURL(result.data as Blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success('Printable summary generated successfully');
      } else {
        toast.error(result.error || 'Failed to generate summary');
      }
    } catch (error) {
      toast.error('Failed to generate printable summary');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Strategy Report
          </DialogTitle>
          <DialogDescription>
            Export your strategy performance data and analysis in various formats.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select
              value={exportOptions.format}
              onValueChange={(value: 'pdf' | 'csv') => 
                setExportOptions(prev => ({ ...prev, format: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    PDF Report
                  </div>
                </SelectItem>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <Table className="h-4 w-4" />
                    CSV Data
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Template Selection (PDF only) */}
          {exportOptions.format === 'pdf' && (
            <div className="space-y-2">
              <Label>Report Template</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableTemplates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date Range */}
          <div className="space-y-2">
            <Label>Date Range (Optional)</Label>
            <div className="flex gap-2">
              <DatePicker
                date={dateRange.start}
                onDateChange={(date) => setDateRange(prev => ({ ...prev, start: date }))}
                placeholder="Start date"
              />
              <DatePicker
                date={dateRange.end}
                onDateChange={(date) => setDateRange(prev => ({ ...prev, end: date }))}
                placeholder="End date"
              />
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeCharts"
                checked={exportOptions.includeCharts}
                onCheckedChange={(checked) => 
                  setExportOptions(prev => ({ ...prev, includeCharts: !!checked }))
                }
              />
              <Label htmlFor="includeCharts">Include performance charts</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="anonymize"
                checked={exportOptions.anonymize}
                onCheckedChange={(checked) => 
                  setExportOptions(prev => ({ ...prev, anonymize: !!checked }))
                }
              />
              <Label htmlFor="anonymize">
                Anonymize data for sharing
                <span className="text-sm text-muted-foreground block">
                  Removes dollar amounts and sensitive information
                </span>
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handlePrintableSummary}
            disabled={isExporting}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Quick Summary
          </Button>
          
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export Report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};