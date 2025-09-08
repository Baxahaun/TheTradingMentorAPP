/**
 * Quick Entry Organizer Component
 * 
 * Provides an interface for organizing and completing quick entries.
 * Helps users review, categorize, and integrate quick notes into their daily journal entries.
 * 
 * Features:
 * - Review pending quick entries
 * - Batch organization and categorization
 * - Integration with daily journal entries
 * - Completion workflow guidance
 */

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Tag,
  CheckCircle,
  Circle,
  ArrowRight,
  Filter,
  Search,
  MoreVertical,
  Edit3,
  Trash2,
  Archive,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  Mic
} from 'lucide-react';
import { JournalEntry } from '../../types/journal';
import { journalDataService } from '../../services/JournalDataService';
import { useAuth } from '../../contexts/AuthContext';

interface QuickEntry {
  id: string;
  content: string;
  category: string;
  timestamp: string;
  isVoiceNote: boolean;
  audioUrl?: string;
  transcription?: string;
  tags: string[];
  targetDate: string;
  isProcessed: boolean;
  journalEntryId?: string;
}

interface QuickEntryOrganizerProps {
  isOpen: boolean;
  onClose: () => void;
  onEntryProcessed?: (entryId: string) => void;
  className?: string;
}

type FilterType = 'all' | 'pending' | 'processed' | 'voice' | 'text';
type SortType = 'date' | 'category' | 'target';

const CATEGORY_ICONS: Record<string, React.ComponentType<any>> = {
  market_observation: TrendingUp,
  trade_idea: MessageSquare,
  emotional_note: AlertCircle,
  lesson_learned: Calendar,
  reminder: AlertCircle,
  general: MessageSquare
};

const CATEGORY_COLORS: Record<string, string> = {
  market_observation: 'bg-blue-100 text-blue-800 border-blue-200',
  trade_idea: 'bg-green-100 text-green-800 border-green-200',
  emotional_note: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  lesson_learned: 'bg-purple-100 text-purple-800 border-purple-200',
  reminder: 'bg-red-100 text-red-800 border-red-200',
  general: 'bg-gray-100 text-gray-800 border-gray-200'
};

export const QuickEntryOrganizer: React.FC<QuickEntryOrganizerProps> = ({
  isOpen,
  onClose,
  onEntryProcessed,
  className = ''
}) => {
  const { user } = useAuth();
  const [quickEntries, setQuickEntries] = useState<QuickEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<QuickEntry[]>([]);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<FilterType>('pending');
  const [sortBy, setSortBy] = useState<SortType>('date');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load quick entries from localStorage (in a real app, this would come from a service)
  useEffect(() => {
    if (isOpen && user) {
      loadQuickEntries();
    }
  }, [isOpen, user]);

  // Filter and sort entries
  useEffect(() => {
    let filtered = [...quickEntries];

    // Apply filter
    switch (filter) {
      case 'pending':
        filtered = filtered.filter(entry => !entry.isProcessed);
        break;
      case 'processed':
        filtered = filtered.filter(entry => entry.isProcessed);
        break;
      case 'voice':
        filtered = filtered.filter(entry => entry.isVoiceNote);
        break;
      case 'text':
        filtered = filtered.filter(entry => !entry.isVoiceNote);
        break;
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.content.toLowerCase().includes(query) ||
        entry.tags.some(tag => tag.toLowerCase().includes(query)) ||
        entry.category.toLowerCase().includes(query)
      );
    }

    // Apply sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case 'category':
          return a.category.localeCompare(b.category);
        case 'target':
          return a.targetDate.localeCompare(b.targetDate);
        default:
          return 0;
      }
    });

    setFilteredEntries(filtered);
  }, [quickEntries, filter, sortBy, searchQuery]);

  const loadQuickEntries = () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would load from a proper service
      const stored = localStorage.getItem(`quick_entries_${user?.uid}`);
      if (stored) {
        const entries = JSON.parse(stored);
        setQuickEntries(entries);
      }
    } catch (error) {
      console.error('Error loading quick entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveQuickEntries = (entries: QuickEntry[]) => {
    try {
      localStorage.setItem(`quick_entries_${user?.uid}`, JSON.stringify(entries));
      setQuickEntries(entries);
    } catch (error) {
      console.error('Error saving quick entries:', error);
    }
  };

  const toggleEntrySelection = (entryId: string) => {
    const newSelection = new Set(selectedEntries);
    if (newSelection.has(entryId)) {
      newSelection.delete(entryId);
    } else {
      newSelection.add(entryId);
    }
    setSelectedEntries(newSelection);
  };

  const selectAllVisible = () => {
    const visibleIds = filteredEntries.map(entry => entry.id);
    setSelectedEntries(new Set(visibleIds));
  };

  const clearSelection = () => {
    setSelectedEntries(new Set());
  };

  const processSelectedEntries = async () => {
    if (selectedEntries.size === 0 || !user) return;

    setIsProcessing(true);
    try {
      const entriesToProcess = quickEntries.filter(entry => selectedEntries.has(entry.id));
      const updatedEntries = [...quickEntries];

      for (const entry of entriesToProcess) {
        // Add to journal entry
        await addQuickEntryToJournal(user.uid, entry);
        
        // Mark as processed
        const index = updatedEntries.findIndex(e => e.id === entry.id);
        if (index !== -1) {
          updatedEntries[index] = { ...entry, isProcessed: true };
        }

        onEntryProcessed?.(entry.id);
      }

      saveQuickEntries(updatedEntries);
      clearSelection();
    } catch (error) {
      console.error('Error processing entries:', error);
      alert('Failed to process some entries. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const addQuickEntryToJournal = async (userId: string, quickEntry: QuickEntry) => {
    try {
      // Get or create journal entry for target date
      let journalEntry = await journalDataService.getJournalEntry(userId, quickEntry.targetDate);
      
      if (!journalEntry) {
        journalEntry = await journalDataService.createJournalEntry(userId, quickEntry.targetDate);
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

      // Format the quick entry for inclusion
      const timestamp = new Date(quickEntry.timestamp).toLocaleTimeString();
      const categoryLabel = quickEntry.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      let noteText = `**${timestamp} - ${categoryLabel}:**\n${quickEntry.content}`;
      
      if (quickEntry.isVoiceNote && quickEntry.transcription) {
        noteText += `\n*[Voice note transcription]*`;
      }
      
      if (quickEntry.tags.length > 0) {
        noteText += `\n*Tags: ${quickEntry.tags.join(', ')}*`;
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
      console.error('Error adding quick entry to journal:', error);
      throw error;
    }
  };

  const deleteSelectedEntries = () => {
    if (selectedEntries.size === 0) return;

    const updatedEntries = quickEntries.filter(entry => !selectedEntries.has(entry.id));
    saveQuickEntries(updatedEntries);
    clearSelection();
  };

  const archiveSelectedEntries = () => {
    if (selectedEntries.size === 0) return;

    const updatedEntries = quickEntries.map(entry =>
      selectedEntries.has(entry.id) ? { ...entry, isProcessed: true } : entry
    );
    saveQuickEntries(updatedEntries);
    clearSelection();
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ${className}`}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Quick Entry Organizer</h2>
            <p className="text-sm text-gray-600 mt-1">
              Review and organize your quick notes into journal entries
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <MoreVertical className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterType)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Entries</option>
              <option value="pending">Pending</option>
              <option value="processed">Processed</option>
              <option value="voice">Voice Notes</option>
              <option value="text">Text Notes</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortType)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="date">Sort by Date</option>
              <option value="category">Sort by Category</option>
              <option value="target">Sort by Target Date</option>
            </select>
          </div>

          {/* Batch Actions */}
          {selectedEntries.size > 0 && (
            <div className="flex items-center justify-between mt-4 p-3 bg-blue-50 rounded-md">
              <span className="text-sm font-medium text-blue-900">
                {selectedEntries.size} entries selected
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={processSelectedEntries}
                  disabled={isProcessing}
                  className="flex items-center space-x-1 px-3 py-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-md text-sm font-medium transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{isProcessing ? 'Processing...' : 'Process'}</span>
                </button>
                <button
                  onClick={archiveSelectedEntries}
                  className="flex items-center space-x-1 px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded-md text-sm font-medium transition-colors"
                >
                  <Archive className="w-4 h-4" />
                  <span>Archive</span>
                </button>
                <button
                  onClick={deleteSelectedEntries}
                  className="flex items-center space-x-1 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm font-medium transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
                <button
                  onClick={clearSelection}
                  className="px-3 py-1 text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Entry List */}
        <div className="flex-1 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading entries...</p>
              </div>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No entries found</p>
                <p className="text-sm text-gray-500 mt-1">
                  {filter === 'pending' ? 'All entries have been processed' : 'Try adjusting your filters'}
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredEntries.map((entry) => {
                const Icon = CATEGORY_ICONS[entry.category] || MessageSquare;
                const isSelected = selectedEntries.has(entry.id);
                
                return (
                  <div
                    key={entry.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Selection Checkbox */}
                      <button
                        onClick={() => toggleEntrySelection(entry.id)}
                        className="mt-1 p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        {isSelected ? (
                          <CheckCircle className="w-5 h-5 text-blue-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400" />
                        )}
                      </button>

                      {/* Entry Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <Icon className="w-4 h-4 text-gray-600" />
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${CATEGORY_COLORS[entry.category]}`}>
                            {entry.category.replace('_', ' ')}
                          </span>
                          {entry.isVoiceNote && (
                            <span className="inline-flex items-center space-x-1 text-xs text-purple-600">
                              <Mic className="w-3 h-3" />
                              <span>Voice</span>
                            </span>
                          )}
                          {entry.isProcessed && (
                            <span className="inline-flex items-center space-x-1 text-xs text-green-600">
                              <CheckCircle className="w-3 h-3" />
                              <span>Processed</span>
                            </span>
                          )}
                        </div>

                        <p className="text-gray-900 mb-2 line-clamp-3">{entry.content}</p>

                        {entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {entry.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center space-x-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                              >
                                <Tag className="w-3 h-3" />
                                <span>{tag}</span>
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(entry.timestamp).toLocaleString()}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>Target: {new Date(entry.targetDate).toLocaleDateString()}</span>
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-1">
                        {entry.audioUrl && (
                          <audio controls className="w-32">
                            <source src={entry.audioUrl} type="audio/wav" />
                          </audio>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {filteredEntries.length} of {quickEntries.length} entries
            {selectedEntries.size > 0 && ` • ${selectedEntries.size} selected`}
          </div>
          <div className="flex items-center space-x-2">
            {filteredEntries.length > 0 && (
              <button
                onClick={selectedEntries.size === filteredEntries.length ? clearSelection : selectAllVisible}
                className="px-3 py-1 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
              >
                {selectedEntries.size === filteredEntries.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md text-sm font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickEntryOrganizer;