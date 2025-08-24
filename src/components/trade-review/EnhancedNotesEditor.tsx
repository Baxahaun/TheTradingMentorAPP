/**
 * Enhanced Notes Editor Component
 * Provides advanced note-taking with multiple categories, templates, and rich formatting
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Trade } from '../../types/trade';
import { TradeNotes, NoteTemplate, NoteVersion } from '../../types/tradeReview';
import noteManagementService from '../../lib/noteManagementService';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';
import { 
  FileText, 
  History, 
  Layout, 
  Save, 
  RotateCcw,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Copy,
  Trash2,
  Plus
} from 'lucide-react';
import { toast } from '../ui/use-toast';

interface EnhancedNotesEditorProps {
  trade: Trade;
  isEditing: boolean;
  onNotesChange: (notes: TradeNotes) => void;
  className?: string;
}

const EnhancedNotesEditor: React.FC<EnhancedNotesEditorProps> = ({
  trade,
  isEditing,
  onNotesChange,
  className = ''
}) => {
  const [notes, setNotes] = useState<TradeNotes>({
    preTradeAnalysis: '',
    executionNotes: '',
    postTradeReflection: '',
    lessonsLearned: '',
    generalNotes: '',
    lastModified: new Date().toISOString(),
    version: 1
  });
  
  const [templates, setTemplates] = useState<NoteTemplate[]>([]);
  const [noteHistory, setNoteHistory] = useState<NoteVersion[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('preTradeAnalysis');
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [noteStats, setNoteStats] = useState({
    totalVersions: 0,
    totalCharacters: 0,
    lastModified: '',
    completionScore: 0
  });

  // Load initial data
  useEffect(() => {
    loadNotes();
    loadTemplates();
    loadNoteStats();
  }, [trade.id]);

  // Load existing notes
  const loadNotes = useCallback(async () => {
    try {
      setIsLoading(true);
      const existingNotes = await noteManagementService.getLatestNotes(trade.id);
      if (existingNotes) {
        setNotes(existingNotes);
        onNotesChange(existingNotes);
      }
      
      const history = await noteManagementService.getNoteHistory(trade.id);
      setNoteHistory(history);
    } catch (error) {
      console.error('Error loading notes:', error);
      toast({
        title: "Error",
        description: "Failed to load notes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [trade.id, onNotesChange]);

  // Load templates
  const loadTemplates = useCallback(async () => {
    try {
      const availableTemplates = noteManagementService.getTemplates();
      setTemplates(availableTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  }, []);

  // Load note statistics
  const loadNoteStats = useCallback(async () => {
    try {
      const stats = await noteManagementService.getNoteStatistics(trade.id);
      setNoteStats(stats);
    } catch (error) {
      console.error('Error loading note stats:', error);
    }
  }, [trade.id]);

  // Handle note changes
  const handleNoteChange = (field: keyof TradeNotes, value: string) => {
    const updatedNotes = {
      ...notes,
      [field]: value,
      lastModified: new Date().toISOString(),
      version: notes.version + 1
    };
    
    setNotes(updatedNotes);
    onNotesChange(updatedNotes);
  };

  // Save notes
  const handleSaveNotes = async () => {
    try {
      setIsLoading(true);
      await noteManagementService.saveNotes(trade.id, notes);
      await loadNoteStats();
      
      toast({
        title: "Success",
        description: "Notes saved successfully",
      });
    } catch (error) {
      console.error('Error saving notes:', error);
      toast({
        title: "Error",
        description: "Failed to save notes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Apply template
  const handleApplyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    const updatedNotes = noteManagementService.applyTemplate(template, notes);
    setNotes(updatedNotes);
    onNotesChange(updatedNotes);
    setSelectedTemplate('');
    setShowTemplates(false);
    
    toast({
      title: "Template Applied",
      description: `Applied "${template.name}" template`,
    });
  };

  // Revert to previous version
  const handleRevertToVersion = (version: NoteVersion) => {
    setNotes(version.content);
    onNotesChange(version.content);
    setShowHistory(false);
    
    toast({
      title: "Version Restored",
      description: `Reverted to version ${version.version}`,
    });
  };

  // Get completion status for each section
  const getSectionStatus = (field: keyof TradeNotes): 'empty' | 'partial' | 'complete' => {
    const value = notes[field];
    if (!value || (typeof value === 'string' && value.trim().length === 0)) return 'empty';
    if (typeof value === 'string' && value.trim().length < 50) return 'partial';
    return 'complete';
  };

  // Get status icon
  const getStatusIcon = (status: 'empty' | 'partial' | 'complete') => {
    switch (status) {
      case 'empty':
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
      case 'partial':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'complete':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    }
  };

  // Note sections configuration
  const noteSections = [
    {
      id: 'preTradeAnalysis',
      label: 'Pre-Trade Analysis',
      description: 'Market analysis, setup identification, and entry planning',
      placeholder: 'Document your market analysis, key levels, confluence factors, and entry reasoning...'
    },
    {
      id: 'executionNotes',
      label: 'Execution Notes',
      description: 'Trade execution details and real-time observations',
      placeholder: 'Record execution quality, fill details, slippage, and market conditions during entry/exit...'
    },
    {
      id: 'postTradeReflection',
      label: 'Post-Trade Reflection',
      description: 'Trade outcome analysis and performance review',
      placeholder: 'Analyze the trade outcome, what went well, what could be improved, and market behavior...'
    },
    {
      id: 'lessonsLearned',
      label: 'Lessons Learned',
      description: 'Key takeaways and insights for future improvement',
      placeholder: 'Document key lessons, insights, and actionable improvements for future trades...'
    },
    {
      id: 'generalNotes',
      label: 'General Notes',
      description: 'Additional observations and miscellaneous notes',
      placeholder: 'Any additional thoughts, observations, or notes about this trade...'
    }
  ] as const;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading notes...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-600" />
            Enhanced Trade Notes
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Completion Score */}
            <Badge variant="outline" className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {noteStats.completionScore}% Complete
            </Badge>
            
            {/* Templates Button */}
            <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Layout className="w-4 h-4 mr-1" />
                  Templates
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Note Templates</DialogTitle>
                  <DialogDescription>
                    Choose a template to structure your trade notes
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3 py-4">
                  {templates.map((template) => (
                    <div key={template.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{template.name}</h4>
                        <p className="text-sm text-gray-600">{template.description}</p>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {template.category}
                        </Badge>
                      </div>
                      <Button
                        onClick={() => handleApplyTemplate(template.id)}
                        size="sm"
                      >
                        Apply
                      </Button>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
            
            {/* History Button */}
            <Dialog open={showHistory} onOpenChange={setShowHistory}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <History className="w-4 h-4 mr-1" />
                  History ({noteHistory.length})
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Note History</DialogTitle>
                  <DialogDescription>
                    View and restore previous versions of your notes
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {noteHistory.map((version) => (
                    <div key={version.version} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Version {version.version}</Badge>
                          <span className="text-sm text-gray-600">
                            {new Date(version.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <RotateCcw className="w-4 h-4 mr-1" />
                              Restore
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Restore Version {version.version}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will replace your current notes with version {version.version}. 
                                Your current changes will be lost unless saved first.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleRevertToVersion(version)}>
                                Restore
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                      <div className="text-sm text-gray-600">
                        Changes: {version.changes.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
            
            {/* Save Button */}
            {isEditing && (
              <Button onClick={handleSaveNotes} size="sm">
                <Save className="w-4 h-4 mr-1" />
                Save
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 rounded-none border-b">
            {noteSections.map((section) => {
              const status = getSectionStatus(section.id as keyof TradeNotes);
              return (
                <TabsTrigger
                  key={section.id}
                  value={section.id}
                  className="flex items-center gap-2 data-[state=active]:bg-blue-50"
                >
                  {getStatusIcon(status)}
                  <span className="hidden sm:inline">{section.label}</span>
                  <span className="sm:hidden">{section.label.split(' ')[0]}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
          
          {noteSections.map((section) => (
            <TabsContent key={section.id} value={section.id} className="p-6 space-y-4">
              <div>
                <Label className="text-base font-semibold text-gray-900">
                  {section.label}
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  {section.description}
                </p>
              </div>
              
              {isEditing ? (
                <Textarea
                  value={notes[section.id as keyof TradeNotes] as string || ''}
                  onChange={(e) => handleNoteChange(section.id as keyof TradeNotes, e.target.value)}
                  placeholder={section.placeholder}
                  className="min-h-[300px] resize-none"
                />
              ) : (
                <div className="bg-gray-50 p-4 rounded-md border min-h-[300px]">
                  <div className="text-gray-900 whitespace-pre-wrap">
                    {(notes[section.id as keyof TradeNotes] as string) || 
                     `No ${section.label.toLowerCase()} notes available.`}
                  </div>
                </div>
              )}
              
              {/* Character count */}
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>
                  {((notes[section.id as keyof TradeNotes] as string) || '').length} characters
                </span>
                <span>
                  Last modified: {new Date(notes.lastModified).toLocaleString()}
                </span>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default EnhancedNotesEditor;