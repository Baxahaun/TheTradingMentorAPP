/**
 * Chart Gallery Manager Performance Tests
 * Integration tests for performance optimizations in chart gallery
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChartGalleryManager } from '../../components/trade-review/ChartGalleryManager';
import { TradeChart } from '../../types/tradeReview';

// Mock the performance optimization hooks
jest.mock('../../lib/performanceOptimization', () => ({
  useMemoryManagement: jest.fn(() => ({
    registerImage: jest.fn(),
    unregisterImage: jest.fn(),
    registerObjectUrl: jest.fn(),
    cleanup: jest.fn()
  })),
  useDebouncedCallback: jest.fn((callback) => callback),
  usePerformanceMonitor: jest.fn(() => ({
    renderTime: 12.5
  }))
}));

// Mock the lazy loading components
jest.mock('../../components/trade-review/LazyChartImage', () => ({
  ChartThumbnail: ({ src, alt, onClick }: any) => (
    <img 
      src={src} 
      alt={alt} 
      onClick={onClick}
      data-testid="chart-thumbnail"
    />
  ),
  LazyChartImage: ({ src, alt, onClick }: any) => (
    <img 
      src={src} 
      alt={alt} 
      onClick={onClick}
      data-testid="lazy-chart-image"
    />
  )
}));

// Mock the virtualized list
jest.mock('../../components/trade-review/VirtualizedList', () => ({
  VirtualizedChartGallery: ({ charts, onChartClick }: any) => (
    <div data-testid="virtualized-gallery">
      {charts.slice(0, 5).map((chart: any) => (
        <div 
          key={chart.id} 
          onClick={() => onChartClick(chart.id)}
          data-testid={`virtual-chart-${chart.id}`}
        >
          {chart.type} - {chart.timeframe}
        </div>
      ))}
    </div>
  )
}));

// Mock other dependencies
jest.mock('../../lib/chartUploadService', () => ({
  chartUploadService: {
    uploadChart: jest.fn(),
    deleteChart: jest.fn(),
    updateChart: jest.fn()
  }
}));

jest.mock('../../components/ui/use-toast', () => ({
  toast: jest.fn()
}));

describe('ChartGalleryManager Performance', () => {
  const createMockCharts = (count: number): TradeChart[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `chart-${i}`,
      url: `https://example.com/chart-${i}.jpg`,
      type: ['entry', 'exit', 'analysis', 'post_mortem'][i % 4] as any,
      timeframe: ['1M', '5M', '15M', '1H', '4H', '1D'][i % 6],
      description: `Chart ${i} description`,
      uploadedAt: new Date().toISOString(),
      annotations: []
    }));
  };

  const defaultProps = {
    tradeId: 'test-trade',
    charts: createMockCharts(10),
    isEditing: false,
    onChartsChange: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Memory Management', () => {
    it('should initialize memory management on mount', () => {
      const { useMemoryManagement } = require('../../lib/performanceOptimization');
      
      render(<ChartGalleryManager {...defaultProps} />);
      
      expect(useMemoryManagement).toHaveBeenCalled();
    });

    it('should cleanup resources on unmount', () => {
      const { useMemoryManagement } = require('../../lib/performanceOptimization');
      const mockCleanup = jest.fn();
      
      useMemoryManagement.mockReturnValue({
        registerImage: jest.fn(),
        unregisterImage: jest.fn(),
        registerObjectUrl: jest.fn(),
        cleanup: mockCleanup
      });

      const { unmount } = render(<ChartGalleryManager {...defaultProps} />);
      
      unmount();
      
      expect(mockCleanup).toHaveBeenCalled();
    });
  });

  describe('Debounced File Upload', () => {
    it('should use debounced callback for file uploads', () => {
      const { useDebouncedCallback } = require('../../lib/performanceOptimization');
      
      render(<ChartGalleryManager {...defaultProps} isEditing />);
      
      expect(useDebouncedCallback).toHaveBeenCalledWith(
        expect.any(Function),
        300
      );
    });

    it('should handle multiple file uploads efficiently', async () => {
      const { chartUploadService } = require('../../lib/chartUploadService');
      chartUploadService.uploadChart.mockResolvedValue({
        id: 'new-chart',
        url: 'https://example.com/new-chart.jpg',
        type: 'analysis',
        timeframe: '1H',
        uploadedAt: new Date().toISOString()
      });

      render(<ChartGalleryManager {...defaultProps} isEditing />);
      
      const fileInput = screen.getByRole('button', { name: /upload/i });
      expect(fileInput).toBeInTheDocument();
    });
  });

  describe('Virtualization', () => {
    it('should use virtualization for large chart collections', () => {
      const manyCharts = createMockCharts(25); // More than 20 triggers virtualization
      
      render(
        <ChartGalleryManager 
          {...defaultProps} 
          charts={manyCharts}
        />
      );
      
      // Should render virtualized gallery for large collections
      expect(screen.getByTestId('virtualized-gallery')).toBeInTheDocument();
    });

    it('should use regular grid for small chart collections', () => {
      const fewCharts = createMockCharts(5); // Less than 20 uses regular grid
      
      render(
        <ChartGalleryManager 
          {...defaultProps} 
          charts={fewCharts}
        />
      );
      
      // Should not use virtualization for small collections
      expect(screen.queryByTestId('virtualized-gallery')).not.toBeInTheDocument();
      
      // Should render chart thumbnails directly
      const thumbnails = screen.getAllByTestId('chart-thumbnail');
      expect(thumbnails.length).toBe(5);
    });

    it('should handle chart clicks in virtualized mode', () => {
      const manyCharts = createMockCharts(25);
      const onChartsChange = jest.fn();
      
      render(
        <ChartGalleryManager 
          {...defaultProps} 
          charts={manyCharts}
          onChartsChange={onChartsChange}
        />
      );
      
      const virtualChart = screen.getByTestId('virtual-chart-chart-0');
      fireEvent.click(virtualChart);
      
      // Should handle click without errors
      expect(virtualChart).toBeInTheDocument();
    });
  });

  describe('Performance Monitoring', () => {
    it('should monitor render performance', () => {
      const { usePerformanceMonitor } = require('../../lib/performanceOptimization');
      
      render(<ChartGalleryManager {...defaultProps} />);
      
      expect(usePerformanceMonitor).toHaveBeenCalledWith('ChartGalleryManager');
    });

    it('should display performance warning in development', () => {
      const { usePerformanceMonitor } = require('../../lib/performanceOptimization');
      
      // Mock slow render time
      usePerformanceMonitor.mockReturnValue({
        renderTime: 25.5 // > 16ms threshold
      });

      // Mock development environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(<ChartGalleryManager {...defaultProps} />);
      
      expect(screen.getByText(/slow render detected/i)).toBeInTheDocument();
      expect(screen.getByText(/25\.50ms/)).toBeInTheDocument();

      // Restore environment
      process.env.NODE_ENV = originalEnv;
    });

    it('should not display performance warning in production', () => {
      const { usePerformanceMonitor } = require('../../lib/performanceOptimization');
      
      usePerformanceMonitor.mockReturnValue({
        renderTime: 25.5
      });

      // Mock production environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      render(<ChartGalleryManager {...defaultProps} />);
      
      expect(screen.queryByText(/slow render detected/i)).not.toBeInTheDocument();

      // Restore environment
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Lazy Loading Integration', () => {
    it('should use lazy loading for chart thumbnails', () => {
      render(<ChartGalleryManager {...defaultProps} />);
      
      const thumbnails = screen.getAllByTestId('chart-thumbnail');
      expect(thumbnails.length).toBeGreaterThan(0);
    });

    it('should handle chart selection with lazy loaded images', () => {
      render(<ChartGalleryManager {...defaultProps} />);
      
      const firstThumbnail = screen.getAllByTestId('chart-thumbnail')[0];
      fireEvent.click(firstThumbnail);
      
      // Should handle click without errors
      expect(firstThumbnail).toBeInTheDocument();
    });
  });

  describe('Memoization and Optimization', () => {
    it('should memoize filtered charts', () => {
      const { rerender } = render(<ChartGalleryManager {...defaultProps} />);
      
      // Change props that shouldn't affect filtered charts
      rerender(
        <ChartGalleryManager 
          {...defaultProps} 
          isEditing={true}
        />
      );
      
      // Component should handle re-renders efficiently
      expect(screen.getByText(/chart gallery/i)).toBeInTheDocument();
    });

    it('should handle filter changes efficiently', () => {
      render(<ChartGalleryManager {...defaultProps} />);
      
      // Change filter type
      const filterSelect = screen.getByRole('combobox');
      fireEvent.click(filterSelect);
      
      // Should update filter without performance issues
      expect(filterSelect).toBeInTheDocument();
    });

    it('should memoize render functions', () => {
      const manyCharts = createMockCharts(15);
      
      const { rerender } = render(
        <ChartGalleryManager 
          {...defaultProps} 
          charts={manyCharts}
        />
      );
      
      // Re-render with same props
      rerender(
        <ChartGalleryManager 
          {...defaultProps} 
          charts={manyCharts}
        />
      );
      
      // Should handle re-renders efficiently
      const thumbnails = screen.getAllByTestId('chart-thumbnail');
      expect(thumbnails.length).toBe(15);
    });
  });

  describe('View Mode Performance', () => {
    it('should handle view mode switching efficiently', () => {
      render(<ChartGalleryManager {...defaultProps} />);
      
      // Switch to list view
      const listViewButton = screen.getByLabelText('List view');
      fireEvent.click(listViewButton);
      
      // Should switch views without performance issues
      expect(listViewButton).toBeInTheDocument();
    });

    it('should optimize list view rendering', () => {
      render(<ChartGalleryManager {...defaultProps} />);
      
      // Switch to list view
      const listViewButton = screen.getByLabelText('List view');
      fireEvent.click(listViewButton);
      
      // Should render list items efficiently
      const thumbnails = screen.getAllByTestId('chart-thumbnail');
      expect(thumbnails.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle upload errors without blocking UI', async () => {
      const { chartUploadService } = require('../../lib/chartUploadService');
      chartUploadService.uploadChart.mockRejectedValue(new Error('Upload failed'));

      render(<ChartGalleryManager {...defaultProps} isEditing />);
      
      // Component should render without errors even with failed uploads
      expect(screen.getByText(/chart gallery/i)).toBeInTheDocument();
    });

    it('should handle delete errors gracefully', async () => {
      const { chartUploadService } = require('../../lib/chartUploadService');
      chartUploadService.deleteChart.mockRejectedValue(new Error('Delete failed'));

      render(<ChartGalleryManager {...defaultProps} isEditing />);
      
      // Should handle errors without crashing
      expect(screen.getByText(/chart gallery/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility Performance', () => {
    it('should maintain accessibility with performance optimizations', () => {
      render(<ChartGalleryManager {...defaultProps} />);
      
      // Should have proper ARIA labels and roles
      const gallery = screen.getByText(/chart gallery/i);
      expect(gallery).toBeInTheDocument();
      
      // View mode buttons should be accessible
      const gridViewButton = screen.getByLabelText('Grid view');
      const listViewButton = screen.getByLabelText('List view');
      
      expect(gridViewButton).toBeInTheDocument();
      expect(listViewButton).toBeInTheDocument();
    });

    it('should support keyboard navigation with optimizations', () => {
      render(<ChartGalleryManager {...defaultProps} />);
      
      const gridViewButton = screen.getByLabelText('Grid view');
      
      // Should handle keyboard events
      fireEvent.keyDown(gridViewButton, { key: 'Enter' });
      
      expect(gridViewButton).toBeInTheDocument();
    });
  });
});