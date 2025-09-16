import React from 'react';
import { LayoutGrid, Plus } from 'lucide-react';
import { Button } from './button';

interface DashboardEmptyStateProps {
  onAddWidget: () => void;
}

const DashboardEmptyState: React.FC<DashboardEmptyStateProps> = ({ onAddWidget }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-lg border-2 border-dashed border-slate-200 text-center p-8 transition-colors hover:border-slate-300">
      <div className="bg-white p-4 rounded-full mb-6 shadow-sm border border-slate-100">
        <LayoutGrid className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="text-xl font-semibold text-slate-700 mb-2">Your dashboard is empty</h3>
      <p className="text-sm text-slate-500 mb-6 max-w-sm leading-relaxed">
        Get started by adding a widget to display your trading analytics and performance metrics.
      </p>
      <Button onClick={onAddWidget} className="shadow-sm">
        <Plus className="-ml-1 mr-2 h-4 w-4" />
        Add a Widget
      </Button>
    </div>
  );
};

export default DashboardEmptyState;
