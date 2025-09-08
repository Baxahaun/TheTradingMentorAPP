/**
 * Secure Journal Hook
 * Integrates security services with journal operations
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import EncryptionService from '../services/EncryptionService';
import AuditLogService from '../services/AuditLogService';
import PrivacySettingsService, { PrivacySettings } from '../services/PrivacySettingsService';
import SecureDataService from '../services/SecureDataService';
import { JournalEntry } from '../types/journal';

interface UseSecureJournalOptions {
  enableEncryption?: boolean;
  enableAuditLogging?: boolean;
  autoSave?: boolean;
  autoSaveInterval?: number;
}

interface SecureJournalState {
  privacySettings: PrivacySettings | null;
  isEncrypted: boolean;
  lastSaved: Date | null;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  error: string | null;
}

export const useSecureJournal = (options: UseSecureJournalOptions = {}) => {
  const { user } = useAuth();
  const [state, setState] = useState<SecureJournalState>({
    privacySettings: null,
    isEncrypted: false,
    lastSaved: null,
    saveStatus: 'idle',
    error: null
  });

  const encryptionService = EncryptionService.getInstance();
  const auditService = AuditLogService.getInstance();
  const privacyService = PrivacySettingsService.getInstance();
  const secureDataService = SecureDataService.getInstance();

  // Load privacy settings on mount
  useEffect(() => {
    if (user?.uid) {
      loadPrivacySettings();
    }
  }, [user]);

  const loadPrivacySettings = async () => {
    try {
      const settings = await privacyService.getPrivacySettings(user!.uid);
      setState(prev => ({
        ...prev,
        privacySettings: settings,
        isEncrypted: settings.encryptionEnabled
      }));
    } catch (error) {
      console.error('Failed to load privacy settings:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to load privacy settings'
      }));
    }
  };

  /**
   * Securely save journal entry with encryption and audit logging
   */
  const securelyCreateEntry = useCallback(async (
    entryData: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<JournalEntry> => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    setState(prev => ({ ...prev, saveStatus: 'saving', error: null }));

    try {
      let processedData = { ...entryData };

      // Apply encryption if enabled
      if (state.privacySettings?.encryptionEnabled) {
        processedData = await encryptionService.encryptJournalFields(
          processedData,
          user.uid
        );
      }

      // Add metadata
      const entry: JournalEntry = {
        ...processedData,
        id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store securely
      await secureDataService.secureStore(
        `journal_${entry.date}`,
        entry,
        user.uid,
        {
          encrypt: state.privacySettings?.encryptionEnabled,
          addIntegrityCheck: true
        }
      );

      // Log the creation
      if (state.privacySettings?.enableAuditLogging) {
        await auditService.logJournalWrite(
          user.uid,
          entry.id,
          Object.keys(entryData),
          true
        );
      }

      setState(prev => ({
        ...prev,
        saveStatus: 'saved',
        lastSaved: new Date()
      }));

      return entry;

    } catch (error) {
      setState(prev => ({
        ...prev,
        saveStatus: 'error',
        error: error instanceof Error ? error.message : 'Failed to create entry'
      }));
      throw error;
    }
  }, [user, state.privacySettings]);

  /**
   * Securely update journal entry
   */
  const securelyUpdateEntry = useCallback(async (
    entryId: string,
    updates: Partial<JournalEntry>
  ): Promise<void> => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    setState(prev => ({ ...prev, saveStatus: 'saving', error: null }));

    try {
      // Get existing entry
      const existingEntry = await secureDataService.secureRetrieve(
        `journal_${updates.date || 'unknown'}`,
        user.uid
      );

      if (!existingEntry || existingEntry.id !== entryId) {
        throw new Error('Entry not found or access denied');
      }

      let processedUpdates = { ...updates };

      // Apply encryption if enabled
      if (state.privacySettings?.encryptionEnabled) {
        processedUpdates = await encryptionService.encryptJournalFields(
          processedUpdates,
          user.uid
        );
      }

      // Merge updates
      const updatedEntry = {
        ...existingEntry,
        ...processedUpdates,
        updatedAt: new Date().toISOString()
      };

      // Store securely
      await secureDataService.secureStore(
        `journal_${updatedEntry.date}`,
        updatedEntry,
        user.uid,
        {
          encrypt: state.privacySettings?.encryptionEnabled,
          addIntegrityCheck: true
        }
      );

      // Log the update
      if (state.privacySettings?.enableAuditLogging) {
        await auditService.logJournalWrite(
          user.uid,
          entryId,
          Object.keys(updates),
          true
        );
      }

      setState(prev => ({
        ...prev,
        saveStatus: 'saved',
        lastSaved: new Date()
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        saveStatus: 'error',
        error: error instanceof Error ? error.message : 'Failed to update entry'
      }));
      throw error;
    }
  }, [user, state.privacySettings]);

  /**
   * Securely retrieve journal entry
   */
  const securelyGetEntry = useCallback(async (date: string): Promise<JournalEntry | null> => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      const entry = await secureDataService.secureRetrieve(
        `journal_${date}`,
        user.uid
      );

      // Log the read access
      if (entry && state.privacySettings?.enableAuditLogging) {
        await auditService.logJournalRead(user.uid, entry.id, true);
      }

      return entry;

    } catch (error) {
      console.error('Failed to retrieve entry:', error);
      
      // Log failed access
      if (state.privacySettings?.enableAuditLogging) {
        await auditService.logJournalRead(user.uid, `journal_${date}`, false);
      }
      
      return null;
    }
  }, [user, state.privacySettings]);

  /**
   * Securely delete journal entry
   */
  const securelyDeleteEntry = useCallback(async (entryId: string, date: string): Promise<void> => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      // Verify entry exists and belongs to user
      const entry = await securelyGetEntry(date);
      if (!entry || entry.id !== entryId) {
        throw new Error('Entry not found or access denied');
      }

      // Delete securely
      await secureDataService.secureDelete(`journal_${date}`, user.uid);

      // Log the deletion
      if (state.privacySettings?.enableAuditLogging) {
        await auditService.logJournalDelete(user.uid, entryId, true);
      }

    } catch (error) {
      // Log failed deletion
      if (state.privacySettings?.enableAuditLogging) {
        await auditService.logJournalDelete(user.uid, entryId, false);
      }
      throw error;
    }
  }, [user, state.privacySettings, securelyGetEntry]);

  /**
   * Export journal data securely
   */
  const securelyExportData = useCallback(async (
    dateRange: { start: string; end: string },
    format: 'json' | 'pdf' | 'csv' = 'json'
  ): Promise<void> => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      // Check export permissions
      const hasPermission = await privacyService.hasPermission(
        user.uid,
        'export',
        'journal_entry'
      );

      if (!hasPermission) {
        throw new Error('Data export is not enabled in privacy settings');
      }

      // This would integrate with the actual export functionality
      // For now, we'll just log the export request
      await auditService.logDataExport(
        user.uid,
        [`${dateRange.start}_to_${dateRange.end}`],
        format,
        true
      );

      // Placeholder for actual export implementation
      console.log(`Exporting data from ${dateRange.start} to ${dateRange.end} in ${format} format`);

    } catch (error) {
      await auditService.logDataExport(
        user.uid,
        [`${dateRange.start}_to_${dateRange.end}`],
        format,
        false
      );
      throw error;
    }
  }, [user, privacyService, auditService]);

  /**
   * Clear all secure data (for logout)
   */
  const clearSecureData = useCallback(async (): Promise<void> => {
    if (user?.uid) {
      await secureDataService.clearSecureData(user.uid);
      setState({
        privacySettings: null,
        isEncrypted: false,
        lastSaved: null,
        saveStatus: 'idle',
        error: null
      });
    }
  }, [user, secureDataService]);

  /**
   * Check if user has permission for specific action
   */
  const hasPermission = useCallback(async (
    action: 'read' | 'write' | 'delete' | 'export' | 'share',
    dataType: 'journal_entry' | 'emotional_data' | 'personal_notes' | 'templates'
  ): Promise<boolean> => {
    if (!user?.uid) return false;
    
    return await privacyService.hasPermission(user.uid, action, dataType);
  }, [user, privacyService]);

  return {
    // State
    ...state,
    
    // Actions
    securelyCreateEntry,
    securelyUpdateEntry,
    securelyGetEntry,
    securelyDeleteEntry,
    securelyExportData,
    clearSecureData,
    hasPermission,
    
    // Utilities
    loadPrivacySettings,
    
    // Services (for advanced usage)
    encryptionService,
    auditService,
    privacyService,
    secureDataService
  };
};

export default useSecureJournal;