import React, { useState, useRef, useCallback } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Download, 
  Maximize2, 
  Minimize2,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { TradeChart, ChartAnnotation } from '@/types/tradeReview';
import { ChartAnnotationTools } from './ChartAnnotationTools';

interface ChartViewerDialogProps {
  chart: TradeChart;
  isOpen: boolean;
  onClose: () => void;
  onAnnotationUpdate: (chartId: string, annotations: ChartAnnotation[]) => void;
  showAnnotations: boolean;
  onToggleAnnotations: () => void;
  isEditing: boolean;
}

export const ChartViewerDialog: React.FC<ChartViewerDialogProps> = ({
  chart,
  isOpen,
  onClose,
  onAnnotationUpdate,
  showAnnotations,
  onToggleAnnotations,
  isEditing
}) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.2, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev / 1.2, 0.1));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  }, [zoom, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDownload = useCallback(async () => {
    try {
      const response = await fetch(chart.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `chart-${chart.type}-${chart.timeframe}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  }, [chart]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Handle fullscreen change events
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Reset zoom and position when chart changes
  React.useEffect(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, [chart.id]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`max-w-7xl h-[90vh] p-0 ${isFullscreen ? 'fixed inset-0 max-w-none h-screen' : ''}`}
        ref={containerRef}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-background">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="capitalize">
              {chart.type.replace('_', ' ')}
            </Badge>
            <Badge variant="outline">
              {chart.timeframe}
            </Badge>
            {chart.annotations && chart.annotations.length > 0 && (
              <Badge variant="outline">
                {chart.annotations.length} annotation{chart.annotations.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Zoom controls */}
            <div className="flex items-center gap-1 border rounded-md">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleZoomOut}
                disabled={zoom <= 0.1}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="px-2 text-sm font-mono">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleZoomIn}
                disabled={zoom >= 5}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
            
            <Button
              size="sm"
              variant="outline"
              onClick={handleResetZoom}
              disabled={zoom === 1 && position.x === 0 && position.y === 0}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            
            {/* Annotation toggle */}
            {chart.annotations && chart.annotations.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={onToggleAnnotations}
              >
                {showAnnotations ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
            )}
            
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Image container */}
        <div className="flex-1 relative overflow-hidden bg-muted">
          <div
            className="w-full h-full flex items-center justify-center relative"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
          >
            <div
              className="relative"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.2s ease-out'
              }}
            >
              <img
                ref={imageRef}
                src={chart.url}
                alt={chart.description || `${chart.type} chart`}
                className="max-w-full max-h-full object-contain select-none"
                draggable={false}
              />
              
              {/* Annotations overlay */}
              {isEditing && (
                <ChartAnnotationTools
                  chart={chart}
                  onAnnotationUpdate={onAnnotationUpdate}
                  showAnnotations={showAnnotations}
                  zoom={zoom}
                  position={position}
                />
              )}
              
              {/* Static annotations display */}
              {!isEditing && showAnnotations && chart.annotations && (
                <div className="absolute inset-0">
                  {chart.annotations.map((annotation) => (
                    <div
                      key={annotation.id}
                      className="absolute pointer-events-none"
                      style={{
                        left: `${annotation.coordinates.x1}%`,
                        top: `${annotation.coordinates.y1}%`,
                        width: annotation.coordinates.x2 ? `${annotation.coordinates.x2 - annotation.coordinates.x1}%` : 'auto',
                        height: annotation.coordinates.y2 ? `${annotation.coordinates.y2 - annotation.coordinates.y1}%` : 'auto',
                      }}
                    >
                      {annotation.type === 'line' && (
                        <svg className="w-full h-full">
                          <line
                            x1="0"
                            y1="0"
                            x2={annotation.coordinates.x2 ? '100%' : '0'}
                            y2={annotation.coordinates.y2 ? '100%' : '0'}
                            stroke={annotation.style.color}
                            strokeWidth={annotation.style.thickness || 2}
                            opacity={annotation.style.opacity || 1}
                          />
                        </svg>
                      )}
                      
                      {annotation.type === 'rectangle' && (
                        <div
                          className="w-full h-full border-2"
                          style={{
                            borderColor: annotation.style.color,
                            opacity: annotation.style.opacity || 1,
                          }}
                        />
                      )}
                      
                      {annotation.type === 'text' && annotation.text && (
                        <div
                          className="text-sm font-medium px-2 py-1 rounded bg-background/80"
                          style={{
                            color: annotation.style.color,
                            opacity: annotation.style.opacity || 1,
                          }}
                        >
                          {annotation.text}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer with chart info */}
        {chart.description && (
          <div className="p-4 border-t bg-background">
            <p className="text-sm text-muted-foreground">
              {chart.description}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Uploaded: {new Date(chart.uploadedAt).toLocaleString()}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};