import React from 'react';
import { Trade } from '../types/trade';

interface PatternPerformanceWidgetProps {
  trades: Trade[];
  size?: { w: number; h: number };
}

const PatternPerformanceWidget: React.FC<PatternPerformanceWidgetProps> = ({ trades, size }) => {
  // Suppress unused variable warnings for now
  void trades;
  void size;

  return (
    <div className="space-y-4 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Pattern Performance</h3>
        </div>
      </div>
      
      <div className="flex items-center justify-center h-[200px] text-muted-foreground">
        <div className="text-center">
          <p>Pattern Performance Widget</p>
          <p className="text-sm">Coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default PatternPerformanceWidget;