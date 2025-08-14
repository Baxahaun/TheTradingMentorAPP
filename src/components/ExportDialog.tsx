import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Badge } from './ui/badge';
import { Download, Calendar as CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { Trade, SetupType, PatternType } from '../types/trade';
import { ExportService, ExportOptions } from '../lib/exportService';

interface ExportDialogProps {
  trades: Trade[];
  trigger?: React.ReactNode;
}

const SETUP_TYPE_OPTIONS = [
  { value: SetupType.TREND_CONTINUATION, label: 'Trend Continuation' },
  { value: SetupType.PULLBACK_ENTRY, label: 'Pullback Entry' },
  { value: SetupType.BREAKOUT_CONTINUATION, label: 'Breakout Continuation' },
  { value: SetupType.SUPPORT_RESISTANCE_BOUNCE, label: 'Support/Resistance Bounce' },
  { value: SetupType.DOUBLE_TOP_BOTTOM, label: 'Double Top/Bottom' },
  { value: SetupType.HEAD_SHOULDERS, label: 'Head & Shoulders' },
  { value: SetupType.RANGE_BREAKOUT, label: 'Range Breakout' },
  { value: SetupType.TRIANGLE_BREAKOUT, label: 'Triangle Breakout' },
  { value: SetupType.FLAG_PENNANT_BREAKOUT, label: 'Flag/Pennant Breakout' },
  { value: SetupType.NEWS_REACTION, label: 'News Reaction' },
  { value: SetupType.ECONOMIC_DATA, label: 'Economic Data' },
  { value: SetupType.CENTRAL_BANK, label: 'Central Bank' },
  { value: SetupType.CUSTOM, label: 'Custom' }
];

const PATTERN_TYPE_OPTIONS = [
  { value: PatternType.DOJI, label: 'Doji' },
  { value: PatternType.HAMMER, label: 'Hammer' },
  { value: PatternType.ENGULFING, label: 'Engulfing' },
  { value: PatternType.PIN_BAR, label: 'Pin Bar' },
  { value: PatternType.INSIDE_BAR, label: 'Inside Bar' },
  { value: PatternType.TRIANGLE, label: 'Triangle' },
  { value: PatternType.FLAG, label: 'Flag' },
  { value: PatternType.PENNANT, label: 'Pennant' },
  { value: PatternType.WEDGE, label: 'Wedge' },
  { value: PatternType.RECTANGLE, label: 'Rectangle' },
  { value: PatternType.HORIZONTAL_LEVEL, label: 'Horizontal Level' },
  { value: PatternType.DYNAMIC_LEVEL, label: 'Dynamic Level' },
  { value: PatternType.PSYCHOLOGICAL_LEVEL, label: 'Psychological Level' },
  { value: PatternType.ASCENDING_TREND, label: 'Ascending Trend' },
  { value: PatternType.DESCENDING_TREND, label: 'Descending Trend' },
  { value: PatternType.CHANNEL_LINES, label: 'Channel Lines' },
  { value: PatternType.RETRACEMENT, label: 'Fibonacci Retracement' },
  { value: PatternType.EXTENSION, label: 'Fibonacci Extension' },
  { value: PatternType.CLUSTER, label: 'Fibonacci Cluster' },
  { value: PatternType.CUSTOM, label: 'Custom' }
];

export const ExportDialog: React.FC<ExportDialogProps> = ({ trades, trigger }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ExportOptions>(ExportService.getDefaultExportOptions());
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [filename, setFilename] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      // Update options with date range if set
      const exportOptions: ExportOptions = {
        ...options,
        dateRange: startDate && endDate ? {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        } : undefined
      };

      // Validate options
      const validation = ExportService.validateExportOptions(exportOptions);
      if (!validation.isValid) {
        alert(`Export validation failed:\n${validation.errors.join('\n')}`);
        return;
      }

      // Generate filename if not provided
      const exportFilename = filename || `trades-export-${new Date().toISOString().split('T')[0]}.csv`;

      // Perform export
      ExportService.downloadExport(trades, exportOptions, exportFilename);
      
      // Close dialog
      setIsOpen(false);
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const toggleSetupType = (setupType: SetupType) => {
    const current = options.setupTypeFilter || [];
    const updated = current.includes(setupType)
      ? current.filter(type => type !== setupType)
      : [...current, setupType];
    
    setOptions(prev => ({
      ...prev,
      setupTypeFilter: updated.length > 0 ? updated : undefined
    }));
  };

  const togglePatternType = (patternType: PatternType) => {
    const current = options.patternTypeFilter || [];
    const updated = current.includes(patternType)
      ? current.filter(type => type !== patternType)
      : [...current, patternType];
    
    setOptions(prev => ({
      ...prev,
      patternTypeFilter: updated.length > 0 ? updated : undefined
    }));
  };

  const clearSetupFilters = () => {
    setOptions(prev => ({ ...prev, setupTypeFilter: undefined }));
  };

  const clearPatternFilters = () => {
    setOptions(prev => ({ ...prev, patternTypeFilter: undefined }));
  };

  const filteredTradesCount = ExportService.getExportMetadata(trades, {
    ...options,
    dateRange: startDate && endDate ? {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    } : undefined
  }).totalTrades;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Trades
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export Trade Data</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Export Format and Filename */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="format">Export Format</Label>
              <Select
                value={options.format}
                onValueChange={(value: 'csv' | 'excel') => 
                  setOptions(prev => ({ ...prev, format: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="excel">Excel CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="filename">Filename (optional)</Label>
              <Input
                id="filename"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="trades-export-2024-01-15.csv"
              />
            </div>
          </div>

          {/* Data Inclusion Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Data to Include</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeSetupData"
                  checked={options.includeSetupData}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, includeSetupData: !!checked }))
                  }
                />
                <Label htmlFor="includeSetupData">Setup Classification Data</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includePatternData"
                  checked={options.includePatternData}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, includePatternData: !!checked }))
                  }
                />
                <Label htmlFor="includePatternData">Pattern Recognition Data</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includePartialCloses"
                  checked={options.includePartialCloses}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, includePartialCloses: !!checked }))
                  }
                />
                <Label htmlFor="includePartialCloses">Partial Close Tracking</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includePositionHistory"
                  checked={options.includePositionHistory}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, includePositionHistory: !!checked }))
                  }
                />
                <Label htmlFor="includePositionHistory">Position History</Label>
              </div>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Date Range (optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Setup Type Filter */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Setup Type Filter (optional)</h3>
              {options.setupTypeFilter && options.setupTypeFilter.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearSetupFilters}>
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {SETUP_TYPE_OPTIONS.map(option => (
                <Badge
                  key={option.value}
                  variant={options.setupTypeFilter?.includes(option.value) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleSetupType(option.value)}
                >
                  {option.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Pattern Type Filter */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Pattern Type Filter (optional)</h3>
              {options.patternTypeFilter && options.patternTypeFilter.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearPatternFilters}>
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {PATTERN_TYPE_OPTIONS.map(option => (
                <Badge
                  key={option.value}
                  variant={options.patternTypeFilter?.includes(option.value) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => togglePatternType(option.value)}
                >
                  {option.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Trade Status Filter (optional)</h3>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeOpen"
                  checked={!options.statusFilter || options.statusFilter.includes('open')}
                  onCheckedChange={(checked) => {
                    const current = options.statusFilter || ['open', 'closed'];
                    const updated = checked 
                      ? [...current.filter(s => s !== 'open'), 'open']
                      : current.filter(s => s !== 'open');
                    setOptions(prev => ({ 
                      ...prev, 
                      statusFilter: updated.length > 0 ? updated as ('open' | 'closed')[] : undefined 
                    }));
                  }}
                />
                <Label htmlFor="includeOpen">Open Trades</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeClosed"
                  checked={!options.statusFilter || options.statusFilter.includes('closed')}
                  onCheckedChange={(checked) => {
                    const current = options.statusFilter || ['open', 'closed'];
                    const updated = checked 
                      ? [...current.filter(s => s !== 'closed'), 'closed']
                      : current.filter(s => s !== 'closed');
                    setOptions(prev => ({ 
                      ...prev, 
                      statusFilter: updated.length > 0 ? updated as ('open' | 'closed')[] : undefined 
                    }));
                  }}
                />
                <Label htmlFor="includeClosed">Closed Trades</Label>
              </div>
            </div>
          </div>

          {/* Export Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-2">Export Summary</h3>
            <p className="text-sm text-gray-600">
              {filteredTradesCount} of {trades.length} trades will be exported
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? 'Exporting...' : 'Export'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;