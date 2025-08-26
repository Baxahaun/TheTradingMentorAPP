import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { ProfessionalStrategy } from '../../types/strategy';
import { Trade } from '../../types/trade';
import { ReportTemplate } from '../../types/export';
import { ExportDialog } from './ExportDialog';
import { TemplateCustomizer } from './TemplateCustomizer';
import { SecureShareDialog } from './SecureShareDialog';
import { 
  Download, 
  FileText, 
  Table, 
  Share2, 
  Settings, 
  Printer,
  Shield
} from 'lucide-react';

interface ExportPanelProps {
  strategy: ProfessionalStrategy;
  trades: Trade[];
  className?: string;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({
  strategy,
  trades,
  className
}) => {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showTemplateCustomizer, setShowTemplateCustomizer] = useState(false);
  const [showSecureShare, setShowSecureShare] = useState(false);
  const [customTemplates, setCustomTemplates] = useState<ReportTemplate[]>([]);

  const handleTemplateCreated = (template: ReportTemplate) => {
    setCustomTemplates(prev => [...prev, template]);
  };

  const exportActions = [
    {
      id: 'pdf-report',
      title: 'PDF Report',
      description: 'Comprehensive strategy analysis',
      icon: FileText,
      color: 'text-red-600',
      action: () => setShowExportDialog(true)
    },
    {
      id: 'csv-data',
      title: 'CSV Export',
      description: 'Raw data for analysis',
      icon: Table,
      color: 'text-green-600',
      action: () => setShowExportDialog(true)
    },
    {
      id: 'printable',
      title: 'Print Summary',
      description: 'Quick printable overview',
      icon: Printer,
      color: 'text-blue-600',
      action: () => {
        // Quick print action
        window.print();
      }
    },
    {
      id: 'secure-share',
      title: 'Secure Share',
      description: 'Time-limited sharing link',
      icon: Shield,
      color: 'text-purple-600',
      action: () => setShowSecureShare(true)
    }
  ];

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export & Sharing
          </CardTitle>
          <CardDescription>
            Export your strategy performance data or share securely with others.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            {exportActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.id}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-muted/50"
                  onClick={action.action}
                >
                  <Icon className={`h-6 w-6 ${action.color}`} />
                  <div className="text-center">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {action.description}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>

          {/* Advanced Options */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Advanced Options</h4>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTemplateCustomizer(true)}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Custom Template
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSecureShare(true)}
                className="flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                Secure Share
              </Button>
            </div>
          </div>

          {/* Strategy Summary */}
          <div className="pt-4 border-t">
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Strategy:</span>
                <span className="font-medium">{strategy.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Trades:</span>
                <span className="font-medium">{trades.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Win Rate:</span>
                <span className="font-medium">
                  {(strategy.performance.winRate * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Profit Factor:</span>
                <span className="font-medium">
                  {strategy.performance.profitFactor.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        strategy={strategy}
        trades={trades}
      />

      <TemplateCustomizer
        open={showTemplateCustomizer}
        onOpenChange={setShowTemplateCustomizer}
        onTemplateCreated={handleTemplateCreated}
      />

      <SecureShareDialog
        open={showSecureShare}
        onOpenChange={setShowSecureShare}
        strategy={strategy}
        trades={trades}
      />
    </div>
  );
};