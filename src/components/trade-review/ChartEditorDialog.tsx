import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { TradeChart } from '@/types/tradeReview';

interface ChartEditorDialogProps {
  chart: TradeChart;
  isOpen: boolean;
  onClose: () => void;
  onSave: (chart: TradeChart) => void;
}

const CHART_TYPES = [
  { value: 'entry', label: 'Entry' },
  { value: 'exit', label: 'Exit' },
  { value: 'analysis', label: 'Analysis' },
  { value: 'post_mortem', label: 'Post Mortem' }
] as const;

const TIMEFRAMES = [
  '1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M'
];

export const ChartEditorDialog: React.FC<ChartEditorDialogProps> = ({
  chart,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    type: chart.type,
    timeframe: chart.timeframe,
    description: chart.description || ''
  });
  const [isValid, setIsValid] = useState(true);

  // Reset form when chart changes
  useEffect(() => {
    setFormData({
      type: chart.type,
      timeframe: chart.timeframe,
      description: chart.description || ''
    });
  }, [chart]);

  // Validate form
  useEffect(() => {
    const valid = formData.type && formData.timeframe;
    setIsValid(valid);
  }, [formData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    const updatedChart: TradeChart = {
      ...chart,
      type: formData.type,
      timeframe: formData.timeframe,
      description: formData.description.trim() || undefined
    };

    onSave(updatedChart);
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Chart Details</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Chart preview */}
          <div className="aspect-video bg-muted rounded-lg overflow-hidden">
            <img
              src={chart.url}
              alt="Chart preview"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Chart type */}
          <div className="space-y-2">
            <Label htmlFor="chart-type">Chart Type *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleInputChange('type', value)}
            >
              <SelectTrigger id="chart-type">
                <SelectValue placeholder="Select chart type" />
              </SelectTrigger>
              <SelectContent>
                {CHART_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Timeframe */}
          <div className="space-y-2">
            <Label htmlFor="timeframe">Timeframe *</Label>
            <Select
              value={formData.timeframe}
              onValueChange={(value) => handleInputChange('timeframe', value)}
            >
              <SelectTrigger id="timeframe">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                {TIMEFRAMES.map((timeframe) => (
                  <SelectItem key={timeframe} value={timeframe}>
                    {timeframe}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add a description for this chart..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {formData.description.length}/500 characters
            </p>
          </div>

          {/* Upload info */}
          <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
            <p><strong>Uploaded:</strong> {new Date(chart.uploadedAt).toLocaleString()}</p>
            <p><strong>File ID:</strong> {chart.id}</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isValid}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};