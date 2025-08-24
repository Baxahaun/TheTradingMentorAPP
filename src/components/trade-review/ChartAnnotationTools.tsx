import React, { useState, useRef, useCallback } from 'react';
import { 
  Minus, 
  Square, 
  Type, 
  ArrowRight, 
  Palette, 
  Trash2, 
  Undo,
  Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { TradeChart, ChartAnnotation } from '@/types/tradeReview';
import { toast } from '@/components/ui/use-toast';

interface ChartAnnotationToolsProps {
  chart: TradeChart;
  onAnnotationUpdate: (chartId: string, annotations: ChartAnnotation[]) => void;
  showAnnotations: boolean;
  zoom: number;
  position: { x: number; y: number };
}

type AnnotationType = 'line' | 'rectangle' | 'text' | 'arrow';

interface DrawingState {
  isDrawing: boolean;
  startPoint: { x: number; y: number } | null;
  currentAnnotation: Partial<ChartAnnotation> | null;
}

const DEFAULT_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#ffffff', // white
  '#000000', // black
];

export const ChartAnnotationTools: React.FC<ChartAnnotationToolsProps> = ({
  chart,
  onAnnotationUpdate,
  showAnnotations,
  zoom,
  position
}) => {
  const [selectedTool, setSelectedTool] = useState<AnnotationType | null>(null);
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    startPoint: null,
    currentAnnotation: null
  });
  const [annotationStyle, setAnnotationStyle] = useState({
    color: '#ef4444',
    thickness: 2,
    opacity: 1
  });
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);

  const annotations = chart.annotations || [];

  // Convert screen coordinates to percentage coordinates
  const screenToPercent = useCallback((clientX: number, clientY: number) => {
    if (!overlayRef.current) return { x: 0, y: 0 };
    
    const rect = overlayRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    
    return { 
      x: Math.max(0, Math.min(100, x)), 
      y: Math.max(0, Math.min(100, y)) 
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!selectedTool) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const point = screenToPercent(e.clientX, e.clientY);
    
    if (selectedTool === 'text') {
      setTextPosition(point);
      setShowTextInput(true);
      return;
    }
    
    setDrawingState({
      isDrawing: true,
      startPoint: point,
      currentAnnotation: {
        id: `annotation-${Date.now()}`,
        type: selectedTool,
        coordinates: {
          x1: point.x,
          y1: point.y
        },
        style: annotationStyle,
        timestamp: new Date().toISOString()
      }
    });
  }, [selectedTool, screenToPercent, annotationStyle]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!drawingState.isDrawing || !drawingState.startPoint || !drawingState.currentAnnotation) return;
    
    const point = screenToPercent(e.clientX, e.clientY);
    
    setDrawingState(prev => ({
      ...prev,
      currentAnnotation: prev.currentAnnotation ? {
        ...prev.currentAnnotation,
        coordinates: {
          ...prev.currentAnnotation.coordinates!,
          x2: point.x,
          y2: point.y
        }
      } : null
    }));
  }, [drawingState.isDrawing, drawingState.startPoint, drawingState.currentAnnotation, screenToPercent]);

  const handleMouseUp = useCallback(() => {
    if (!drawingState.isDrawing || !drawingState.currentAnnotation) return;
    
    const newAnnotation = drawingState.currentAnnotation as ChartAnnotation;
    const updatedAnnotations = [...annotations, newAnnotation];
    
    onAnnotationUpdate(chart.id, updatedAnnotations);
    
    setDrawingState({
      isDrawing: false,
      startPoint: null,
      currentAnnotation: null
    });
    
    toast({
      title: 'Annotation Added',
      description: `${selectedTool} annotation has been added to the chart`
    });
  }, [drawingState, annotations, chart.id, onAnnotationUpdate, selectedTool]);

  const handleTextSubmit = useCallback(() => {
    if (!textInput.trim()) {
      setShowTextInput(false);
      setTextInput('');
      return;
    }
    
    const textAnnotation: ChartAnnotation = {
      id: `annotation-${Date.now()}`,
      type: 'text',
      coordinates: {
        x1: textPosition.x,
        y1: textPosition.y
      },
      style: annotationStyle,
      text: textInput.trim(),
      timestamp: new Date().toISOString()
    };
    
    const updatedAnnotations = [...annotations, textAnnotation];
    onAnnotationUpdate(chart.id, updatedAnnotations);
    
    setShowTextInput(false);
    setTextInput('');
    
    toast({
      title: 'Text Annotation Added',
      description: 'Text annotation has been added to the chart'
    });
  }, [textInput, textPosition, annotationStyle, annotations, chart.id, onAnnotationUpdate]);

  const handleDeleteAnnotation = useCallback((annotationId: string) => {
    const updatedAnnotations = annotations.filter(a => a.id !== annotationId);
    onAnnotationUpdate(chart.id, updatedAnnotations);
    
    toast({
      title: 'Annotation Deleted',
      description: 'Annotation has been removed from the chart'
    });
  }, [annotations, chart.id, onAnnotationUpdate]);

  const handleClearAll = useCallback(() => {
    onAnnotationUpdate(chart.id, []);
    
    toast({
      title: 'All Annotations Cleared',
      description: 'All annotations have been removed from the chart'
    });
  }, [chart.id, onAnnotationUpdate]);

  const renderAnnotation = (annotation: ChartAnnotation) => {
    const style = {
      left: `${annotation.coordinates.x1}%`,
      top: `${annotation.coordinates.y1}%`,
      width: annotation.coordinates.x2 ? `${Math.abs(annotation.coordinates.x2 - annotation.coordinates.x1)}%` : 'auto',
      height: annotation.coordinates.y2 ? `${Math.abs(annotation.coordinates.y2 - annotation.coordinates.y1)}%` : 'auto',
    };

    return (
      <div
        key={annotation.id}
        className="absolute group"
        style={style}
      >
        {annotation.type === 'line' && (
          <svg className="w-full h-full">
            <line
              x1="0"
              y1="0"
              x2="100%"
              y2="100%"
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
            className="text-sm font-medium px-2 py-1 rounded bg-background/80 whitespace-nowrap"
            style={{
              color: annotation.style.color,
              opacity: annotation.style.opacity || 1,
            }}
          >
            {annotation.text}
          </div>
        )}
        
        {annotation.type === 'arrow' && (
          <svg className="w-full h-full">
            <defs>
              <marker
                id={`arrowhead-${annotation.id}`}
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill={annotation.style.color}
                />
              </marker>
            </defs>
            <line
              x1="0"
              y1="0"
              x2="100%"
              y2="100%"
              stroke={annotation.style.color}
              strokeWidth={annotation.style.thickness || 2}
              opacity={annotation.style.opacity || 1}
              markerEnd={`url(#arrowhead-${annotation.id})`}
            />
          </svg>
        )}
        
        {/* Delete button */}
        <Button
          size="sm"
          variant="destructive"
          className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => handleDeleteAnnotation(annotation.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    );
  };

  return (
    <>
      {/* Annotation overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0 cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ pointerEvents: selectedTool ? 'auto' : 'none' }}
      >
        {/* Existing annotations */}
        {showAnnotations && annotations.map(renderAnnotation)}
        
        {/* Current drawing annotation */}
        {drawingState.currentAnnotation && (
          <div className="absolute opacity-70">
            {renderAnnotation(drawingState.currentAnnotation as ChartAnnotation)}
          </div>
        )}
      </div>

      {/* Text input modal */}
      {showTextInput && (
        <div
          className="absolute z-50 bg-background border rounded-lg p-3 shadow-lg"
          style={{
            left: `${textPosition.x}%`,
            top: `${textPosition.y}%`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="flex items-center gap-2">
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter text..."
              className="w-40"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTextSubmit();
                if (e.key === 'Escape') {
                  setShowTextInput(false);
                  setTextInput('');
                }
              }}
            />
            <Button size="sm" onClick={handleTextSubmit}>
              <Save className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Annotation toolbar */}
      <div className="absolute top-4 left-4 bg-background border rounded-lg p-2 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          {/* Drawing tools */}
          <div className="flex border rounded">
            <Button
              size="sm"
              variant={selectedTool === 'line' ? 'default' : 'ghost'}
              onClick={() => setSelectedTool(selectedTool === 'line' ? null : 'line')}
              className="rounded-r-none"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={selectedTool === 'rectangle' ? 'default' : 'ghost'}
              onClick={() => setSelectedTool(selectedTool === 'rectangle' ? null : 'rectangle')}
              className="rounded-none"
            >
              <Square className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={selectedTool === 'arrow' ? 'default' : 'ghost'}
              onClick={() => setSelectedTool(selectedTool === 'arrow' ? null : 'arrow')}
              className="rounded-none"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={selectedTool === 'text' ? 'default' : 'ghost'}
              onClick={() => setSelectedTool(selectedTool === 'text' ? null : 'text')}
              className="rounded-l-none"
            >
              <Type className="h-4 w-4" />
            </Button>
          </div>

          {/* Color picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline">
                <div
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: annotationStyle.color }}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48">
              <div className="space-y-3">
                <Label>Color</Label>
                <div className="grid grid-cols-5 gap-2">
                  {DEFAULT_COLORS.map((color) => (
                    <button
                      key={color}
                      className="w-8 h-8 rounded border-2 hover:scale-110 transition-transform"
                      style={{ 
                        backgroundColor: color,
                        borderColor: annotationStyle.color === color ? '#000' : 'transparent'
                      }}
                      onClick={() => setAnnotationStyle(prev => ({ ...prev, color }))}
                    />
                  ))}
                </div>
                
                <div className="space-y-2">
                  <Label>Thickness</Label>
                  <Slider
                    value={[annotationStyle.thickness]}
                    onValueChange={([thickness]) => setAnnotationStyle(prev => ({ ...prev, thickness }))}
                    min={1}
                    max={10}
                    step={1}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Opacity</Label>
                  <Slider
                    value={[annotationStyle.opacity * 100]}
                    onValueChange={([opacity]) => setAnnotationStyle(prev => ({ ...prev, opacity: opacity / 100 }))}
                    min={10}
                    max={100}
                    step={10}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Clear all */}
          {annotations.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleClearAll}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {selectedTool && (
          <p className="text-xs text-muted-foreground">
            {selectedTool === 'text' ? 'Click to add text' : 'Click and drag to draw'}
          </p>
        )}
      </div>
    </>
  );
};