import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

// Virtualized list item interface
export interface VirtualizedListItem {
  id: string;
  height?: number;
  data: any;
}

// Virtualized list props
interface VirtualizedListProps<T extends VirtualizedListItem> {
  items: T[];
  itemHeight: number | ((item: T, index: number) => number);
  containerHeight: number;
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
  scrollToIndex?: number;
  scrollToAlignment?: 'start' | 'center' | 'end' | 'auto';
}

// Calculate item positions and sizes
const useVirtualization = <T extends VirtualizedListItem>(
  items: T[],
  itemHeight: number | ((item: T, index: number) => number),
  containerHeight: number,
  overscan: number = 5
) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  // Calculate item positions
  const itemPositions = useMemo(() => {
    const positions: { top: number; height: number }[] = [];
    let currentTop = 0;
    
    items.forEach((item, index) => {
      const height = typeof itemHeight === 'function' 
        ? itemHeight(item, index) 
        : itemHeight;
      
      positions.push({
        top: currentTop,
        height,
      });
      
      currentTop += height;
    });
    
    return positions;
  }, [items, itemHeight]);

  // Calculate total height
  const totalHeight = useMemo(() => {
    return itemPositions.length > 0 
      ? itemPositions[itemPositions.length - 1].top + itemPositions[itemPositions.length - 1].height
      : 0;
  }, [itemPositions]);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    if (itemPositions.length === 0) {
      return { start: 0, end: 0 };
    }

    // Find first visible item
    let start = 0;
    for (let i = 0; i < itemPositions.length; i++) {
      if (itemPositions[i].top + itemPositions[i].height > scrollTop) {
        start = Math.max(0, i - overscan);
        break;
      }
    }

    // Find last visible item
    let end = itemPositions.length - 1;
    const visibleBottom = scrollTop + containerHeight;
    for (let i = start; i < itemPositions.length; i++) {
      if (itemPositions[i].top > visibleBottom) {
        end = Math.min(itemPositions.length - 1, i + overscan);
        break;
      }
    }

    return { start, end };
  }, [itemPositions, scrollTop, containerHeight, overscan]);

  // Get visible items with their styles
  const visibleItems = useMemo(() => {
    const result: Array<{
      item: T;
      index: number;
      style: React.CSSProperties;
    }> = [];

    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      if (i < items.length && i < itemPositions.length) {
        const position = itemPositions[i];
        result.push({
          item: items[i],
          index: i,
          style: {
            position: 'absolute',
            top: position.top,
            left: 0,
            right: 0,
            height: position.height,
          },
        });
      }
    }

    return result;
  }, [items, itemPositions, visibleRange]);

  return {
    scrollTop,
    setScrollTop,
    totalHeight,
    visibleItems,
    visibleRange,
  };
};

// Virtualized List Component
export const VirtualizedList = <T extends VirtualizedListItem>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = '',
  onScroll,
  scrollToIndex,
  scrollToAlignment = 'start',
}: VirtualizedListProps<T>) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    scrollTop,
    setScrollTop,
    totalHeight,
    visibleItems,
  } = useVirtualization(items, itemHeight, containerHeight, overscan);

  // Handle scroll events
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = event.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  }, [setScrollTop, onScroll]);

  // Scroll to specific index
  useEffect(() => {
    if (scrollToIndex !== undefined && containerRef.current) {
      const container = containerRef.current;
      const itemPositions: { top: number; height: number }[] = [];
      let currentTop = 0;
      
      // Recalculate positions for scroll target
      for (let i = 0; i <= scrollToIndex && i < items.length; i++) {
        const height = typeof itemHeight === 'function' 
          ? itemHeight(items[i], i) 
          : itemHeight;
        
        itemPositions.push({
          top: currentTop,
          height,
        });
        
        currentTop += height;
      }

      if (itemPositions[scrollToIndex]) {
        const targetPosition = itemPositions[scrollToIndex];
        let scrollTo = targetPosition.top;

        // Adjust scroll position based on alignment
        switch (scrollToAlignment) {
          case 'center':
            scrollTo = targetPosition.top - (containerHeight - targetPosition.height) / 2;
            break;
          case 'end':
            scrollTo = targetPosition.top - containerHeight + targetPosition.height;
            break;
          case 'auto':
            if (targetPosition.top < scrollTop) {
              scrollTo = targetPosition.top;
            } else if (targetPosition.top + targetPosition.height > scrollTop + containerHeight) {
              scrollTo = targetPosition.top - containerHeight + targetPosition.height;
            } else {
              return; // Already visible
            }
            break;
        }

        container.scrollTop = Math.max(0, Math.min(scrollTo, totalHeight - containerHeight));
      }
    }
  }, [scrollToIndex, scrollToAlignment, items, itemHeight, containerHeight, totalHeight, scrollTop]);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index, style }) => (
          <div key={item.id} style={style}>
            {renderItem(item, index, style)}
          </div>
        ))}
      </div>
    </div>
  );
};

// Virtualized Grid Component
interface VirtualizedGridProps<T extends VirtualizedListItem> {
  items: T[];
  itemWidth: number;
  itemHeight: number;
  containerWidth: number;
  containerHeight: number;
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  overscan?: number;
  className?: string;
  gap?: number;
}

export const VirtualizedGrid = <T extends VirtualizedListItem>({
  items,
  itemWidth,
  itemHeight,
  containerWidth,
  containerHeight,
  renderItem,
  overscan = 5,
  className = '',
  gap = 0,
}: VirtualizedGridProps<T>) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate grid dimensions
  const columnsPerRow = Math.floor((containerWidth + gap) / (itemWidth + gap));
  const totalRows = Math.ceil(items.length / columnsPerRow);
  const totalHeight = totalRows * (itemHeight + gap) - gap;

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startRow = Math.max(0, Math.floor(scrollTop / (itemHeight + gap)) - overscan);
    const endRow = Math.min(
      totalRows - 1,
      Math.ceil((scrollTop + containerHeight) / (itemHeight + gap)) + overscan
    );

    return {
      startRow,
      endRow,
      startIndex: startRow * columnsPerRow,
      endIndex: Math.min(items.length - 1, (endRow + 1) * columnsPerRow - 1),
    };
  }, [scrollTop, containerHeight, itemHeight, gap, totalRows, columnsPerRow, items.length, overscan]);

  // Get visible items
  const visibleItems = useMemo(() => {
    const result: Array<{
      item: T;
      index: number;
      style: React.CSSProperties;
    }> = [];

    for (let i = visibleRange.startIndex; i <= visibleRange.endIndex; i++) {
      if (i < items.length) {
        const row = Math.floor(i / columnsPerRow);
        const col = i % columnsPerRow;
        
        result.push({
          item: items[i],
          index: i,
          style: {
            position: 'absolute',
            top: row * (itemHeight + gap),
            left: col * (itemWidth + gap),
            width: itemWidth,
            height: itemHeight,
          },
        });
      }
    }

    return result;
  }, [items, visibleRange, columnsPerRow, itemWidth, itemHeight, gap]);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index, style }) => (
          <div key={item.id} style={style}>
            {renderItem(item, index, style)}
          </div>
        ))}
      </div>
    </div>
  );
};