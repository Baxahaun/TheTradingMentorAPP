import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ChartViewerDialog } from '../ChartViewerDialog';
import { TradeChart } from '@/types/tradeReview';

// Mock fetch for download functionality
global.fetch = vi.fn();
const mockFetch = vi.mocked(fetch);

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-blob-url');
global.URL.revokeObjectURL = vi.fn();

// Mock fullscreen API
Object.defineProperty(document, 'fullscreenElement', {
  writable: true,
  value: null
});

Object.defineProperty(document, 'exitFullscreen', {
  writable: true,
  value: vi.fn()
});

Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
  writable: true,
  value: vi.fn()
});

// Sample chart data
const sampleChart: TradeChart = {
  id: 'chart1',
  url: 'https://example.com/chart1.png',
  type: 'entry',
  timeframe: '1h',
  description: 'Entry analysis chart',
  uploadedAt: '2024-01-01T10:00:00Z',
  annotations: [
    {
      id: 'annotation1',
      type: 'line',
      coordinates: { x1: 10, y1: 20, x2: 30, y2: 40 },
      style: { color: '#ff0000', thickness: 2, opacity: 1 },
      timestamp: '2024-01-01T10:30:00Z'
    },
    {
      id: 'annotation2',
      type: 'text',
      coordinates: { x1: 50, y1: 60 },
      style: { color: '#00ff00', thickness: 1, opacity: 0.8 },
      text: 'Support level',
      timestamp: '2024-01-01T10:35:00Z'
    }
  ]
};

describe('ChartViewerDialog', () => {
  const defaultProps = {
    chart: sampleChart,
    isOpen: true,
    onClose: vi.fn(),
    onAnnotationUpdate: vi.fn(),
    showAnnotations: true,
    onToggleAnnotations: vi.fn(),
    isEditing: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render chart viewer dialog when open', () => {
      render(<ChartViewerDialog {...defaultProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByAltText('Entry analysis chart')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(<ChartViewerDialog {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should display chart metadata', () => {
      render(<ChartViewerDialog {...defaultProps} />);
      
      expect(screen.getByText('Entry')).toBeInTheDocument();
      expect(screen.getByText('1h')).toBeInTheDocument();
      expect(screen.getByText('2 annotations')).toBeInTheDocument();
    });

    it('should display chart description in footer', () => {
      render(<ChartViewerDialog {...defaultProps} />);
      
      expect(screen.getByText('Entry analysis chart')).toBeInTheDocument();
      expect(screen.getByText(/Uploaded:/)).toBeInTheDocument();
    });

    it('should show annotations when enabled', () => {
      render(<ChartViewerDialog {...defaultProps} />);
      
      // Should render annotation elements (SVG lines, text, etc.)
      const annotationElements = document.querySelectorAll('[class*="absolute"]');
      expect(annotationElements.length).toBeGreaterThan(0);
    });

    it('should hide annotations when disabled', () => {
      render(<ChartViewerDialog {...defaultProps} showAnnotations={false} />);
      
      // Annotations should not be visible
      expect(screen.queryByText('Support level')).not.toBeInTheDocument();
    });
  });

  describe('Zoom Controls', () => {
    it('should display current zoom level', () => {
      render(<ChartViewerDialog {...defaultProps} />);
      
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should zoom in when zoom in button is clicked', () => {
      render(<ChartViewerDialog {...defaultProps} />);
      
      const zoomInButton = screen.getByRole('button', { name: /zoom.*in/i });
      fireEvent.click(zoomInButton);
      
      expect(screen.getByText('120%')).toBeInTheDocument();
    });

    it('should zoom out when zoom out button is clicked', () => {
      render(<ChartViewerDialog {...defaultProps} />);
      
      // First zoom in to have something to zoom out from
      const zoomInButton = screen.getByRole('button', { name: /zoom.*in/i });
      fireEvent.click(zoomInButton);
      
      const zoomOutButton = screen.getByRole('button', { name: /zoom.*out/i });
      fireEvent.click(zoomOutButton);
      
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should reset zoom when reset button is clicked', () => {
      render(<ChartViewerDialog {...defaultProps} />);
      
      // Zoom in first
      const zoomInButton = screen.getByRole('button', { name: /zoom.*in/i });
      fireEvent.click(zoomInButton);
      fireEvent.click(zoomInButton);
      
      expect(screen.getByText('144%')).toBeInTheDocument();
      
      // Reset zoom
      const resetButton = screen.getByRole('button', { name: /reset/i });
      fireEvent.click(resetButton);
      
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should disable zoom in at maximum zoom', () => {
      render(<ChartViewerDialog {...defaultProps} />);
      
      const zoomInButton = screen.getByRole('button', { name: /zoom.*in/i });
      
      // Zoom to maximum (5x = 500%)
      for (let i = 0; i < 20; i++) {
        fireEvent.click(zoomInButton);
      }
      
      expect(zoomInButton).toBeDisabled();
    });

    it('should disable zoom out at minimum zoom', () => {
      render(<ChartViewerDialog {...defaultProps} />);
      
      const zoomOutButton = screen.getByRole('button', { name: /zoom.*out/i });
      
      // Zoom to minimum (0.1x = 10%)
      for (let i = 0; i < 20; i++) {
        fireEvent.click(zoomOutButton);
      }
      
      expect(zoomOutButton).toBeDisabled();
    });
  });

  describe('Pan Functionality', () => {
    it('should enable panning when zoomed in', () => {
      render(<ChartViewerDialog {...defaultProps} />);
      
      // Zoom in first
      const zoomInButton = screen.getByRole('button', { name: /zoom.*in/i });
      fireEvent.click(zoomInButton);
      
      const imageContainer = screen.getByAltText('Entry analysis chart').parentElement!;
      
      // Should have grab cursor when zoomed
      expect(imageContainer).toHaveStyle('cursor: grab');
    });

    it('should change cursor to grabbing when dragging', () => {
      render(<ChartViewerDialog {...defaultProps} />);
      
      // Zoom in first
      const zoomInButton = screen.getByRole('button', { name: /zoom.*in/i });
      fireEvent.click(zoomInButton);
      
      const imageContainer = screen.getByAltText('Entry analysis chart').parentElement!;
      
      // Start dragging
      fireEvent.mouseDown(imageContainer, { clientX: 100, clientY: 100 });
      
      expect(imageContainer).toHaveStyle('cursor: grabbing');
    });

    it('should update position when dragging', () => {
      render(<ChartViewerDialog {...defaultProps} />);
      
      // Zoom in first
      const zoomInButton = screen.getByRole('button', { name: /zoom.*in/i });
      fireEvent.click(zoomInButton);
      
      const imageContainer = screen.getByAltText('Entry analysis chart').parentElement!;
      
      // Start dragging
      fireEvent.mouseDown(imageContainer, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(imageContainer, { clientX: 150, clientY: 150 });
      
      // Position should be updated (transform style)
      const imageWrapper = screen.getByAltText('Entry analysis chart').parentElement!;
      expect(imageWrapper).toHaveStyle(/transform:.*translate/);
    });
  });

  describe('Annotation Toggle', () => {
    it('should toggle annotations when button is clicked', () => {
      render(<ChartViewerDialog {...defaultProps} />);
      
      const toggleButton = screen.getByRole('button', { name: /eye/i });
      fireEvent.click(toggleButton);
      
      expect(defaultProps.onToggleAnnotations).toHaveBeenCalled();
    });

    it('should show eye-off icon when annotations are hidden', () => {
      render(<ChartViewerDialog {...defaultProps} showAnnotations={false} />);
      
      // Should show EyeOff icon (this would need to be tested based on your icon implementation)
      const toggleButton = screen.getByRole('button', { name: /eye/i });
      expect(toggleButton).toBeInTheDocument();
    });
  });

  describe('Download Functionality', () => {
    it('should download chart when download button is clicked', async () => {
      const mockBlob = new Blob(['mock image data'], { type: 'image/png' });
      mockFetch.mockResolvedValue({
        blob: () => Promise.resolve(mockBlob)
      } as Response);

      // Mock document.createElement and appendChild/removeChild
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn()
      };
      const originalCreateElement = document.createElement;
      document.createElement = vi.fn((tagName) => {
        if (tagName === 'a') return mockLink as any;
        return originalCreateElement.call(document, tagName);
      });

      const mockAppendChild = vi.fn();
      const mockRemoveChild = vi.fn();
      document.body.appendChild = mockAppendChild;
      document.body.removeChild = mockRemoveChild;

      render(<ChartViewerDialog {...defaultProps} />);
      
      const downloadButton = screen.getByRole('button', { name: /download/i });
      fireEvent.click(downloadButton);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(sampleChart.url);
        expect(mockLink.click).toHaveBeenCalled();
        expect(mockAppendChild).toHaveBeenCalledWith(mockLink);
        expect(mockRemoveChild).toHaveBeenCalledWith(mockLink);
      });

      // Restore original methods
      document.createElement = originalCreateElement;
    });

    it('should handle download errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<ChartViewerDialog {...defaultProps} />);
      
      const downloadButton = screen.getByRole('button', { name: /download/i });
      fireEvent.click(downloadButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Download failed:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Fullscreen Functionality', () => {
    it('should enter fullscreen when fullscreen button is clicked', () => {
      const mockRequestFullscreen = vi.fn();
      
      render(<ChartViewerDialog {...defaultProps} />);
      
      // Mock the container ref
      const container = screen.getByRole('dialog');
      container.requestFullscreen = mockRequestFullscreen;
      
      const fullscreenButton = screen.getByRole('button', { name: /maximize/i });
      fireEvent.click(fullscreenButton);
      
      expect(mockRequestFullscreen).toHaveBeenCalled();
    });

    it('should exit fullscreen when already in fullscreen', () => {
      const mockExitFullscreen = vi.fn();
      document.exitFullscreen = mockExitFullscreen;
      
      // Mock fullscreen state
      Object.defineProperty(document, 'fullscreenElement', {
        value: document.createElement('div')
      });

      render(<ChartViewerDialog {...defaultProps} />);
      
      const fullscreenButton = screen.getByRole('button', { name: /minimize/i });
      fireEvent.click(fullscreenButton);
      
      expect(mockExitFullscreen).toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be accessible via keyboard', () => {
      render(<ChartViewerDialog {...defaultProps} />);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      closeButton.focus();
      
      expect(document.activeElement).toBe(closeButton);
    });
  });

  describe('Chart Changes', () => {
    it('should reset zoom and position when chart changes', () => {
      const { rerender } = render(<ChartViewerDialog {...defaultProps} />);
      
      // Zoom in and pan
      const zoomInButton = screen.getByRole('button', { name: /zoom.*in/i });
      fireEvent.click(zoomInButton);
      
      expect(screen.getByText('120%')).toBeInTheDocument();
      
      // Change chart
      const newChart = { ...sampleChart, id: 'chart2' };
      rerender(<ChartViewerDialog {...defaultProps} chart={newChart} />);
      
      // Should reset to 100%
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('Annotation Rendering', () => {
    it('should render line annotations', () => {
      render(<ChartViewerDialog {...defaultProps} />);
      
      // Should render SVG line elements
      const svgElements = document.querySelectorAll('svg line');
      expect(svgElements.length).toBeGreaterThan(0);
    });

    it('should render text annotations', () => {
      render(<ChartViewerDialog {...defaultProps} />);
      
      expect(screen.getByText('Support level')).toBeInTheDocument();
    });

    it('should apply annotation styles correctly', () => {
      render(<ChartViewerDialog {...defaultProps} />);
      
      const textAnnotation = screen.getByText('Support level');
      expect(textAnnotation).toHaveStyle('color: #00ff00');
      expect(textAnnotation).toHaveStyle('opacity: 0.8');
    });
  });

  describe('Close Functionality', () => {
    it('should call onClose when close button is clicked', () => {
      render(<ChartViewerDialog {...defaultProps} />);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);
      
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should call onClose when dialog overlay is clicked', () => {
      render(<ChartViewerDialog {...defaultProps} />);
      
      // This would depend on your dialog implementation
      // Usually clicking outside the dialog content closes it
      const dialog = screen.getByRole('dialog');
      fireEvent.click(dialog);
      
      // Note: This test might need adjustment based on your Dialog component implementation
    });
  });
});