import React, { useMemo, useCallback } from 'react';
import { VirtualizedList, VirtualizedGrid, VirtualizedListItem } from '../common/VirtualizedList';
import { Trade, TradeSetup, TradePattern, PartialClose, PositionEvent } from '../../types/trade';

// Setup list item interface
interface SetupListItem extends VirtualizedListItem {
  data: TradeSetup & { tradeCount: number; performance: any };
}

// Pattern list item interface
interface PatternListItem extends VirtualizedListItem {
  data: TradePattern & { tradeCount: number; performance: any };
}

// Position event list item interface
interface PositionEventListItem extends VirtualizedListItem {
  data: PositionEvent;
}

// Trade list item interface
interface TradeListItem extends VirtualizedListItem {
  data: Trade;
}

// Virtualized Setup List
interface VirtualizedSetupListProps {
  setups: SetupListItem[];
  containerHeight: number;
  onSetupClick?: (setup: SetupListItem) => void;
  onSetupSelect?: (setupIds: string[]) => void;
  selectedSetupIds?: string[];
  className?: string;
}

export const VirtualizedSetupList: React.FC<VirtualizedSetupListProps> = ({
  setups,
  containerHeight,
  onSetupClick,
  onSetupSelect,
  selectedSetupIds = [],
  className = '',
}) => {
  const handleSetupClick = useCallback((setup: SetupListItem) => {
    onSetupClick?.(setup);
  }, [onSetupClick]);

  const handleSetupSelect = useCallback((setupId: string, selected: boolean) => {
    if (!onSetupSelect) return;
    
    const newSelection = selected
      ? [...selectedSetupIds, setupId]
      : selectedSetupIds.filter(id => id !== setupId);
    
    onSetupSelect(newSelection);
  }, [onSetupSelect, selectedSetupIds]);

  const renderSetupItem = useCallback((
    item: SetupListItem,
    index: number,
    style: React.CSSProperties
  ) => {
    const isSelected = selectedSetupIds.includes(item.id);
    
    return (
      <div
        style={style}
        className={`p-3 border-b border-gray-200 hover:bg-gray-50 cursor-pointer ${
          isSelected ? 'bg-blue-50 border-blue-200' : ''
        }`}
        onClick={() => handleSetupClick(item)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => handleSetupSelect(item.id, e.target.checked)}
              onClick={(e) => e.stopPropagation()}
              className="rounded border-gray-300"
            />
            <div>
              <h4 className="font-medium text-gray-900">{item.data.type}</h4>
              <p className="text-sm text-gray-600">
                {item.data.tradeCount} trades • Quality: {item.data.quality}/5
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">
              {item.data.performance?.winRate?.toFixed(1)}% Win Rate
            </div>
            <div className="text-sm text-gray-600">
              R: {item.data.performance?.averageRMultiple?.toFixed(2)}
            </div>
          </div>
        </div>
        {item.data.confluence && item.data.confluence.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {item.data.confluence.slice(0, 3).map((factor, idx) => (
              <span
                key={idx}
                className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
              >
                {factor.name}
              </span>
            ))}
            {item.data.confluence.length > 3 && (
              <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                +{item.data.confluence.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    );
  }, [selectedSetupIds, handleSetupClick, handleSetupSelect]);

  return (
    <div className={className}>
      <VirtualizedList
        items={setups}
        itemHeight={100}
        containerHeight={containerHeight}
        renderItem={renderSetupItem}
        overscan={5}
      />
    </div>
  );
};

// Virtualized Pattern List
interface VirtualizedPatternListProps {
  patterns: PatternListItem[];
  containerHeight: number;
  onPatternClick?: (pattern: PatternListItem) => void;
  onPatternSelect?: (patternIds: string[]) => void;
  selectedPatternIds?: string[];
  className?: string;
}

export const VirtualizedPatternList: React.FC<VirtualizedPatternListProps> = ({
  patterns,
  containerHeight,
  onPatternClick,
  onPatternSelect,
  selectedPatternIds = [],
  className = '',
}) => {
  const handlePatternClick = useCallback((pattern: PatternListItem) => {
    onPatternClick?.(pattern);
  }, [onPatternClick]);

  const handlePatternSelect = useCallback((patternId: string, selected: boolean) => {
    if (!onPatternSelect) return;
    
    const newSelection = selected
      ? [...selectedPatternIds, patternId]
      : selectedPatternIds.filter(id => id !== patternId);
    
    onPatternSelect(newSelection);
  }, [onPatternSelect, selectedPatternIds]);

  const renderPatternItem = useCallback((
    item: PatternListItem,
    index: number,
    style: React.CSSProperties
  ) => {
    const isSelected = selectedPatternIds.includes(item.id);
    
    return (
      <div
        style={style}
        className={`p-3 border-b border-gray-200 hover:bg-gray-50 cursor-pointer ${
          isSelected ? 'bg-blue-50 border-blue-200' : ''
        }`}
        onClick={() => handlePatternClick(item)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => handlePatternSelect(item.id, e.target.checked)}
              onClick={(e) => e.stopPropagation()}
              className="rounded border-gray-300"
            />
            <div>
              <h4 className="font-medium text-gray-900">{item.data.type}</h4>
              <p className="text-sm text-gray-600">
                {item.data.timeframe} • {item.data.tradeCount} trades • Quality: {item.data.quality}/5
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">
              {item.data.performance?.successRate?.toFixed(1)}% Success
            </div>
            <div className="text-sm text-gray-600">
              PF: {item.data.performance?.profitFactor?.toFixed(2)}
            </div>
          </div>
        </div>
        {item.data.confluence && (
          <div className="mt-2">
            <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
              Confluence Pattern
            </span>
          </div>
        )}
        {item.data.description && (
          <p className="mt-2 text-sm text-gray-600 truncate">
            {item.data.description}
          </p>
        )}
      </div>
    );
  }, [selectedPatternIds, handlePatternClick, handlePatternSelect]);

  return (
    <div className={className}>
      <VirtualizedList
        items={patterns}
        itemHeight={120}
        containerHeight={containerHeight}
        renderItem={renderPatternItem}
        overscan={5}
      />
    </div>
  );
};

// Virtualized Position Events List
interface VirtualizedPositionEventsProps {
  events: PositionEventListItem[];
  containerHeight: number;
  onEventClick?: (event: PositionEventListItem) => void;
  className?: string;
}

export const VirtualizedPositionEvents: React.FC<VirtualizedPositionEventsProps> = ({
  events,
  containerHeight,
  onEventClick,
  className = '',
}) => {
  const handleEventClick = useCallback((event: PositionEventListItem) => {
    onEventClick?.(event);
  }, [onEventClick]);

  const renderEventItem = useCallback((
    item: PositionEventListItem,
    index: number,
    style: React.CSSProperties
  ) => {
    const event = item.data;
    const isEntry = event.type === 'entry';
    const isExit = event.type === 'partial_close' || event.type === 'full_close';
    
    return (
      <div
        style={style}
        className="p-3 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
        onClick={() => handleEventClick(item)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              isEntry ? 'bg-green-500' : isExit ? 'bg-red-500' : 'bg-blue-500'
            }`} />
            <div>
              <h4 className="font-medium text-gray-900 capitalize">
                {event.type.replace('_', ' ')}
              </h4>
              <p className="text-sm text-gray-600">
                {new Date(event.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">
              {Math.abs(event.lotSize).toFixed(2)} lots
            </div>
            <div className="text-sm text-gray-600">
              @ {event.price.toFixed(5)}
            </div>
          </div>
        </div>
        <div className="mt-2 flex justify-between text-sm text-gray-600">
          <span>Position: {event.totalPosition.toFixed(2)} lots</span>
          <span>Avg Price: {event.averagePrice.toFixed(5)}</span>
        </div>
      </div>
    );
  }, [handleEventClick]);

  return (
    <div className={className}>
      <VirtualizedList
        items={events}
        itemHeight={90}
        containerHeight={containerHeight}
        renderItem={renderEventItem}
        overscan={3}
      />
    </div>
  );
};

// Virtualized Trade Grid
interface VirtualizedTradeGridProps {
  trades: TradeListItem[];
  containerWidth: number;
  containerHeight: number;
  onTradeClick?: (trade: TradeListItem) => void;
  onTradeSelect?: (tradeIds: string[]) => void;
  selectedTradeIds?: string[];
  className?: string;
}

export const VirtualizedTradeGrid: React.FC<VirtualizedTradeGridProps> = ({
  trades,
  containerWidth,
  containerHeight,
  onTradeClick,
  onTradeSelect,
  selectedTradeIds = [],
  className = '',
}) => {
  const handleTradeClick = useCallback((trade: TradeListItem) => {
    onTradeClick?.(trade);
  }, [onTradeClick]);

  const handleTradeSelect = useCallback((tradeId: string, selected: boolean) => {
    if (!onTradeSelect) return;
    
    const newSelection = selected
      ? [...selectedTradeIds, tradeId]
      : selectedTradeIds.filter(id => id !== tradeId);
    
    onTradeSelect(newSelection);
  }, [onTradeSelect, selectedTradeIds]);

  const renderTradeItem = useCallback((
    item: TradeListItem,
    index: number,
    style: React.CSSProperties
  ) => {
    const trade = item.data;
    const isSelected = selectedTradeIds.includes(item.id);
    const isProfit = (trade.pnl || 0) > 0;
    
    return (
      <div
        style={style}
        className={`p-3 border border-gray-200 rounded-lg hover:shadow-md cursor-pointer transition-shadow ${
          isSelected ? 'ring-2 ring-blue-500' : ''
        }`}
        onClick={() => handleTradeClick(item)}
      >
        <div className="flex items-center justify-between mb-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => handleTradeSelect(item.id, e.target.checked)}
            onClick={(e) => e.stopPropagation()}
            className="rounded border-gray-300"
          />
          <span className={`text-sm font-medium ${
            isProfit ? 'text-green-600' : 'text-red-600'
          }`}>
            {isProfit ? '+' : ''}{trade.pnl?.toFixed(2) || '0.00'}
          </span>
        </div>
        
        <h4 className="font-medium text-gray-900 mb-1">{trade.symbol}</h4>
        <p className="text-sm text-gray-600 mb-2">
          {trade.side} • {trade.lotSize} lots
        </p>
        
        <div className="text-xs text-gray-500">
          <div>{trade.date}</div>
          <div className="mt-1">
            {trade.setup?.type && (
              <span className="inline-block px-1 py-0.5 bg-blue-100 text-blue-700 rounded mr-1">
                {trade.setup.type}
              </span>
            )}
            {trade.patterns && trade.patterns.length > 0 && (
              <span className="inline-block px-1 py-0.5 bg-green-100 text-green-700 rounded">
                {trade.patterns.length} pattern{trade.patterns.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }, [selectedTradeIds, handleTradeClick, handleTradeSelect]);

  const itemWidth = 280;
  const itemHeight = 140;

  return (
    <div className={className}>
      <VirtualizedGrid
        items={trades}
        itemWidth={itemWidth}
        itemHeight={itemHeight}
        containerWidth={containerWidth}
        containerHeight={containerHeight}
        renderItem={renderTradeItem}
        overscan={5}
        gap={16}
      />
    </div>
  );
};