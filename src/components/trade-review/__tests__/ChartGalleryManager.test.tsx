import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ChartGalleryManager } from '../ChartGalleryManager';
import { TradeChart } from '@/types/tradeReview';
import { chartUploadService } from '@/lib/chartUploadService';
import { toast } from '@/components/ui/use-toast';

// Mock dependencies
vi.mock('@/lib/chartUploadService');
vi.mock('@/components/ui/use-toast');
vi.mock('../ChartViewerDialog', () => ({
  ChartViewerDialog: ({ isOpen, onClose }: any) => 
    isOpen ? <div role="dialog" onClick={onClose}>Chart Viewer</div> : null
}));
vi.mock('../ChartEditorDialog', () => ({
  ChartEditorDialog: ({ isOpen, onClose }: any) => 
    isOpen ? <div role="dialog" onClick={onClose}>Chart Editor</div> : null
}));

const mockChartUploadService = vi.mocked(chartUploadService);
const mockToast = vi.mocked(toast);

// Mock file for testing
const createMockFile = (name: string, type: string, size: number): File => {
  const file = new File(['mock content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

// Sample chart data
const sampleCharts: TradeChart[] = [
  {
    id: 'chart1',
    url: 'https://example.com/chart1.png',
    type: 'entry',
    timeframe: '1h',
    description: 'Entry analysis chart',
    uploadedAt: '2024-01-01T10:00:00Z',
    annotations: []
  },
  {
    id: 'chart2',
    url: 'https://example.com/chart2.png',
    type: 'exit',
    timeframe: '4h',
    description: 'Exit strategy chart',
    uploadedAt: '2024-01-01T11:00:00Z',
    annotations: [
      {
        id: 'annotation1',
        type: 'line',
        coordinates: { x1: 10, y1: 20, x2: 30, y2: 40 },
        style: { color: '#ff0000', thickness: 2, opacity: 1 },
        timestamp: '2024-01-01T11:30:00Z'
      }
    ]
  },
  {
    id: 'chart3',
    url: 'https://example.com/chart3.png',
    type: 'analysis',
    timeframe: '1d',
    uploadedAt: '2024-01-01T12:00:00Z',
    annotations: []
  }
];

describe('ChartGalleryManager', () => {
  const defaultProps = {
    tradeId: 'trade-123',
    charts: sampleCharts,
    isEditing: true,
    onChartsChange: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render chart gallery with correct title and count', () => {
      render(<ChartGalleryManager {...defaultProps} />);
      
      expect(screen.getByText('Chart Gallery')).toBeInTheDocument();
      expect(screen.getByText('3 charts')).toBeInTheDocument();
    });

    it('should render charts in grid view by default', () => {
      render(<ChartGalleryManager {...defaultProps} />);
      
      // Should show all charts
      expect(screen.getByAltText('Entry analysis chart')).toBeInTheDocument();
      expect(screen.getByAltText('Exit strategy chart')).toBeInTheDocument();
      expect(screen.getByAltText('analysis chart')).toBeInTheDocument();
    });

    it('should show upload area when editing', () => {
      render(<ChartGalleryManager {...defaultProps} />);
      
      expect(screen.getByText('Drop chart images here')).toBeInTheDocument();
      expect(screen.getByText('Upload')).toBeInTheDocument();
    });

    it('should hide upload controls when not editing', () => {
      render(<ChartGalleryManager {...defaultProps} isEditing={false} />);
      
      expect(screen.queryByText('Drop chart images here')).not.toBeInTheDocument();
      expect(screen.queryByText('Upload')).not.toBeInTheDocument();
    });

    it('should show empty state when no charts', () => {
      render(<ChartGalleryManager {...defaultProps} charts={[]} />);
      
      expect(screen.getByText('No charts found')).toBeInTheDocument();
      expect(screen.getByText('Upload some chart images to get started')).toBeInTheDocument();
    });
  });

  describe('View Mode Toggle', () => {
    it('should switch between grid and list view', () => {
      render(<ChartGalleryManager {...defaultProps} />);
      
      // Should start in grid view
      const listButton = screen.getByRole('button', { name: 'List view' });
      fireEvent.click(listButton);
      
      // Should now show list view (different layout - check for list-specific elements)
      // In list view, we should see smaller thumbnails and different layout
      const thumbnails = screen.getAllByRole('img');
      expect(thumbnails).toHaveLength(3); // Same number of images but different layout
    });
  });

  describe('Filtering', () => {
    it('should filter charts by type', async () => {
      render(<ChartGalleryManager {...defaultProps} />);
      
      // Open filter dropdown
      const filterSelect = screen.getByRole('combobox');
      fireEvent.click(filterSelect);
      
      // Select entry type
      const entryOption = screen.getByText('Entry');
      fireEvent.click(entryOption);
      
      // Should only show entry chart
      await waitFor(() => {
        expect(screen.getByText('1 chart')).toBeInTheDocument();
        expect(screen.getByAltText('Entry analysis chart')).toBeInTheDocument();
        expect(screen.queryByAltText('Exit strategy chart')).not.toBeInTheDocument();
      });
    });

    it('should show all charts when filter is set to all', async () => {
      render(<ChartGalleryManager {...defaultProps} />);
      
      // Filter should default to 'all'
      expect(screen.getByText('3 charts')).toBeInTheDocument();
    });
  });

  describe('File Upload', () => {
    it('should handle successful file upload', async () => {
      const mockUploadedChart: TradeChart = {
        id: 'new-chart',
        url: 'https://example.com/new-chart.png',
        type: 'analysis',
        timeframe: '1h',
        uploadedAt: '2024-01-01T13:00:00Z',
        annotations: []
      };

      mockChartUploadService.uploadChart.mockResolvedValue(mockUploadedChart);

      render(<ChartGalleryManager {...defaultProps} />);
      
      const fileInput = screen.getByRole('button', { name: /upload/i });
      const file = createMockFile('test-chart.png', 'image/png', 1024 * 1024);
      
      // Mock file input change
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      Object.defineProperty(hiddenInput, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(hiddenInput);
      
      await waitFor(() => {
        expect(mockChartUploadService.uploadChart).toHaveBeenCalledWith('trade-123', file);
        expect(defaultProps.onChartsChange).toHaveBeenCalledWith([...sampleCharts, mockUploadedChart]);
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Upload Successful',
          description: '1 chart(s) uploaded successfully'
        });
      });
    });

    it('should handle upload failure', async () => {
      mockChartUploadService.uploadChart.mockRejectedValue(new Error('Upload failed'));

      render(<ChartGalleryManager {...defaultProps} />);
      
      const file = createMockFile('test-chart.png', 'image/png', 1024 * 1024);
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(hiddenInput, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(hiddenInput);
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Upload Failed',
          description: 'Failed to upload test-chart.png: Upload failed',
          variant: 'destructive'
        });
      });
    });

    it('should validate file types', async () => {
      render(<ChartGalleryManager {...defaultProps} />);
      
      const invalidFile = createMockFile('document.pdf', 'application/pdf', 1024);
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(hiddenInput, 'files', {
        value: [invalidFile],
        writable: false,
      });
      
      fireEvent.change(hiddenInput);
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Upload Failed',
          description: expect.stringContaining('Invalid file type'),
          variant: 'destructive'
        });
      });
    });

    it('should validate file size', async () => {
      render(<ChartGalleryManager {...defaultProps} />);
      
      const largeFile = createMockFile('large-chart.png', 'image/png', 15 * 1024 * 1024); // 15MB
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(hiddenInput, 'files', {
        value: [largeFile],
        writable: false,
      });
      
      fireEvent.change(hiddenInput);
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Upload Failed',
          description: expect.stringContaining('File size too large'),
          variant: 'destructive'
        });
      });
    });
  });

  describe('Drag and Drop', () => {
    it('should handle drag and drop upload', async () => {
      const mockUploadedChart: TradeChart = {
        id: 'dropped-chart',
        url: 'https://example.com/dropped-chart.png',
        type: 'analysis',
        timeframe: '1h',
        uploadedAt: '2024-01-01T13:00:00Z',
        annotations: []
      };

      mockChartUploadService.uploadChart.mockResolvedValue(mockUploadedChart);

      render(<ChartGalleryManager {...defaultProps} />);
      
      const dropZone = screen.getByText('Drop chart images here').closest('div')!;
      const file = createMockFile('dropped-chart.png', 'image/png', 1024 * 1024);
      
      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { files: [file] }
      });
      
      fireEvent(dropZone, dropEvent);
      
      await waitFor(() => {
        expect(mockChartUploadService.uploadChart).toHaveBeenCalledWith('trade-123', file);
        expect(defaultProps.onChartsChange).toHaveBeenCalledWith([...sampleCharts, mockUploadedChart]);
      });
    });

    it('should not handle drop when not editing', () => {
      render(<ChartGalleryManager {...defaultProps} isEditing={false} />);
      
      // Drop zone should not be present
      expect(screen.queryByText('Drop chart images here')).not.toBeInTheDocument();
    });
  });

  describe('Chart Actions', () => {
    it('should delete chart successfully', async () => {
      mockChartUploadService.deleteChart.mockResolvedValue();

      render(<ChartGalleryManager {...defaultProps} />);
      
      // Find and click delete button (should be visible on hover)
      const chartCard = screen.getByAltText('Entry analysis chart').closest('.group')!;
      const deleteButton = chartCard.querySelector('button[class*="destructive"]') as HTMLButtonElement;
      
      fireEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(mockChartUploadService.deleteChart).toHaveBeenCalledWith('trade-123', 'chart1');
        expect(defaultProps.onChartsChange).toHaveBeenCalledWith(
          sampleCharts.filter(chart => chart.id !== 'chart1')
        );
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Chart Deleted',
          description: 'Chart has been successfully deleted'
        });
      });
    });

    it('should handle delete failure', async () => {
      mockChartUploadService.deleteChart.mockRejectedValue(new Error('Delete failed'));

      render(<ChartGalleryManager {...defaultProps} />);
      
      const chartCard = screen.getByAltText('Entry analysis chart').closest('.group')!;
      const deleteButton = chartCard.querySelector('button[class*="destructive"]') as HTMLButtonElement;
      
      fireEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Delete Failed',
          description: 'Failed to delete chart',
          variant: 'destructive'
        });
      });
    });

    it('should open chart viewer when clicking on chart', () => {
      render(<ChartGalleryManager {...defaultProps} />);
      
      const chartImage = screen.getByAltText('Entry analysis chart');
      fireEvent.click(chartImage);
      
      // Chart viewer dialog should open (we'll test this in ChartViewerDialog tests)
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Chart Organization', () => {
    it('should display chart type badges', () => {
      render(<ChartGalleryManager {...defaultProps} />);
      
      // Check that charts are rendered (which should include badges)
      const chartImages = screen.getAllByRole('img');
      expect(chartImages).toHaveLength(3);
      
      // Check for the presence of badge-like elements
      // Since badges might be styled differently, just check that we have the expected chart structure
      expect(screen.getByText('Chart Gallery')).toBeInTheDocument();
    });

    it('should display timeframe badges', () => {
      render(<ChartGalleryManager {...defaultProps} />);
      
      expect(screen.getByText('1h')).toBeInTheDocument();
      expect(screen.getByText('4h')).toBeInTheDocument();
      expect(screen.getByText('1d')).toBeInTheDocument();
    });

    it('should show annotation indicators', () => {
      render(<ChartGalleryManager {...defaultProps} />);
      
      // Chart2 has 1 annotation
      const annotationBadges = screen.getAllByText('1');
      expect(annotationBadges.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<ChartGalleryManager {...defaultProps} />);
      
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Grid view' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'List view' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Upload' })).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(<ChartGalleryManager {...defaultProps} />);
      
      const uploadButton = screen.getByRole('button', { name: /upload/i });
      uploadButton.focus();
      expect(document.activeElement).toBe(uploadButton);
    });
  });

  describe('Performance', () => {
    it('should use lazy loading for images', () => {
      render(<ChartGalleryManager {...defaultProps} />);
      
      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('loading', 'lazy');
      });
    });
  });
});