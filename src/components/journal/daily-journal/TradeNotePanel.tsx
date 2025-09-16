import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Textarea } from '../../ui/textarea';
import { 
  Upload, 
  Image as ImageIcon, 
  X, 
  Camera, 
  FileText, 
  Brain,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign
} from 'lucide-react';
import { 
  TradeNoteEntry, 
  ScreenshotAttachment, 
  DEFAULT_TRADE_NOTE_CONFIG,
  TradeNoteConfig,
  MAX_SCREENSHOT_SIZE
} from '../../../types/dailyJournal';
import { Trade } from '../../../types/trade';
import { cn } from '../../../lib/utils';

interface TradeNotePanelProps {
  linkedTrade: Trade;
  journalEntry?: TradeNoteEntry;
  onImageUpload: (file: File) => Promise<void>;
  onContentChange: (content: Partial<TradeNoteEntry>) => void;
  config?: Partial<TradeNoteConfig>;
  className?: string;
}

interface ScreenshotUploadState {
  uploading: boolean;
  progress: number;
  message: string;
  dragOver: boolean;
}

/**
 * TradeNotePanel Component
 * 
 * Specialized interface for trade-linked journal entries with trade data display,
 * screenshot gallery, and reflective analysis tools. Leverages existing screenshot
 * management patterns from TradeReviewModal.tsx.
 */
export const TradeNotePanel: React.FC<TradeNotePanelProps> = ({
  linkedTrade,
  journalEntry,
  onImageUpload,
  onContentChange,
  config,
  className
}) => {
  const [uploadState, setUploadState] = useState<ScreenshotUploadState>({
    uploading: false,
    progress: 0,
    message: '',
    dragOver: false
  });
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);

  // Merge configuration with defaults
  const tradeConfig = useMemo((): TradeNoteConfig => ({
    ...DEFAULT_TRADE_NOTE_CONFIG,
    ...config
  }), [config]);

  // Calculate trade metrics
  const tradeMetrics = useMemo(() => {
    const pnl = linkedTrade.pnl || 0;
    const riskAmount = linkedTrade.riskAmount || 0;
    const rMultiple = riskAmount > 0 ? pnl / riskAmount : 0;
    
    return {
      pnl,
      rMultiple,
      isWinning: pnl > 0,
      duration: linkedTrade.timeOut && linkedTrade.timeIn 
        ? calculateTradeDuration(linkedTrade.timeIn, linkedTrade.timeOut)
        : 'Open',
      riskPercentage: linkedTrade.lotSize && linkedTrade.entryPrice 
        ? (riskAmount / (linkedTrade.lotSize * linkedTrade.entryPrice)) * 100
        : 0
    };
  }, [linkedTrade]);

  // Handle file upload with progress tracking
  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    if (file.size > tradeConfig.screenshotMaxSize) {
      alert(`File size must be less than ${(tradeConfig.screenshotMaxSize / 1024 / 1024).toFixed(1)}MB`);
      return;
    }

    const existingScreenshots = journalEntry?.screenshots?.length || 0;
    if (existingScreenshots >= tradeConfig.maxScreenshots) {
      alert(`Maximum ${tradeConfig.maxScreenshots} screenshots allowed`);
      return;
    }

    setUploadState({
      uploading: true,
      progress: 0,
      message: 'Preparing upload...',
      dragOver: false
    });

    try {
      setUploadState(prev => ({ ...prev, progress: 25, message: 'Uploading...' }));
      await onImageUpload(file);
      
      setUploadState(prev => ({ ...prev, progress: 100, message: 'Upload complete!' }));
      setTimeout(() => {
        setUploadState(prev => ({ ...prev, uploading: false, message: '' }));
      }, 2000);
      
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadState({
        uploading: false,
        progress: 0,
        message: 'Upload failed. Please try again.',
        dragOver: false
      });
      setTimeout(() => {
        setUploadState(prev => ({ ...prev, message: '' }));
      }, 3000);
    }
  }, [tradeConfig, journalEntry?.screenshots, onImageUpload]);

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setUploadState(prev => ({ ...prev, dragOver: false }));
    
    if (uploadState.uploading) return;
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && files[0]) {
      handleFileUpload(files[0]);
    }
  }, [uploadState.uploading, handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setUploadState(prev => ({ ...prev, dragOver: true }));
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setUploadState(prev => ({ ...prev, dragOver: false }));
  }, []);

  // Handle text content changes
  const handleAnalysisChange = useCallback((value: string) => {
    onContentChange({ analysisNotes: value });
  }, [onContentChange]);

  const handleStrategyNotesChange = useCallback((value: string) => {
    onContentChange({ strategyNotes: value });
  }, [onContentChange]);

  const handleLessonsLearnedChange = useCallback((value: string) => {
    onContentChange({ lessonsLearned: value });
  }, [onContentChange]);

  // Render trade snapshot
  const renderTradeSnapshot = () => {
    if (!tradeConfig.showTradeSnapshot) return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold">{linkedTrade.currencyPair}</span>
              <Badge variant={linkedTrade.side === 'long' ? 'default' : 'destructive'}>
                {linkedTrade.side === 'long' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {linkedTrade.side.toUpperCase()}
              </Badge>
              <Badge variant={tradeMetrics.isWinning ? 'default' : 'destructive'}>
                <DollarSign className="w-3 h-3 mr-1" />
                {tradeMetrics.pnl >= 0 ? '+' : ''}${tradeMetrics.pnl.toFixed(2)}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              {tradeMetrics.duration}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Entry Price</span>
              <p className="font-medium">${linkedTrade.entryPrice}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Exit Price</span>
              <p className="font-medium">${linkedTrade.exitPrice || 'Open'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Position Size</span>
              <p className="font-medium">{linkedTrade.lotSize}</p>
            </div>
            <div>
              <span className="text-muted-foreground">R-Multiple</span>
              <p className={`font-medium ${tradeMetrics.rMultiple >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {tradeMetrics.rMultiple.toFixed(2)}R
              </p>
            </div>
            {linkedTrade.strategy && (
              <div className="md:col-span-2">
                <span className="text-muted-foreground">Strategy</span>
                <p className="font-medium">{linkedTrade.strategy}</p>
              </div>
            )}
            {linkedTrade.stopLoss && (
              <div>
                <span className="text-muted-foreground">Stop Loss</span>
                <p className="font-medium">${linkedTrade.stopLoss}</p>
              </div>
            )}
            {linkedTrade.takeProfit && (
              <div>
                <span className="text-muted-foreground">Take Profit</span>
                <p className="font-medium">${linkedTrade.takeProfit}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render screenshot gallery
  const renderScreenshotGallery = () => {
    if (!tradeConfig.showScreenshotGallery) return null;

    const screenshots = journalEntry?.screenshots || [];

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Screenshots ({screenshots.length}/{tradeConfig.maxScreenshots})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Upload Area */}
          {tradeConfig.allowScreenshotUpload && screenshots.length < tradeConfig.maxScreenshots && (
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors mb-4",
                uploadState.dragOver ? "border-primary bg-primary/5" : "border-border",
                uploadState.uploading ? "opacity-50 cursor-not-allowed" : "hover:border-primary/50"
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => {
                if (!uploadState.uploading) {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) handleFileUpload(file);
                  };
                  input.click();
                }
              }}
            >
              {uploadState.uploading ? (
                <div className="space-y-2">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm font-medium">{uploadState.message}</p>
                  {uploadState.progress > 0 && (
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadState.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                  <p className="text-sm font-medium">Drag & drop or click to upload</p>
                  <p className="text-xs text-muted-foreground">
                    Max {(tradeConfig.screenshotMaxSize / 1024 / 1024).toFixed(1)}MB • PNG, JPG, WebP
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Screenshot Grid */}
          {screenshots.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {screenshots.map((screenshot) => (
                <div 
                  key={screenshot.id}
                  className="relative group cursor-pointer"
                  onClick={() => setSelectedImageModal(screenshot.firebaseUrl)}
                >
                  <img
                    src={screenshot.thumbnailUrl || screenshot.firebaseUrl}
                    alt={screenshot.description || 'Trade screenshot'}
                    className="w-full h-24 object-cover rounded-lg border"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 rounded-lg" />
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle screenshot deletion
                        console.log('Delete screenshot:', screenshot.id);
                      }}
                      className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      title="Delete screenshot"
                      aria-label="Delete screenshot"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  {screenshot.timeframe && (
                    <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {screenshot.timeframe}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {screenshots.length === 0 && !tradeConfig.allowScreenshotUpload && (
            <div className="text-center py-8 text-muted-foreground">
              <ImageIcon className="w-12 h-12 mx-auto mb-2" />
              <p>No screenshots available</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Render analysis editors
  const renderAnalysisEditors = () => {
    return (
      <Tabs defaultValue="analysis" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Analysis
          </TabsTrigger>
          <TabsTrigger value="strategy" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Strategy
          </TabsTrigger>
          <TabsTrigger value="lessons" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Lessons
          </TabsTrigger>
        </TabsList>

        {tradeConfig.showAnalysisEditor && (
          <TabsContent value="analysis">
            <Card>
              <CardHeader>
                <CardTitle>Trade Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Analyze this trade... What worked? What didn't? Market conditions, entry timing, exit strategy..."
                  value={journalEntry?.analysisNotes || ''}
                  onChange={(e) => handleAnalysisChange(e.target.value)}
                  className="min-h-[150px] resize-none"
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {tradeConfig.showStrategyNotes && (
          <TabsContent value="strategy">
            <Card>
              <CardHeader>
                <CardTitle>Strategy Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="How well did you execute your strategy? Any deviations from the plan? Strategy-specific observations..."
                  value={journalEntry?.strategyNotes || ''}
                  onChange={(e) => handleStrategyNotesChange(e.target.value)}
                  className="min-h-[150px] resize-none"
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="lessons">
          <Card>
            <CardHeader>
              <CardTitle>Lessons Learned</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Key takeaways from this trade... What will you do differently next time? What did you learn?"
                value={journalEntry?.lessonsLearned || ''}
                onChange={(e) => handleLessonsLearnedChange(e.target.value)}
                className="min-h-[150px] resize-none"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      {renderTradeSnapshot()}
      {renderScreenshotGallery()}
      {renderAnalysisEditors()}

      {/* Image Modal */}
      {selectedImageModal && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setSelectedImageModal(null)}
        >
          <div className="relative max-w-[95vw] max-h-[95vh]">
            <img 
              src={selectedImageModal}
              alt="Screenshot"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setSelectedImageModal(null)}
              className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-all"
              title="Close image"
              aria-label="Close image"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {uploadState.message && !uploadState.uploading && (
        <div className="fixed bottom-4 right-4 bg-background border rounded-lg p-3 shadow-lg">
          <p className="text-sm">{uploadState.message}</p>
        </div>
      )}
    </div>
  );
};

// Helper function to calculate trade duration
function calculateTradeDuration(timeIn: string, timeOut?: string): string {
  if (!timeOut) return 'Open';
  
  try {
    const start = new Date(`1970-01-01T${timeIn}:00`);
    const end = new Date(`1970-01-01T${timeOut}:00`);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins}m`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const minutes = diffMins % 60;
      return `${hours}h ${minutes}m`;
    }
  } catch {
    return 'Unknown';
  }
}

export default TradeNotePanel;