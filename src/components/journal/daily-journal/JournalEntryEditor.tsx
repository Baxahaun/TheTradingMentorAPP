import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { BookOpen, Save, Loader2 } from 'lucide-react';
import RichTextEditor from '../../ui/RichTextEditor';
import { dailyJournalService, DailyJournalEntry } from '../../../lib/journalService';
import { useToast } from '../../ui/use-toast';

interface JournalEntryEditorProps {
  selectedDate: Date | null;
  userId: string; // We'll need to pass this from the parent component
}

const JournalEntryEditor: React.FC<JournalEntryEditorProps> = ({
  selectedDate,
  userId
}) => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasEntry, setHasEntry] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const { toast } = useToast();

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  const formatDisplayDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Load journal entry when date changes
  useEffect(() => {
    if (!selectedDate || !userId) return;

    const loadJournalEntry = async () => {
      setIsLoading(true);
      try {
        const dateStr = formatDate(selectedDate);
        const entry = await dailyJournalService.getJournalEntry(userId, dateStr);
        
        if (entry) {
          setContent(entry.content);
          setHasEntry(true);
        } else {
          setContent('');
          setHasEntry(false);
        }
      } catch (error) {
        console.error('Error loading journal entry:', error);
        toast({
          title: "Error",
          description: "Failed to load journal entry. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadJournalEntry();
  }, [selectedDate, userId, toast]);

  // Auto-save functionality with debouncing
  const saveEntry = useCallback(async (contentToSave: string) => {
    if (!selectedDate || !userId) return;

    setIsSaving(true);
    try {
      const dateStr = formatDate(selectedDate);
      await dailyJournalService.saveJournalEntry(userId, dateStr, contentToSave);
      setHasEntry(contentToSave.trim().length > 0);
      setLastSaved(new Date());
      
      if (contentToSave.trim().length > 0) {
        toast({
          title: "Saved",
          description: "Journal entry saved successfully.",
        });
      }
    } catch (error) {
      console.error('Error saving journal entry:', error);
      toast({
        title: "Error",
        description: "Failed to save journal entry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [selectedDate, userId, toast]);

  // Debounced auto-save
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (content !== '') {
        saveEntry(content);
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timeoutId);
  }, [content, saveEntry]);

  const handleManualSave = () => {
    saveEntry(content);
  };

  if (!selectedDate) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Journal Entry
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select a date to start journaling</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Journal Entry for {formatDisplayDate(selectedDate)}
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasEntry && (
              <Badge variant="secondary" className="text-xs">
                {hasEntry ? 'Has Entry' : 'No Entry'}
              </Badge>
            )}
            <Button
              onClick={handleManualSave}
              disabled={isSaving}
              size="sm"
              variant="outline"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save
            </Button>
          </div>
        </div>
        {lastSaved && (
          <p className="text-xs text-muted-foreground">
            Last saved: {lastSaved.toLocaleTimeString()}
          </p>
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading journal entry...
            </div>
          </div>
        ) : (
          <div className="flex-1 p-6">
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder={`What happened in your trading day on ${formatDisplayDate(selectedDate)}? Share your thoughts, lessons learned, and reflections...`}
              className="h-full"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default JournalEntryEditor;
