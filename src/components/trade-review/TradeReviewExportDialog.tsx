import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { 
  Download, 
  Calendar as CalendarIcon, 
  X, 
  FileText, 
  Share2, 
  Eye,
  Lock,
  Globe,
  Shield
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import { EnhancedTrade } from '../../types/tradeReview';
import { 
  TradeReviewExportService, 
  TradeReviewExportOptions, 
  ExportFormat,
  ExportFieldConfig,
  ShareableReport
} from '../../lib/tradeReviewExportService';

interface TradeReviewExportDialogProps {
  trade?: EnhancedTrade;
  trades?: EnhancedTrade[];
  trigger?: React.ReactNode;
  onExportComplete?: (format: ExportFormat, filename: string) => void;
  onShareCreated?: (shareableReport: ShareableReport) => void;
}

export const TradeReviewExportDialog: React.FC<TradeReviewExportDialogProps> = ({
  trade,
  trades,
  trigger,
  onExportComplete,
  onShareCreated
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'export' | 'share'>('export');
  const [options, setOptions] = useState<TradeReviewExportOptions>(
    TradeReviewExportService.getDefaultExportOptions()
  );
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [filename, setFilename] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isCreatingShare, setIsCreatingShare] = useState(false);
  
  // Share options
  const [shareAccessLevel, setShareAccessLevel] = useState<'public' | 'protected' | 'private'>('private');
  const [sharePassword, setSharePassword] = useState('');
  const [shareExpiresIn, setShareExpiresIn] = useState<number>(24);
  const [shareMaxAccess, setShareMaxAccess] = useState<number>(10);
  const [createdShare, setCreatedShare] = useState<ShareableReport | null>(null);

  const availableFields = TradeReviewExportService.getAvailableFields();
  const tradesToExport = trade ? [trade] : (trades || []);
  const allTags = Array.from(new Set(tradesToExport.flatMap(t => t.tags || [])));

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      // Update options with filters
      const exportOptions: TradeReviewExportOptions = {
        ...options,
        dateRange: startDate && endDate ? {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        } : undefined,
        tagFilter: selectedTags.length > 0 ? selectedTags : undefined
      };

      // Validate options
      const validation = TradeReviewExportService.validateExportOptions(exportOptions);
      if (!validation.isValid) {
        alert(`Export validation failed:\n${validation.errors.join('\n')}`);
        return;
      }

      // Generate filename if not provided
      const exportFilename = filename || `trade-review-${tradesToExport.length === 1 ? tradesToExport[0].id : 'multiple'}-${new Date().toISOString().split('T')[0]}`;

      // Perform export
      let blob: Blob;
      if (tradesToExport.length === 1) {
        blob = await TradeReviewExportService.exportTrade(tradesToExport[0], exportOptions);
      } else {
        blob = await TradeReviewExportService.exportTrades(tradesToExport, exportOptions);
      }

      // Download the file
      TradeReviewExportService.downloadExport(blob, exportFilename, exportOptions.format);
      
      // Notify parent component
      onExportComplete?.(exportOptions.format, exportFilename);
      
      // Close dialog
      setIsOpen(false);
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCreateShare = async () => {
    if (!trade) {
      alert('Sharing is only available for individual trades.');
      return;
    }

    setIsCreatingShare(true);
    
    try {
      const shareOptions = {
        password: shareAccessLevel === 'protected' ? sharePassword : undefined,
        expiresIn: shareExpiresIn,
        maxAccess: shareMaxAccess
      };

      const shareableReport = await TradeReviewExportService.createShareableReport(
        trade,
        shareAccessLevel,
        shareOptions
      );

      setCreatedShare(shareableReport);
      onShareCreated?.(shareableReport);
      
    } catch (error) {
      console.error('Share creation failed:', error);
      alert('Failed to create shareable report. Please try again.');
    } finally {
      setIsCreatingShare(false);
    }
  };

  const copyShareUrl = () => {
    if (createdShare) {
      navigator.clipboard.writeText(createdShare.shareUrl);
      alert('Share URL copied to clipboard!');
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const getFieldsByCategory = (category: ExportFieldConfig['category']) => {
    return availableFields.filter(field => field.category === category);
  };

  const filteredTradesCount = tradesToExport.filter(trade => {
    // Apply date filter
    if (startDate && endDate) {
      const tradeDate = new Date(trade.date);
      if (tradeDate < startDate || tradeDate > endDate) return false;
    }
    
    // Apply tag filter
    if (selectedTags.length > 0) {
      if (!trade.tags || !trade.tags.some(tag => selectedTags.includes(tag))) {
        return false;
      }
    }
    
    return true;
  }).length;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export & Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Export & Share Trade Review
            {tradesToExport.length === 1 && ` - ${tradesToExport[0].currencyPair}`}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'export' | 'share')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </TabsTrigger>
            <TabsTrigger value="share" className="flex items-center gap-2" disabled={!trade}>
              <Share2 className="w-4 h-4" />
              Share
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-6">
            {/* Export Format and Filename */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="format">Export Format</Label>
                <Select
                  value={options.format}
                  onValueChange={(value: ExportFormat) => 
                    setOptions(prev => ({ ...prev, format: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF Report</SelectItem>
                    <SelectItem value="csv">CSV Data</SelectItem>
                    <SelectItem value="json">JSON Data</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="filename">Filename (optional)</Label>
                <Input
                  id="filename"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder={`trade-review-${tradesToExport.length === 1 ? tradesToExport[0].id : 'multiple'}`}
                />
              </div>
            </div>

            {/* Data Inclusion Options */}
            <Card>
              <CardHeader>
                <CardTitle>Data to Include</CardTitle>
                <CardDescription>Select which data categories to include in the export</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeBasicTradeData"
                      checked={options.includeBasicTradeData}
                      onCheckedChange={(checked) => 
                        setOptions(prev => ({ ...prev, includeBasicTradeData: !!checked }))
                      }
                    />
                    <Label htmlFor="includeBasicTradeData">Basic Trade Data</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includePerformanceMetrics"
                      checked={options.includePerformanceMetrics}
                      onCheckedChange={(checked) => 
                        setOptions(prev => ({ ...prev, includePerformanceMetrics: !!checked }))
                      }
                    />
                    <Label htmlFor="includePerformanceMetrics">Performance Metrics</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeNotes"
                      checked={options.includeNotes}
                      onCheckedChange={(checked) => 
                        setOptions(prev => ({ ...prev, includeNotes: !!checked }))
                      }
                    />
                    <Label htmlFor="includeNotes">Trade Notes</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeCharts"
                      checked={options.includeCharts}
                      onCheckedChange={(checked) => 
                        setOptions(prev => ({ ...prev, includeCharts: !!checked }))
                      }
                    />
                    <Label htmlFor="includeCharts">Chart Information</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeReviewWorkflow"
                      checked={options.includeReviewWorkflow}
                      onCheckedChange={(checked) => 
                        setOptions(prev => ({ ...prev, includeReviewWorkflow: !!checked }))
                      }
                    />
                    <Label htmlFor="includeReviewWorkflow">Review Workflow</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Filters */}
            {tradesToExport.length > 1 && (
              <>
                {/* Date Range Filter */}
                <Card>
                  <CardHeader>
                    <CardTitle>Date Range Filter</CardTitle>
                    <CardDescription>Filter trades by date range (optional)</CardDescription>
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>

                {/* Tag Filter */}
                {allTags.length > 0 && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Tag Filter</CardTitle>
                          <CardDescription>Filter trades by tags (optional)</CardDescription>
                        </div>
                        {selectedTags.length > 0 && (
                          <Button variant="ghost" size="sm" onClick={() => setSelectedTags([])}>
                            <X className="w-4 h-4 mr-1" />
                            Clear
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {allTags.map(tag => (
                          <Badge
                            key={tag}
                            variant={selectedTags.includes(tag) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => toggleTag(tag)}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Export Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Export Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  {filteredTradesCount} of {tradesToExport.length} trades will be exported as {options.format.toUpperCase()}
                </p>
              </CardContent>
            </Card>

            {/* Export Actions */}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleExport} disabled={isExporting}>
                {isExporting ? 'Exporting...' : `Export ${options.format.toUpperCase()}`}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="share" className="space-y-6">
            {!createdShare ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Share Settings</CardTitle>
                    <CardDescription>Configure access controls for the shared report</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Access Level */}
                    <div className="space-y-2">
                      <Label>Access Level</Label>
                      <Select
                        value={shareAccessLevel}
                        onValueChange={(value: 'public' | 'protected' | 'private') => 
                          setShareAccessLevel(value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">
                            <div className="flex items-center gap-2">
                              <Globe className="w-4 h-4" />
                              Public - Anyone with link can view
                            </div>
                          </SelectItem>
                          <SelectItem value="protected">
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4" />
                              Protected - Requires password
                            </div>
                          </SelectItem>
                          <SelectItem value="private">
                            <div className="flex items-center gap-2">
                              <Lock className="w-4 h-4" />
                              Private - Restricted access
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Password for protected access */}
                    {shareAccessLevel === 'protected' && (
                      <div className="space-y-2">
                        <Label htmlFor="sharePassword">Password</Label>
                        <Input
                          id="sharePassword"
                          type="password"
                          value={sharePassword}
                          onChange={(e) => setSharePassword(e.target.value)}
                          placeholder="Enter password for protected access"
                        />
                      </div>
                    )}

                    {/* Expiration */}
                    <div className="space-y-2">
                      <Label htmlFor="shareExpiresIn">Expires In (hours)</Label>
                      <Input
                        id="shareExpiresIn"
                        type="number"
                        value={shareExpiresIn}
                        onChange={(e) => setShareExpiresIn(parseInt(e.target.value) || 24)}
                        min="1"
                        max="8760"
                      />
                    </div>

                    {/* Max Access Count */}
                    <div className="space-y-2">
                      <Label htmlFor="shareMaxAccess">Maximum Access Count</Label>
                      <Input
                        id="shareMaxAccess"
                        type="number"
                        value={shareMaxAccess}
                        onChange={(e) => setShareMaxAccess(parseInt(e.target.value) || 10)}
                        min="1"
                        max="1000"
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateShare} disabled={isCreatingShare}>
                    {isCreatingShare ? 'Creating Share...' : 'Create Shareable Report'}
                  </Button>
                </div>
              </>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="w-5 h-5" />
                    Shareable Report Created
                  </CardTitle>
                  <CardDescription>Your trade report is now available for sharing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Share URL</Label>
                    <div className="flex gap-2">
                      <Input
                        value={createdShare.shareUrl}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button onClick={copyShareUrl} variant="outline">
                        Copy
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Access Level:</strong> {createdShare.accessLevel}
                    </div>
                    <div>
                      <strong>Max Access:</strong> {createdShare.maxAccess}
                    </div>
                    <div>
                      <strong>Expires:</strong> {createdShare.expiresAt 
                        ? new Date(createdShare.expiresAt).toLocaleString()
                        : 'Never'
                      }
                    </div>
                    <div>
                      <strong>Access Count:</strong> {createdShare.accessCount}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                      Close
                    </Button>
                    <Button onClick={() => window.open(createdShare.shareUrl, '_blank')}>
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default TradeReviewExportDialog;