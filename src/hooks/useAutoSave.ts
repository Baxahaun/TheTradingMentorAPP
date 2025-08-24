/**
 * Auto-save hook for trade review system
 * Provides auto-save functionality with conflict resolution
 */

import { useEffect, useRef, useCallback } from 'react';
import { TradeReviewService } from '../lib/tradeReviewService';
import { EnhancedTrade, ConflictResolution } from '../types/tradeReview';
import { useAuth } from '../contexts/AuthContext';

interface UseAutoSaveOptions {
  interval?: number; // Auto-save interval in milliseconds
  enabled?: boolean; // Whether auto-save is enabled
  onSave?: (success: boolean, error?: Error) => void;
  onConflict?: (conflict: ConflictResolution) => void;
}

interface UseAutoSaveReturn {
  markUnsavedChanges: () => void;
  saveNow: () => Promise<void>;
  isAutoSaveEnabled: boolean;
  lastSaved?: string;
  hasUnsavedChanges: boolean;
}

export function useAutoSave(
  tradeId: string,
  tradeData: Partial<EnhancedTrade>,
  options: UseAutoSaveOptions = {}
): UseAutoSaveReturn {
  const {
    interval = 30000, // 30 seconds default
    enabled = true,
    onSave,
    onConflict
  } = options;

  const { user } = useAuth();
  const reviewService = TradeReviewService.getInstance();
  const tradeDataRef = useRef(tradeData);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Update ref when trade data changes
  useEffect(() => {
    tradeDataRef.current = tradeData;
  }, [tradeData]);

  // Save function
  const saveNow = useCallback(async () => {
    if (!user || !tradeId) return;

    try {
      const result = await reviewService.saveTradeWithConflictResolution(
        user.uid,
        tradeId,
        tradeDataRef.current,
        'merge'
      );

      if (result.success) {
        onSave?.(true);
      } else if (result.conflict) {
        onConflict?.(result.conflict);
      } else {
        onSave?.(false, result.error);
      }
    } catch (error) {
      onSave?.(false, error as Error);
    }
  }, [user, tradeId, reviewService, onSave, onConflict]);

  // Mark unsaved changes
  const markUnsavedChanges = useCallback(() => {
    if (enabled && tradeId) {
      reviewService.markUnsavedChanges(tradeId);
      
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Set new timeout for auto-save
      saveTimeoutRef.current = setTimeout(() => {
        saveNow();
      }, interval);
    }
  }, [enabled, tradeId, reviewService, saveNow, interval]);

  // Enable/disable auto-save
  useEffect(() => {
    if (!user || !tradeId) return;

    if (enabled) {
      reviewService.enableAutoSave(
        tradeId, 
        user.uid, 
        interval, 
        onSave,
        () => tradeDataRef.current
      );
    } else {
      reviewService.disableAutoSave(tradeId);
    }

    return () => {
      reviewService.disableAutoSave(tradeId);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [enabled, tradeId, user, interval, reviewService, onSave]);

  // Get auto-save state
  const autoSaveState = reviewService.getAutoSaveState(tradeId);

  return {
    markUnsavedChanges,
    saveNow,
    isAutoSaveEnabled: autoSaveState?.isEnabled ?? false,
    lastSaved: autoSaveState?.lastSaved,
    hasUnsavedChanges: autoSaveState?.hasUnsavedChanges ?? false
  };
}