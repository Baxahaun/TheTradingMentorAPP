import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ReportTemplate, ReportSection, ReportStyling } from '../../types/export';
import { StrategyExportService } from '../../services/StrategyExportService';
import { Palette, Type, Layout } from 'lucide-react';

interface TemplateCustomizerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTemplateCreated: (template: ReportTemplate) => void;
  baseTemplate?: ReportTemplate;
}

export const TemplateCustomizer: React.FC<TemplateCustomizerProps> = ({
  open,
  onOpenChange,
  onTemplateCreated,
  baseTemplate
}) => {
  const exportService = new StrategyExportService();
  const defaultTemplate = exportService.getAvailableTemplates()[0];
  
  const [templateName, setTemplateName] = useState(baseTemplate?.name || '');
  const [sections, setSections] = useState<ReportSection[]>(
    baseTemplate?.sections || defaultTemplate.sections
  );
  const [styling, setStyling] = useState<ReportStyling>(
    baseTemplate?.styling || defaultTemplate.styling
  );

  const handleSectionToggle = (index: number, enabled: boolean) => {
    setSections(prev => prev.map((section, i) => 
      i === index ? { ...section, enabled } : section
    ));
  };

  const handleSectionTitleChange = (index: number, title: string) => {
    setSections(prev => prev.map((section, i) => 
      i === index ? { ...section, title } : section
    ));
  };

  const handleStylingChange = (key: keyof ReportStyling, value: any) => {
    setStyling(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (!templateName.trim()) {
      return;
    }

    const customTemplate = exportService.createCustomTemplate(
      templateName,
      sections,
      styling
    );

    onTemplateCreated(customTemplate);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            Customize Report Template
          </DialogTitle>
          <DialogDescription>
            Create a custom template for your strategy reports.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Name */}
          <div className="space-y-2">
            <Label htmlFor="templateName">Template Name</Label>
            <Input
              id="templateName"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Enter template name"
            />
          </div>

          {/* Sections Configuration */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Report Sections</Label>
            <div className="space-y-3">
              {sections.map((section, index) => (
                <div key={section.type} className="flex items-center space-x-4 p-3 border rounded-lg">
                  <Checkbox
                    checked={section.enabled}
                    onCheckedChange={(checked) => handleSectionToggle(index, !!checked)}
                  />
                  <div className="flex-1">
                    <Input
                      value={section.title}
                      onChange={(e) => handleSectionTitleChange(index, e.target.value)}
                      placeholder="Section title"
                      disabled={!section.enabled}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {section.type}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Styling Configuration */}
          <div className="space-y-4">
            <Label className="text-base font-medium flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Styling Options
            </Label>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <Input
                  id="primaryColor"
                  type="color"
                  value={styling.primaryColor}
                  onChange={(e) => handleStylingChange('primaryColor', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Secondary Color</Label>
                <Input
                  id="secondaryColor"
                  type="color"
                  value={styling.secondaryColor}
                  onChange={(e) => handleStylingChange('secondaryColor', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fontFamily">Font Family</Label>
                <Select
                  value={styling.fontFamily}
                  onValueChange={(value) => handleStylingChange('fontFamily', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Arial">Arial</SelectItem>
                    <SelectItem value="Helvetica">Helvetica</SelectItem>
                    <SelectItem value="Times">Times New Roman</SelectItem>
                    <SelectItem value="Courier">Courier New</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fontSize">Font Size</Label>
                <Select
                  value={styling.fontSize.toString()}
                  onValueChange={(value) => handleStylingChange('fontSize', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10pt</SelectItem>
                    <SelectItem value="11">11pt</SelectItem>
                    <SelectItem value="12">12pt</SelectItem>
                    <SelectItem value="14">14pt</SelectItem>
                    <SelectItem value="16">16pt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeHeader"
                  checked={styling.includeHeader}
                  onCheckedChange={(checked) => handleStylingChange('includeHeader', !!checked)}
                />
                <Label htmlFor="includeHeader">Include Header</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeFooter"
                  checked={styling.includeFooter}
                  onCheckedChange={(checked) => handleStylingChange('includeFooter', !!checked)}
                />
                <Label htmlFor="includeFooter">Include Footer</Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!templateName.trim()}>
            Save Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};