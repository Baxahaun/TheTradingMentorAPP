import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from '../../ui/card';
import {
  ContentAreaConfig,
  TradeNoteConfig,
  DailyJournalConfig,
  ContentTransitionType,
  DEFAULT_CONTENT_CONFIGS,
  DEFAULT_TRADE_NOTE_CONFIG,
  DEFAULT_DAILY_JOURNAL_CONFIG
} from '../../../types/dailyJournal';
import { JournalEntry } from '../../../types/journal';
import { Trade } from '../../../types/trade';
import { cn } from '../../../lib/utils';

interface DynamicContentAreaProps {
  entryType: 'trade-note' | 'daily-journal' | 'empty';
  selectedDate: Date;
  linkedTradeId?: string;
  linkedTrade?: Trade;
  journalEntry?: JournalEntry;
  onContentChange: (content: any) => void;
  onEntryTypeChange?: (type: 'trade-note' | 'daily-journal') => void;
  className?: string;
  transitionType?: ContentTransitionType;
  maxHeight?: number;
  config?: Partial<ContentAreaConfig>;
  tradeNoteConfig?: Partial<TradeNoteConfig>;
  dailyJournalConfig?: Partial<DailyJournalConfig>;
}

/**
 * DynamicContentArea Component
 * 
 * Renders different layouts based on entry type with smooth transitions under 200ms.
 * Adapts between trade notes and daily journal modes with specialized interfaces.
 */
export const DynamicContentArea: React.FC<DynamicContentAreaProps> = ({
  entryType,
  selectedDate,
  linkedTradeId,
  linkedTrade,
  journalEntry,
  onContentChange,
  onEntryTypeChange,
  className,
  transitionType = 'slide',
  maxHeight,
  config,
  tradeNoteConfig,
  dailyJournalConfig
}) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [previousEntryType, setPreviousEntryType] = useState<string>(entryType);

  // Merge configurations with defaults
  const contentConfig = useMemo((): ContentAreaConfig => {
    const baseConfig = entryType === 'trade-note' 
      ? DEFAULT_CONTENT_CONFIGS.tradeNote
      : entryType === 'daily-journal'
        ? DEFAULT_CONTENT_CONFIGS.dailyJournal
        : DEFAULT_CONTENT_CONFIGS.empty;

    return {
      ...baseConfig,
      ...config,
      maxHeight
    };
  }, [entryType, config, maxHeight]);

  const tradeConfig = useMemo((): TradeNoteConfig => ({
    ...DEFAULT_TRADE_NOTE_CONFIG,
    ...tradeNoteConfig
  }), [tradeNoteConfig]);

  const journalConfig = useMemo((): DailyJournalConfig => ({
    ...DEFAULT_DAILY_JOURNAL_CONFIG,
    ...dailyJournalConfig
  }), [dailyJournalConfig]);

  // Handle entry type transitions
  useEffect(() => {
    if (entryType !== previousEntryType) {
      setIsTransitioning(true);
      
      // Complete transition within 200ms as specified
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setPreviousEntryType(entryType);
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [entryType, previousEntryType]);

  // Animation variants based on transition type
  const getAnimationVariants = () => {
    switch (transitionType) {
      case 'slide':
        return {
          initial: { x: 100, opacity: 0 },
          animate: { x: 0, opacity: 1 },
          exit: { x: -100, opacity: 0 }
        };
      case 'fade':
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 }
        };
      case 'scale':
        return {
          initial: { scale: 0.8, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 0.8, opacity: 0 }
        };
      case 'none':
      default:
        return {
          initial: {},
          animate: {},
          exit: {}
        };
    }
  };

  const animationVariants = getAnimationVariants();

  // Layout calculation based on entry type
  const getLayoutClasses = () => {
    if (contentConfig.layout === 'split') {
      return 'grid grid-cols-1 lg:grid-cols-2 gap-6';
    } else if (contentConfig.layout === 'compact') {
      return 'space-y-4';
    }
    return 'space-y-6'; // full layout
  };

  // Render trade note content
  const renderTradeNoteContent = () => {
    if (!contentConfig.showTradeData && !contentConfig.showScreenshots) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Trade note configuration disabled</p>
        </div>
      );
    }

    return (
      <div className={getLayoutClasses()}>
        {/* Trade Data Panel */}
        {contentConfig.showTradeData && tradeConfig.showTradeSnapshot && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Trade Information</h3>
              {linkedTrade ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">Symbol</span>
                      <p className="font-medium">{linkedTrade.currencyPair}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Direction</span>
                      <p className="font-medium capitalize">{linkedTrade.side}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">P&L</span>
                      <p className={`font-medium ${(linkedTrade.pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${(linkedTrade.pnl || 0).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Status</span>
                      <p className="font-medium capitalize">{linkedTrade.status}</p>
                    </div>
                  </div>
                  {linkedTrade.strategy && (
                    <div>
                      <span className="text-sm text-muted-foreground">Strategy</span>
                      <p className="font-medium">{linkedTrade.strategy}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No trade data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Analysis Notes Panel */}
        {tradeConfig.showAnalysisEditor && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Trade Analysis</h3>
              <textarea
                className="w-full min-h-[200px] p-3 border border-border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Analyze this trade... What went well? What could be improved?"
                value={journalEntry?.sections?.[0]?.content || ''}
                onChange={(e) => onContentChange({ content: e.target.value })}
              />
            </CardContent>
          </Card>
        )}

        {/* Screenshot Gallery Placeholder */}
        {contentConfig.showScreenshots && tradeConfig.showScreenshotGallery && (
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Screenshots</h3>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <p className="text-muted-foreground">Screenshot gallery will be implemented in TradeNotePanel</p>
                <p className="text-sm text-muted-foreground mt-2">Drag and drop images or click to upload</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Render daily journal content
  const renderDailyJournalContent = () => {
    return (
      <div className="space-y-6">
        {/* Daily Metrics */}
        {contentConfig.showMetrics && journalConfig.showDailyMetrics && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Daily Performance</h3>
              <div className="text-center py-8">
                <p className="text-muted-foreground">Daily metrics will be implemented in DailyMetricsService</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Template Selector */}
        {contentConfig.showTemplates && journalConfig.showTemplateSelector && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Journal Template</h3>
              <div className="text-center py-4">
                <p className="text-muted-foreground">Template selection will be implemented in TemplateSelector</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Journal Content */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Daily Journal Entry</h3>
            <textarea
              className={cn(
                "w-full p-4 border border-border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring",
                journalConfig.useFullHeight ? "min-h-[400px]" : "min-h-[200px]"
              )}
              placeholder={`Reflect on ${selectedDate.toLocaleDateString()}... How did the trading session go? What did you learn?`}
              value={journalEntry?.sections?.[0]?.content || ''}
              onChange={(e) => onContentChange({ content: e.target.value })}
            />
          </CardContent>
        </Card>

        {/* News Events */}
        {journalConfig.showNewsEvents && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Market Events</h3>
              <div className="text-center py-8">
                <p className="text-muted-foreground">News events panel will be implemented in NewsEventsPanel</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Render empty state
  const renderEmptyContent = () => (
    <Card>
      <CardContent className="p-12 text-center">
        <h3 className="text-lg font-semibold mb-4">Select Entry Type</h3>
        <p className="text-muted-foreground mb-6">Choose how you'd like to journal for {selectedDate.toLocaleDateString()}</p>
        
        <div className="flex justify-center gap-4">
          <button
            onClick={() => onEntryTypeChange?.('daily-journal')}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Daily Journal
          </button>
          <button
            onClick={() => onEntryTypeChange?.('trade-note')}
            className="px-6 py-3 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
            disabled={!linkedTradeId}
          >
            Trade Note
            {!linkedTradeId && <span className="ml-2 text-xs">(No trade selected)</span>}
          </button>
        </div>
      </CardContent>
    </Card>
  );

  // Main render function
  const renderContent = () => {
    switch (entryType) {
      case 'trade-note':
        return renderTradeNoteContent();
      case 'daily-journal':
        return renderDailyJournalContent();
      case 'empty':
      default:
        return renderEmptyContent();
    }
  };

  return (
    <div
      className={cn("relative", className)}
      style={{ maxHeight: contentConfig.maxHeight ? `${contentConfig.maxHeight}px` : undefined }}
    >
      <div
        key={entryType}
        className={cn(
          "w-full transition-all duration-150 ease-in-out",
          isTransitioning && "pointer-events-none opacity-75 scale-95",
          transitionType === 'slide' && isTransitioning && "transform translate-x-2",
          transitionType === 'fade' && isTransitioning && "opacity-0",
          transitionType === 'scale' && isTransitioning && "scale-90"
        )}
      >
        {renderContent()}
      </div>

      {/* Transition overlay */}
      {isTransitioning && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm transition-opacity duration-150" />
      )}
    </div>
  );
};

export default DynamicContentArea;