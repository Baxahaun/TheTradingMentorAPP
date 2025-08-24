/**
 * Virtualized List Component
 * Provides efficient rendering for large datasets by only rendering visible items
 * with support for variable item heights and smooth scrolling.
 */

import React, { useCallback, useRef, useEffect, useState } from 'react';
import { useVirtualization, useThrottle } from '@/lib/performanceOptimization';
import { cn } from '@/lib/utils';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
  getItemKey?: (item: T, index: number) => string | number;
}

export function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className,
  overscan = 5,
  onScroll,
  getItemKey = (_, index) => index
}: VirtualizedListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  
  // Throttle scroll updates for better performance
  const throttledScrollTop = useThrottle(scrollTop, 16); // ~60fps
  
  const {
    visibleItems,
    totalHeight,
    handleScroll: handleVirtualScroll
  } = useVirtualization(items, itemHeight, containerHeight, overscan);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    handleVirtualScroll(e);
    onScroll?.(newScrollTop);
  }, [handleVirtualScroll, onScroll]);

  return (
    <div
      ref={containerRef}
      className={cn("overflow-auto", className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index, top }) => (
          <div
            key={getItemKey(item, index)}
            style={{
              position: 'absolute',
              top,
              left: 0,
              right: 0,
              height: itemHeight
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Virtualized Chart Gallery Component
 * Optimized for displaying large numbers of chart images
 */
interface VirtualizedChartGalleryProps {
  charts: Array<{
    id: string;
    url: string;
    type: string;
    timeframe: string;
    description?: string;
  }>;
  onChartClick: (chartId: string) => void;
  containerHeight: number;
  itemsPerRow?: number;
  itemHeight?: number;
}

export const VirtualizedChartGallery: React.FC<VirtualizedChartGalleryProps> = ({
  charts,
  onChartClick,
  containerHeight,
  itemsPerRow = 3,
  itemHeight = 200
}) => {
  // Group charts into rows
  const chartRows = [];
  for (let i = 0; i < charts.length; i += itemsPerRow) {
    chartRows.push(charts.slice(i, i + itemsPerRow));
  }

  const renderRow = useCallback((row: typeof charts, rowIndex: number) => (
    <div className="flex gap-4 px-4">
      {row.map((chart) => (
        <div
          key={chart.id}
          className="flex-1 bg-card rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onChartClick(chart.id)}
        >
          <div className="aspect-video bg-muted relative">
            <img
              src={chart.url}
              alt={chart.description || `${chart.type} chart`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute top-2 left-2">
              <span className="bg-background/80 text-xs px-2 py-1 rounded">
                {chart.type}
              </span>
            </div>
            <div className="absolute top-2 right-2">
              <span className="bg-background/80 text-xs px-2 py-1 rounded">
                {chart.timeframe}
              </span>
            </div>
          </div>
          {chart.description && (
            <div className="p-2">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {chart.description}
              </p>
            </div>
          )}
        </div>
      ))}
      {/* Fill empty slots in the last row */}
      {row.length < itemsPerRow && (
        <>
          {Array.from({ length: itemsPerRow - row.length }).map((_, index) => (
            <div key={`empty-${index}`} className="flex-1" />
          ))}
        </>
      )}
    </div>
  ), [onChartClick, itemsPerRow]);

  if (chartRows.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>No charts to display</p>
      </div>
    );
  }

  return (
    <VirtualizedList
      items={chartRows}
      itemHeight={itemHeight}
      containerHeight={containerHeight}
      renderItem={renderRow}
      getItemKey={(_, index) => `row-${index}`}
      className="w-full"
    />
  );
};

/**
 * Virtualized Trade List Component
 * Optimized for displaying large numbers of trades
 */
interface VirtualizedTradeListProps {
  trades: Array<{
    id: string;
    currencyPair: string;
    side: 'long' | 'short';
    pnl?: number;
    date: string;
    status: string;
  }>;
  onTradeClick: (tradeId: string) => void;
  containerHeight: number;
  itemHeight?: number;
}

export const VirtualizedTradeList: React.FC<VirtualizedTradeListProps> = ({
  trades,
  onTradeClick,
  containerHeight,
  itemHeight = 60
}) => {
  const renderTrade = useCallback((trade: typeof trades[0], index: number) => (
    <div
      className="flex items-center justify-between p-4 border-b hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={() => onTradeClick(trade.id)}
    >
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className="font-medium">{trade.currencyPair}</span>
          <span className="text-sm text-muted-foreground">{trade.date}</span>
        </div>
        <span className={cn(
          "px-2 py-1 rounded text-xs font-medium",
          trade.side === 'long' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        )}>
          {trade.side.toUpperCase()}
        </span>
      </div>
      <div className="flex items-center gap-3">
        {trade.pnl !== undefined && (
          <span className={cn(
            "font-medium",
            trade.pnl >= 0 ? "text-green-600" : "text-red-600"
          )}>
            {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
          </span>
        )}
        <span className={cn(
          "px-2 py-1 rounded text-xs",
          trade.status === 'closed' ? "bg-gray-100 text-gray-800" : "bg-blue-100 text-blue-800"
        )}>
          {trade.status}
        </span>
      </div>
    </div>
  ), [onTradeClick]);

  if (trades.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>No trades to display</p>
      </div>
    );
  }

  return (
    <VirtualizedList
      items={trades}
      itemHeight={itemHeight}
      containerHeight={containerHeight}
      renderItem={renderTrade}
      getItemKey={(trade) => trade.id}
      className="w-full border rounded-lg"
    />
  );
};