import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  X, 
  Edit3, 
  Save, 
  Trash2,
  Grid3X3,
  List,
  Filter,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { TradeChart, ChartAnnotation } from '@/types/tradeReview';
import { chartUploadService } from '@/lib/chartUploadService';
import { ChartAnnotationTools } from './ChartAnnotationTools';
import { ChartViewerDialog } from './ChartViewerDialog';
import { ChartEditorDialog } from './ChartEditorDialog';
import { LazyChartImage, ChartThumbnail } from './LazyChartImage';
import { VirtualizedChartGallery } from './VirtualizedList';
import { useMemoryManagement, useDebouncedCallback, usePerformanceMonitor } from '@/lib/performanceOptimization';

interface ChartGalleryManagerProps {
  tradeId: string;
  charts: TradeChart[];
  isEditing: boolean;
  onChartsChange: (charts: TradeChart[]) => void;
}

type ViewMode = 'grid' | 'list';
type ChartType = 'all' | 'entry' | 'exit' | 'analysis' | 'post_mortem';

export const ChartGalleryManager: React.FC<ChartGalleryManagerProps> = ({
  tradeId,
  charts,
  isEditing,
  onChartsChange
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterType, setFilterType] = useState<ChartType>('all');
  const [selectedChart, setSelectedChart] = useState<TradeChart | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingChart, setEditingChart] = useState<TradeChart | null>(null);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [useVirtualization, setUseVirtualization] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Performance monitoring
  const { renderTime } = usePerformanceMonitor('ChartGalleryManager');
  
  // Memory management
  const { cleanup } = useMemoryManagement();
  
  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Memoized filtered charts for performance
  const filteredCharts = useMemo(() => 
    charts.filter(chart => filterType === 'all' || chart.type === filterType),
    [charts, filterType]
  );

  // Group charts by timeframe for better organization
  const chartsByTimeframe = useMemo(() => 
    filteredCharts.reduce((acc, chart) => {
      const timeframe = chart.timeframe || 'Unknown';
      if (!acc[timeframe]) acc[timeframe] = [];
      acc[timeframe].push(chart);
      return acc;
    }, {} as Record<string, TradeChart[]>),
    [filteredCharts]
  );

  // Determine if virtualization should be used based on chart count
  useEffect(() => {
    setUseVirtualization(filteredCharts.length > 20);
  }, [filteredCharts.length]);

  // Debounced file upload for better performance
  const handleFileUpload = useDebouncedCallback(async (files: FileList) => {
    if (!files.length) return;

    setIsUploading(true);
    const uploadPromises = Array.from(files).map(async (file) => {
      try {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`Invalid file type: ${file.type}`);
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error('File size too large (max 10MB)');
        }

        const uploadedChart = await chartUploadService.uploadChart(tradeId, file);
        return uploadedChart;
      } catch (error) {
        console.error('Upload error:', error);
        toast({
          title: 'Upload Failed',
          description: `Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: 'destructive'
        });
        return null;
      }
    });

    try {
      const uploadedCharts = await Promise.all(uploadPromises);
      const validCharts = uploadedCharts.filter((chart): chart is TradeChart => chart !== null);
      
      if (validCharts.length > 0) {
        onChartsChange([...charts, ...validCharts]);
        toast({
          title: 'Upload Successful',
          description: `${validCharts.length} chart(s) uploaded successfully`
        });
      }
    } catch (error) {
      console.error('Batch upload error:', error);
      toast({
        title: 'Upload Error',
        description: 'Some files failed to upload',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  }, 300);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!isEditing) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, [isEditing, handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDeleteChart = useCallback(async (chartId: string) => {
    try {
      await chartUploadService.deleteChart(tradeId, chartId);
      const updatedCharts = charts.filter(chart => chart.id !== chartId);
      onChartsChange(updatedCharts);
      
      toast({
        title: 'Chart Deleted',
        description: 'Chart has been successfully deleted'
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete chart',
        variant: 'destructive'
      });
    }
  }, [tradeId, charts, onChartsChange]);

  const handleUpdateChart = useCallback(async (updatedChart: TradeChart) => {
    try {
      await chartUploadService.updateChart(tradeId, updatedChart);
      const updatedCharts = charts.map(chart => 
        chart.id === updatedChart.id ? updatedChart : chart
      );
      onChartsChange(updatedCharts);
      setEditingChart(null);
      
      toast({
        title: 'Chart Updated',
        description: 'Chart details have been updated'
      });
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update chart',
        variant: 'destructive'
      });
    }
  }, [tradeId, charts, onChartsChange]);

  const handleAnnotationUpdate = useCallback((chartId: string, annotations: ChartAnnotation[]) => {
    const updatedCharts = charts.map(chart => 
      chart.id === chartId ? { ...chart, annotations } : chart
    );
    onChartsChange(updatedCharts);
  }, [charts, onChartsChange]);

  const renderChartCard = useCallback((chart: TradeChart) => (
    <Card key={chart.id} className="group relative overflow-hidden">
      <CardContent className="p-0">
        <div className="relative aspect-video bg-muted">
          <ChartThumbnail
            src={chart.url}
            alt={chart.description || `${chart.type} chart`}
            className="w-full h-full cursor-pointer transition-transform group-hover:scale-105"
            onClick={() => setSelectedChart(chart)}
          />
          
          {/* Chart type badge */}
          <Badge 
            variant="secondary" 
            className="absolute top-2 left-2 capitalize"
          >
            {chart.type.replace('_', ' ')}
          </Badge>
          
          {/* Timeframe badge */}
          <Badge 
            variant="outline" 
            className="absolute top-2 right-2 bg-background/80"
          >
            {chart.timeframe}
          </Badge>
          
          {/* Action buttons overlay */}
          {isEditing && (
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setEditingChart(chart)}
                aria-label="Edit chart"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setSelectedChart(chart)}
                aria-label="View chart"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDeleteChart(chart.id)}
                aria-label="Delete chart"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {/* Annotation indicator */}
          {chart.annotations && chart.annotations.length > 0 && (
            <div className="absolute bottom-2 left-2">
              <Badge variant="outline" className="bg-background/80">
                <Edit3 className="h-3 w-3 mr-1" />
                {chart.annotations.length}
              </Badge>
            </div>
          )}
        </div>
        
        {chart.description && (
          <div className="p-3">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {chart.description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  ), []);

  const renderListItem = useCallback((chart: TradeChart) => (
    <Card key={chart.id} className="mb-2">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-muted rounded overflow-hidden flex-shrink-0">
            <ChartThumbnail
              src={chart.url}
              alt={chart.description || `${chart.type} chart`}
              className="w-full h-full cursor-pointer"
              onClick={() => setSelectedChart(chart)}
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="capitalize">
                {chart.type.replace('_', ' ')}
              </Badge>
              <Badge variant="outline">
                {chart.timeframe}
              </Badge>
              {chart.annotations && chart.annotations.length > 0 && (
                <Badge variant="outline">
                  <Edit3 className="h-3 w-3 mr-1" />
                  {chart.annotations.length} annotations
                </Badge>
              )}
            </div>
            
            {chart.description && (
              <p className="text-sm text-muted-foreground mb-2">
                {chart.description}
              </p>
            )}
            
            <p className="text-xs text-muted-foreground">
              Uploaded: {new Date(chart.uploadedAt).toLocaleDateString()}
            </p>
          </div>
          
          {isEditing && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditingChart(chart)}
                aria-label="Edit chart"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedChart(chart)}
                aria-label="View chart"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDeleteChart(chart.id)}
                aria-label="Delete chart"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  ), []);

  return (
    <div className="space-y-4">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">Chart Gallery</h3>
          <Badge variant="outline">
            {filteredCharts.length} chart{filteredCharts.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex border rounded-md">
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
              aria-label="Grid view"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Filter by type */}
          <Select value={filterType} onValueChange={(value: ChartType) => setFilterType(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="entry">Entry</SelectItem>
              <SelectItem value="exit">Exit</SelectItem>
              <SelectItem value="analysis">Analysis</SelectItem>
              <SelectItem value="post_mortem">Post Mortem</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Upload button */}
          {isEditing && (
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          )}
        </div>
      </div>

      {/* Upload area */}
      {isEditing && (
        <div
          className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">Drop chart images here</p>
          <p className="text-sm text-muted-foreground mb-4">
            or click the upload button above. Supports PNG, JPG, GIF (max 10MB each)
          </p>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Choose Files
          </Button>
        </div>
      )}

      {/* Charts display */}
      {filteredCharts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No charts found</h3>
            <p className="text-muted-foreground mb-4">
              {filterType === 'all' 
                ? 'Upload some chart images to get started'
                : `No ${filterType.replace('_', ' ')} charts found`
              }
            </p>
            {isEditing && (
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Charts
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div>
          {useVirtualization ? (
            <VirtualizedChartGallery
              charts={filteredCharts.map(chart => ({
                id: chart.id,
                url: chart.url,
                type: chart.type,
                timeframe: chart.timeframe,
                description: chart.description
              }))}
              onChartClick={(chartId) => {
                const chart = filteredCharts.find(c => c.id === chartId);
                if (chart) setSelectedChart(chart);
              }}
              containerHeight={600}
              itemsPerRow={viewMode === 'grid' ? 3 : 1}
              itemHeight={viewMode === 'grid' ? 200 : 100}
            />
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCharts.map(renderChartCard)}
            </div>
          ) : (
            <div>
              {filteredCharts.map(renderListItem)}
            </div>
          )}
        </div>
      )}

      {/* Performance indicator for development */}
      {process.env.NODE_ENV === 'development' && renderTime > 16 && (
        <div className="mt-2 text-xs text-orange-600">
          Slow render detected: {renderTime.toFixed(2)}ms
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
      />

      {/* Chart viewer dialog */}
      {selectedChart && (
        <ChartViewerDialog
          chart={selectedChart}
          isOpen={!!selectedChart}
          onClose={() => setSelectedChart(null)}
          onAnnotationUpdate={handleAnnotationUpdate}
          showAnnotations={showAnnotations}
          onToggleAnnotations={() => setShowAnnotations(!showAnnotations)}
          isEditing={isEditing}
        />
      )}

      {/* Chart editor dialog */}
      {editingChart && (
        <ChartEditorDialog
          chart={editingChart}
          isOpen={!!editingChart}
          onClose={() => setEditingChart(null)}
          onSave={handleUpdateChart}
        />
      )}
    </div>
  );
};