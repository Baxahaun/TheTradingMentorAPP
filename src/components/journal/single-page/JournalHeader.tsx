import React from 'react';
import { format } from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Save,
  Layout,
  Loader2,
  CheckCircle,
  Circle,
} from 'lucide-react';

interface AutoSaveStatus {
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
}

interface JournalHeaderProps {
  selectedDate: Date;
  journalEntry: { templateName?: string } | null;
  autoSaveStatus: AutoSaveStatus;
  onPreviousDay: () => void;
  onNextDay: () => void;
  onSave: () => void;
  onChangeTemplate: () => void;
}

const JournalHeader: React.FC<JournalHeaderProps> = ({
  selectedDate,
  journalEntry,
  autoSaveStatus,
  onPreviousDay,
  onNextDay,
  onSave,
  onChangeTemplate,
}) => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              Daily Journal
            </h1>
            {journalEntry?.templateName && (
              <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-sm rounded-full">
                {journalEntry.templateName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Date Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={onPreviousDay}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 px-3">
                <Calendar className="w-5 h-5" />
                <span className="font-semibold">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
              </div>
              <button
                onClick={onNextDay}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Auto-save Status */}
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              {autoSaveStatus.isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : autoSaveStatus.lastSaved ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Saved {format(autoSaveStatus.lastSaved, 'HH:mm')}</span>
                </>
              ) : autoSaveStatus.hasUnsavedChanges ? (
                <>
                  <Circle className="w-4 h-4 text-yellow-500" />
                  <span>Unsaved changes</span>
                </>
              ) : null}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={onChangeTemplate}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Change Template"
              >
                <Layout className="w-5 h-5" />
              </button>
              <button
                onClick={onSave}
                disabled={autoSaveStatus.isSaving}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default JournalHeader;