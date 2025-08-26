/**
 * Performance tests for VirtualList component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import VirtualList, { useVirtualList } from '../../components/ui/VirtualList';
import { performanceMonitor } from '../../services/PerformanceMonitoringService';

// Mock data generator
function generateMockItems(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `item-${index}`,
    title: `Item ${index}`,
    description: `Description for item ${index}`,
    value: Math.random() * 1000
  }));
}

// Test component that uses VirtualList
function TestVirtualList({ itemCount }: { itemCount: number }) {
  const items = generateMockItems(itemCount);
  
  const renderItem = (item: any, index: number) => (
    <div key={item.id} className="test-item">
      <h3>{item.title}</h3>
      <p>{item.description}</p>
      <span>{item.value.toFixed(2)}</span>
    </div>
  );

  return (
    <VirtualList
      items={items}
      itemHeight={80}
      containerHeight={400}
      renderItem={renderItem}
      getItemKey={(item) => item.id}
    />
  );
}

describe('VirtualList Performance Tests', () => {
  beforeEach(() => {
    // Mock performance.now for consistent testing
    jest.spyOn(performance, 'now').mockImplementation(() => Date.now());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering Performance', () => {
    test('should render large lists efficiently', () => {
      const startTime = performance.now();
      
      render(<TestVirtualList itemCount={10000} />);
      
      const renderTime = performance.now() - startTime;
      
      // Should render within reasonable time even with 10k items
      expect(renderTime).toBeLessThan(100); // 100ms threshold
      
      // Should only render visible items (not all 10k)
      const renderedItems = screen.getAllByText(/Item \d+/);
      expect(renderedItems.length).toBeLessThan(20); // Only visible items
      
      console.log(`VirtualList render time for 10k items: ${renderTime.toFixed(2)}ms`);
    });

    test('should handle scrolling performance', () => {
      const { container } = render(<TestVirtualList itemCount={5000} />);
      const virtualContainer = container.querySelector('.virtual-list-container');
      
      expect(virtualContainer).toBeInTheDocument();
      
      const scrollTimes: number[] = [];
      
      // Simulate multiple scroll events
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        
        fireEvent.scroll(virtualContainer!, { target: { scrollTop: i * 100 } });
        
        const scrollTime = performance.now() - startTime;
        scrollTimes.push(scrollTime);
      }
      
      const avgScrollTime = scrollTimes.reduce((sum, time) => sum + time, 0) / scrollTimes.length;
      
      // Each scroll should be fast
      expect(avgScrollTime).toBeLessThan(16); // 60fps = 16ms per frame
      
      console.log(`Average scroll time: ${avgScrollTime.toFixed(2)}ms`);
    });
  });

  describe('Memory Usage', () => {
    test('should not create excessive DOM nodes', () => {
      const { container } = render(<TestVirtualList itemCount={50000} />);
      
      // Count actual DOM nodes created
      const itemNodes = container.querySelectorAll('.test-item');
      
      // Should only create nodes for visible items, not all 50k
      expect(itemNodes.length).toBeLessThan(50);
      expect(itemNodes.length).toBeGreaterThan(0);
      
      console.log(`DOM nodes created for 50k items: ${itemNodes.length}`);
    });

    test('should clean up properly when unmounted', () => {
      const { unmount } = render(<TestVirtualList itemCount={1000} />);
      
      const initialMemory = process.memoryUsage().heapUsed;
      
      unmount();
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryDiff = finalMemory - initialMemory;
      
      // Memory should not increase significantly after unmount
      expect(Math.abs(memoryDiff)).toBeLessThan(10 * 1024 * 1024); // Less than 10MB
    });
  });

  describe('Hook Performance', () => {
    test('useVirtualList hook should be efficient', () => {
      let hookResult: any;
      
      function TestHookComponent() {
        const items = generateMockItems(10000);
        hookResult = useVirtualList(items, 50, 400);
        
        return <div>Test</div>;
      }
      
      const startTime = performance.now();
      render(<TestHookComponent />);
      const hookTime = performance.now() - startTime;
      
      expect(hookTime).toBeLessThan(50); // Hook should be fast
      expect(hookResult.virtualItems).toBeDefined();
      
      console.log(`useVirtualList hook time: ${hookTime.toFixed(2)}ms`);
    });
  });

  describe('Scroll Performance Benchmarks', () => {
    test('should maintain 60fps during rapid scrolling', () => {
      const { container } = render(<TestVirtualList itemCount={20000} />);
      const virtualContainer = container.querySelector('.virtual-list-container');
      
      const frameTimes: number[] = [];
      let lastFrameTime = performance.now();
      
      // Simulate rapid scrolling
      for (let i = 0; i < 100; i++) {
        const frameStart = performance.now();
        
        fireEvent.scroll(virtualContainer!, { 
          target: { scrollTop: i * 50 } 
        });
        
        const frameTime = performance.now() - frameStart;
        frameTimes.push(frameTime);
        
        // Simulate frame timing
        const timeSinceLastFrame = frameStart - lastFrameTime;
        if (timeSinceLastFrame < 16.67) { // 60fps
          // Frame completed within budget
        }
        lastFrameTime = frameStart;
      }
      
      const avgFrameTime = frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length;
      const maxFrameTime = Math.max(...frameTimes);
      
      // Should maintain good performance
      expect(avgFrameTime).toBeLessThan(8); // Well under 16ms budget
      expect(maxFrameTime).toBeLessThan(16); // No frame should exceed budget
      
      console.log(`Scroll performance:
        - Average frame time: ${avgFrameTime.toFixed(2)}ms
        - Max frame time: ${maxFrameTime.toFixed(2)}ms
        - Frames under budget: ${frameTimes.filter(t => t < 16.67).length}/100`);
    });
  });

  describe('Large Dataset Stress Tests', () => {
    test('should handle extremely large datasets', () => {
      const startTime = performance.now();
      
      // Test with 100k items
      const { container } = render(<TestVirtualList itemCount={100000} />);
      
      const renderTime = performance.now() - startTime;
      
      // Should still render efficiently
      expect(renderTime).toBeLessThan(200);
      
      // Verify virtual scrolling is working
      const virtualContainer = container.querySelector('.virtual-list-container');
      expect(virtualContainer).toBeInTheDocument();
      
      // Should only render visible items
      const renderedItems = container.querySelectorAll('.test-item');
      expect(renderedItems.length).toBeLessThan(50);
      
      console.log(`100k items render time: ${renderTime.toFixed(2)}ms`);
    });

    test('should handle dynamic item updates efficiently', () => {
      let items = generateMockItems(1000);
      
      function DynamicTestList() {
        const [currentItems, setCurrentItems] = React.useState(items);
        
        React.useEffect(() => {
          const interval = setInterval(() => {
            setCurrentItems(prev => [
              ...prev,
              ...generateMockItems(100)
            ]);
          }, 100);
          
          return () => clearInterval(interval);
        }, []);
        
        const renderItem = (item: any) => (
          <div key={item.id} className="dynamic-item">
            {item.title}
          </div>
        );
        
        return (
          <VirtualList
            items={currentItems}
            itemHeight={40}
            containerHeight={400}
            renderItem={renderItem}
          />
        );
      }
      
      const startTime = performance.now();
      const { container } = render(<DynamicTestList />);
      
      // Let it run for a bit to test dynamic updates
      setTimeout(() => {
        const updateTime = performance.now() - startTime;
        
        // Should handle dynamic updates efficiently
        expect(updateTime).toBeLessThan(1000);
        
        const renderedItems = container.querySelectorAll('.dynamic-item');
        expect(renderedItems.length).toBeGreaterThan(0);
        expect(renderedItems.length).toBeLessThan(50); // Still virtualized
      }, 500);
    });
  });
});

describe('Performance Monitoring Integration', () => {
  test('should track VirtualList performance metrics', () => {
    const monitor = performanceMonitor.monitorComponentRender('VirtualList');
    
    monitor.onRenderStart();
    render(<TestVirtualList itemCount={5000} />);
    monitor.onRenderEnd();
    
    const stats = performanceMonitor.getStatistics('render');
    expect(stats).not.toBeNull();
  });
});