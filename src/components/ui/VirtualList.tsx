/**
 * VirtualList - High-performance virtualized list component for large datasets
 * Renders only visible items to maintain performance with thousands of items
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { calculateVirtualListItems, VirtualListConfig } from '../../utils/performanceUtils';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
  getItemKey?: (item: T, index: number) => string | number;
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = '',
  onScroll,
  getItemKey = (_, index) => index
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate virtual list parameters
  const virtualConfig: VirtualListConfig = useMemo(() => ({
    itemHeight,
    containerHeight,
    overscan
  }), [itemHeight, containerHeight, overscan]);

  const virtualItems = useMemo(() => {
    return calculateVirtualListItems(scrollTop, items.length, virtualConfig);
  }, [scrollTop, items.length, virtualConfig]);

  // Handle scroll events
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = event.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  }, [onScroll]);

  // Scroll to specific item
  const scrollToItem = useCallback((index: number) => {
    if (containerRef.current) {
      const scrollTop = index * itemHeight;
      containerRef.current.scrollTop = scrollTop;
      setScrollTop(scrollTop);
    }
  }, [itemHeight]);

  // Render visible items
  const visibleItems = useMemo(() => {
    const result: React.ReactNode[] = [];
    
    for (let i = virtualItems.start; i <= virtualItems.end; i++) {
      if (i < items.length) {
        const item = items[i];
        const key = getItemKey(item, i);
        
        result.push(
          <div
            key={key}
            style={{
              position: 'absolute',
              top: i * itemHeight,
              left: 0,
              right: 0,
              height: itemHeight
            }}
          >
            {renderItem(item, i)}
          </div>
        );
      }
    }
    
    return result;
  }, [items, virtualItems, itemHeight, renderItem, getItemKey]);

  return (
    <div
      ref={containerRef}
      className={`virtual-list-container ${className}`}
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative'
      }}
      onScroll={handleScroll}
    >
      {/* Total height spacer */}
      <div
        style={{
          height: virtualItems.totalHeight,
          position: 'relative'
        }}
      >
        {/* Visible items */}
        {visibleItems}
      </div>
    </div>
  );
}

// Hook for managing virtual list state
export function useVirtualList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const virtualItems = useMemo(() => {
    return calculateVirtualListItems(scrollTop, items.length, {
      itemHeight,
      containerHeight,
      overscan: 5
    });
  }, [scrollTop, items.length, itemHeight, containerHeight]);

  const scrollToIndex = useCallback((index: number) => {
    const newScrollTop = index * itemHeight;
    setScrollTop(newScrollTop);
  }, [itemHeight]);

  const selectItem = useCallback((index: number) => {
    setSelectedIndex(index);
    
    // Auto-scroll to selected item if not visible
    const { visibleStart, visibleEnd } = virtualItems;
    if (index < visibleStart || index > visibleEnd) {
      scrollToIndex(index);
    }
  }, [virtualItems, scrollToIndex]);

  return {
    scrollTop,
    setScrollTop,
    selectedIndex,
    selectItem,
    scrollToIndex,
    virtualItems,
    isItemVisible: (index: number) => 
      index >= virtualItems.visibleStart && index <= virtualItems.visibleEnd
  };
}

// Memoized item renderer to prevent unnecessary re-renders
export const MemoizedVirtualListItem = React.memo(function VirtualListItem<T>({
  item,
  index,
  style,
  children
}: {
  item: T;
  index: number;
  style: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <div style={style}>
      {children}
    </div>
  );
});

export default VirtualList;