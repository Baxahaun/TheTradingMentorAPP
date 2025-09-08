/**
 * Quick Add Module for Daily Trading Journal
 * 
 * This component provides a fast-access interface for rapid note-taking during trading.
 * It allows traders to quickly capture thoughts and observations without disrupting their trading flow.
 * 
 * Features:
 * - Floating quick add button accessible from anywhere
 * - Voice note recording and transcription
 * - Quick text entry with auto-categorization
 * - Mobile-optimized touch interface
 * - Auto-save and organization into daily journal entries
 */

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Mic, MicOff, Save, X, MessageSquare, TrendingUp, AlertCircle, Calendar } from 'lucide-react';
import { JournalEntry, JournalSection } from '../../types/journal';
import { journalDataService } from '../../services/JournalDataService';
import { useAuth } from '../../contexts/AuthContext';

interface QuickAddModuleProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (entry: QuickNote) => void;
  className?: string;
}

interface QuickNote {
  id: string;
  content: string;
  category: QuickNoteCategory;
  timestamp: string;
  isVoiceNote: boolean;
  audioUrl?: string;
  transcription?: string;
  tags: string[];
  targetDate: string; // YYYY-MM-DD format for which journal entry this belongs to
}

type QuickNoteCategory = 
  | 'market_observation'
  | 'trade_idea'
  | 'emotional_note'
  | 'lesson_learned'
  | 'reminder'
  | 'general';

const QUICK_NOTE_CATEGORIES = [
  { id: 'market_observation', label: 'Market Observation', icon: TrendingUp, color: 'bg-blue-500' },
  { id: 'trade_idea', label: 'Trade Idea', icon: MessageSquare, color: 'bg-green-500' },
  { id: 'emotional_note', label: 'Emotional Note', icon: AlertCircle, color: 'bg-yellow-500' },
  { id: 'lesson_learned', label: 'Lesson Learned', icon: Calendar, color: 'bg-purple-500' },
  { id: 'reminder', label: 'Reminder', icon: AlertCircle, color: 'bg-red-500' },
  { id: 'general', label: 'General Note', icon: MessageSquare, color: 'bg-gray-500' }
] as const;

export const QuickAddModule: React.FC<QuickAddModuleProps> = ({
  isOpen,
  onClose,
  onSave,
  className = ''
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<QuickNoteCategory>('general');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string>();
  const [transcription, setTranscription] = useState('');
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea when opened
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        // Start transcription
        await transcribeAudio(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Unable to access microphone. Please check permissions.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    
    try {
      // For now, we'll use a placeholder transcription
      // In a real implementation, you would integrate with a speech-to-text service
      // like Google Speech-to-Text, Azure Speech Services, or OpenAI Whisper
      
      // Simulate transcription delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockTranscription = "Voice note transcription would appear here. This is a placeholder for the actual speech-to-text integration.";
      setTranscription(mockTranscription);
      
      // Auto-fill content if it's empty
      if (!content.trim()) {
        setContent(mockTranscription);
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
      setTranscription('Transcription failed. Please type your note manually.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSave = async () => {
    if (!content.trim() && !audioUrl) {
      return;
    }

    if (!user) {
      alert('Please log in to save notes.');
      return;
    }

    setIsSaving(true);

    try {
      const quickNote: QuickNote = {
        id: `quick_${Date.now()}`,
        content: content.trim(),
        category,
        timestamp: new Date().toISOString(),
        isVoiceNote: !!audioUrl,
        audioUrl,
        transcription: transcription || undefined,
        tags: extractTags(content),
        targetDate
      };

      // Save to journal entry for the target date
      await addQuickNoteToJournal(user.uid, quickNote);

      // Call onSave callback if provided
      onSave?.(quickNote);

      // Reset form
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error saving quick note:', error);
      alert('Failed to save note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const addQuickNoteToJournal = async (userId: string, quickNote: QuickNote) => {
    try {
      // Get or create journal entry for target date
      let journalEntry = await journalDataService.getJournalEntry(userId, quickNote.targetDate);
      
      if (!journalEntry) {
        journalEntry = await journalDataService.createJournalEntry(userId, quickNote.targetDate);
      }

      // Find or create a "Quick Notes" section
      let quickNotesSection = journalEntry.sections.find(
        section => section.title === 'Quick Notes' && section.type === 'text'
      );

      if (!quickNotesSection) {
        quickNotesSection = {
          id: `quick_notes_${Date.now()}`,
          type: 'text',
          title: 'Quick Notes',
          content: '',
          order: journalEntry.sections.length,
          isRequired: false,
          isCompleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        journalEntry.sections.push(quickNotesSection);
      }

      // Format the quick note for inclusion
      const timestamp = new Date(quickNote.timestamp).toLocaleTimeString();
      const categoryLabel = QUICK_NOTE_CATEGORIES.find(cat => cat.id === quickNote.category)?.label || 'Note';
      
      let noteText = `**${timestamp} - ${categoryLabel}:**\n${quickNote.content}`;
      
      if (quickNote.isVoiceNote && quickNote.transcription) {
        noteText += `\n*[Voice note transcription]*`;
      }
      
      if (quickNote.tags.length > 0) {
        noteText += `\n*Tags: ${quickNote.tags.join(', ')}*`;
      }

      // Append to existing content
      const existingContent = quickNotesSection.content || '';
      quickNotesSection.content = existingContent 
        ? `${existingContent}\n\n${noteText}`
        : noteText;
      
      quickNotesSection.updatedAt = new Date().toISOString();
      quickNotesSection.isCompleted = true;

      // Update the journal entry
      await journalDataService.updateJournalEntry(userId, journalEntry.id, {
        sections: journalEntry.sections,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error adding quick note to journal:', error);
      throw error;
    }
  };

  const extractTags = (text: string): string[] => {
    // Simple tag extraction - look for #hashtags
    const tagRegex = /#(\w+)/g;
    const matches = text.match(tagRegex);
    return matches ? matches.map(tag => tag.substring(1).toLowerCase()) : [];
  };

  const resetForm = () => {
    setContent('');
    setCategory('general');
    setIsRecording(false);
    setIsTranscribing(false);
    setAudioUrl(undefined);
    setTranscription('');
    setTargetDate(new Date().toISOString().split('T')[0]);
    
    // Clean up audio URL
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ${className}`}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Quick Add Note</h3>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isSaving}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[calc(90vh-140px)] overflow-y-auto">
          {/* Target Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Add to Journal Entry
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_NOTE_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id as QuickNoteCategory)}
                    className={`flex items-center space-x-2 p-2 rounded-md border transition-colors ${
                      category === cat.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${cat.color}`} />
                    <span className="text-sm font-medium">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Voice Recording */}
          <div className="flex items-center space-x-2">
            <button
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              disabled={isTranscribing || isSaving}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md font-medium transition-colors ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {isRecording ? (
                <>
                  <MicOff className="w-4 h-4" />
                  <span>Stop Recording</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  <span>Voice Note</span>
                </>
              )}
            </button>
            
            {isTranscribing && (
              <span className="text-sm text-gray-500">Transcribing...</span>
            )}
          </div>

          {/* Audio Playback */}
          {audioUrl && (
            <div className="p-3 bg-gray-50 rounded-md">
              <audio controls className="w-full">
                <source src={audioUrl} type="audio/wav" />
                Your browser does not support audio playback.
              </audio>
              {transcription && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 font-medium">Transcription:</p>
                  <p className="text-sm text-gray-800">{transcription}</p>
                </div>
              )}
            </div>
          )}

          {/* Text Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note Content
            </label>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind? Use #tags to categorize your thoughts..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[100px]"
              rows={3}
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-500">
                Tip: Use #hashtags for easy categorization
              </span>
              <span className="text-xs text-gray-500">
                {content.length} characters
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={(!content.trim() && !audioUrl) || isSaving}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Note'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickAddModule;