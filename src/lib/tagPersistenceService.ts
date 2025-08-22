import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { Trade } from '../types/trade';
import { TagIndex, tagService } from './tagService';

/**
 * Service for persisting tag data and maintaining tag indexes in Firebase
 * Provides efficient tag lookups, index maintenance, and data migration utilities
 */
export class TagPersistenceService {
  private static instance: TagPersistenceService;
  private tagIndexCache: { [userId: string]: TagIndex } = {};
  private indexSubscriptions: { [userId: string]: () => void } = {};

  private constructor() {}

  public static getInstance(): TagPersistenceService {
    if (!TagPersistenceService.instance) {
      TagPersistenceService.instance = new TagPersistenceService();
    }
    return TagPersistenceService.instance;
  }

  /**
   * Gets the tag index collection reference for a user
   */
  private getTagIndexRef(userId: string) {
    return doc(db, 'users', userId, 'metadata', 'tagIndex');
  }

  /**
   * Gets the user's trades collection reference
   */
  private getUserTradesCollection(userId: string) {
    return collection(db, 'users', userId, 'trades');
  }

  /**
   * Builds and persists the tag index for a user
   * @param userId - User ID
   * @param trades - Array of user's trades
   * @param forceRebuild - Whether to force a complete rebuild
   */
  async buildAndPersistTagIndex(
    userId: string, 
    trades: Trade[], 
    forceRebuild: boolean = false
  ): Promise<void> {
    try {
      console.log(`Building tag index for user ${userId}, trades: ${trades.length}, forceRebuild: ${forceRebuild}`);
      
      // Build the tag index using the existing tag service
      tagService.buildTagIndex(trades);
      const tagIndex = this.getTagIndexFromService();

      // Prepare index data for persistence
      const indexData = {
        index: tagIndex,
        lastUpdated: Timestamp.now(),
        totalTrades: trades.length,
        totalTags: Object.keys(tagIndex).length,
        version: '1.0'
      };

      // Persist to Firebase
      const indexRef = this.getTagIndexRef(userId);
      await setDoc(indexRef, indexData, { merge: !forceRebuild });

      // Update local cache
      this.tagIndexCache[userId] = tagIndex;

      console.log(`Tag index built and persisted: ${Object.keys(tagIndex).length} tags`);
    } catch (error) {
      console.error('Error building and persisting tag index:', error);
      throw error;
    }
  }

  /**
   * Loads the tag index from Firebase for a user
   * @param userId - User ID
   * @returns Tag index or null if not found
   */
  async loadTagIndex(userId: string): Promise<TagIndex | null> {
    try {
      const indexRef = this.getTagIndexRef(userId);
      const indexDoc = await getDoc(indexRef);

      if (!indexDoc.exists()) {
        console.log(`No tag index found for user ${userId}`);
        return null;
      }

      const data = indexDoc.data();
      const tagIndex = data.index as TagIndex;

      // Update local cache
      this.tagIndexCache[userId] = tagIndex;

      console.log(`Loaded tag index for user ${userId}: ${Object.keys(tagIndex).length} tags`);
      return tagIndex;
    } catch (error) {
      console.error('Error loading tag index:', error);
      throw error;
    }
  }

  /**
   * Updates the tag index when trades are modified
   * @param userId - User ID
   * @param updatedTrades - Array of updated trades
   * @param changedTradeIds - IDs of trades that were changed
   */
  async updateTagIndexOnTradeChange(
    userId: string,
    updatedTrades: Trade[],
    changedTradeIds: string[]
  ): Promise<void> {
    try {
      console.log(`Updating tag index for user ${userId}, changed trades: ${changedTradeIds.length}`);

      // Rebuild the index with updated trades
      await this.buildAndPersistTagIndex(userId, updatedTrades, false);

      // Log the update
      console.log(`Tag index updated for ${changedTradeIds.length} changed trades`);
    } catch (error) {
      console.error('Error updating tag index on trade change:', error);
      throw error;
    }
  }

  /**
   * Performs incremental update of tag index for specific trades
   * @param userId - User ID
   * @param trades - All user trades
   * @param modifiedTradeIds - IDs of modified trades
   */
  async incrementalTagIndexUpdate(
    userId: string,
    trades: Trade[],
    modifiedTradeIds: string[]
  ): Promise<void> {
    try {
      // Load current index
      let currentIndex = this.tagIndexCache[userId];
      if (!currentIndex) {
        const loadedIndex = await this.loadTagIndex(userId);
        if (!loadedIndex) {
          // No existing index, build from scratch
          await this.buildAndPersistTagIndex(userId, trades, true);
          return;
        }
        currentIndex = loadedIndex;
      }

      // Get modified trades
      const modifiedTrades = trades.filter(trade => modifiedTradeIds.includes(trade.id));
      
      // Remove old tag references for modified trades
      Object.keys(currentIndex).forEach(tag => {
        const tagData = currentIndex[tag];
        if (tagData) {
          tagData.tradeIds = tagData.tradeIds.filter(id => !modifiedTradeIds.includes(id));
          tagData.count = tagData.tradeIds.length;
        }
      });

      // Add new tag references for modified trades
      modifiedTrades.forEach(trade => {
        if (!trade.tags || !Array.isArray(trade.tags)) return;

        trade.tags.forEach(tag => {
          const normalizedTag = tagService.normalizeTag(tag);
          if (!normalizedTag) return;

          if (!currentIndex[normalizedTag]) {
            currentIndex[normalizedTag] = {
              count: 0,
              tradeIds: [],
              lastUsed: trade.date,
              performance: {
                tag: normalizedTag,
                totalTrades: 0,
                winRate: 0,
                averagePnL: 0,
                profitFactor: 0
              }
            };
          }

          const tagData = currentIndex[normalizedTag];
          if (tagData) {
            tagData.tradeIds.push(trade.id);
            tagData.count++;
            
            // Update last used date if this trade is more recent
            if (trade.date > tagData.lastUsed) {
              tagData.lastUsed = trade.date;
            }
          }
        });
      });

      // Remove empty tag entries
      Object.keys(currentIndex).forEach(tag => {
        if (currentIndex[tag].count === 0) {
          delete currentIndex[tag];
        }
      });

      // Recalculate performance for affected tags
      const affectedTags = new Set<string>();
      modifiedTrades.forEach(trade => {
        if (trade.tags) {
          trade.tags.forEach(tag => {
            affectedTags.add(tagService.normalizeTag(tag));
          });
        }
      });

      affectedTags.forEach(tag => {
        const tagData = currentIndex[tag];
        if (tagData) {
          const tagTrades = trades.filter(trade => 
            trade.tags?.some(t => tagService.normalizeTag(t) === tag)
          );
          tagData.performance = tagService.calculateTagPerformance(tag, tagTrades);
        }
      });

      // Persist updated index
      const indexData = {
        index: currentIndex,
        lastUpdated: Timestamp.now(),
        totalTrades: trades.length,
        totalTags: Object.keys(currentIndex).length,
        version: '1.0'
      };

      const indexRef = this.getTagIndexRef(userId);
      await setDoc(indexRef, indexData, { merge: true });

      // Update local cache
      this.tagIndexCache[userId] = currentIndex;

      console.log(`Incremental tag index update completed: ${Object.keys(currentIndex).length} tags`);
    } catch (error) {
      console.error('Error in incremental tag index update:', error);
      // Fallback to full rebuild
      await this.buildAndPersistTagIndex(userId, trades, true);
    }
  }

  /**
   * Cleans up orphaned tags that are no longer used by any trades
   * @param userId - User ID
   * @param trades - Current array of trades
   * @returns Array of removed tag names
   */
  async cleanupOrphanedTags(userId: string, trades: Trade[]): Promise<string[]> {
    try {
      console.log(`Cleaning up orphaned tags for user ${userId}`);

      // Get current tags from trades
      const currentTags = new Set<string>();
      trades.forEach(trade => {
        if (trade.tags && Array.isArray(trade.tags)) {
          trade.tags.forEach(tag => {
            currentTags.add(tagService.normalizeTag(tag));
          });
        }
      });

      // Load current index
      let tagIndex = this.tagIndexCache[userId];
      if (!tagIndex) {
        const loadedIndex = await this.loadTagIndex(userId);
        if (!loadedIndex) {
          return []; // No index to clean
        }
        tagIndex = loadedIndex;
      }

      // Find orphaned tags
      const orphanedTags = Object.keys(tagIndex).filter(tag => !currentTags.has(tag));

      if (orphanedTags.length === 0) {
        console.log('No orphaned tags found');
        return [];
      }

      // Remove orphaned tags from index
      orphanedTags.forEach(tag => {
        delete tagIndex[tag];
      });

      // Persist updated index
      const indexData = {
        index: tagIndex,
        lastUpdated: Timestamp.now(),
        totalTrades: trades.length,
        totalTags: Object.keys(tagIndex).length,
        version: '1.0'
      };

      const indexRef = this.getTagIndexRef(userId);
      await setDoc(indexRef, indexData, { merge: true });

      // Update local cache
      this.tagIndexCache[userId] = tagIndex;

      console.log(`Cleaned up ${orphanedTags.length} orphaned tags:`, orphanedTags);
      return orphanedTags;
    } catch (error) {
      console.error('Error cleaning up orphaned tags:', error);
      throw error;
    }
  }

  /**
   * Migrates existing trades to add tag support
   * @param userId - User ID
   * @param trades - Array of trades to migrate
   * @param defaultTags - Default tags to add to trades without tags
   * @returns Migration results
   */
  async migrateTradesForTagging(
    userId: string,
    trades: Trade[],
    defaultTags: string[] = []
  ): Promise<{
    totalTrades: number;
    migratedTrades: number;
    errors: string[];
  }> {
    try {
      console.log(`Starting tag migration for user ${userId}, ${trades.length} trades`);

      const batch = writeBatch(db);
      const tradesCollection = this.getUserTradesCollection(userId);
      const errors: string[] = [];
      let migratedCount = 0;

      const processedDefaultTags = tagService.processTags(defaultTags);

      trades.forEach(trade => {
        try {
          let needsMigration = false;
          let updatedTrade = { ...trade };

          // Check if trade needs tag migration
          if (!trade.tags || !Array.isArray(trade.tags)) {
            updatedTrade.tags = [...processedDefaultTags];
            needsMigration = true;
          } else {
            // Validate and clean existing tags
            const processedTags = tagService.processTags(trade.tags);
            if (JSON.stringify(processedTags) !== JSON.stringify(trade.tags)) {
              updatedTrade.tags = processedTags;
              needsMigration = true;
            }
          }

          if (needsMigration) {
            const tradeRef = doc(tradesCollection, trade.id);
            batch.update(tradeRef, {
              tags: updatedTrade.tags,
              updatedAt: Timestamp.now()
            });
            migratedCount++;
          }
        } catch (error) {
          errors.push(`Error migrating trade ${trade.id}: ${error}`);
        }
      });

      // Commit batch updates
      if (migratedCount > 0) {
        await batch.commit();
        console.log(`Committed ${migratedCount} trade migrations`);
      }

      // Rebuild tag index after migration
      if (migratedCount > 0) {
        const updatedTrades = trades.map(trade => {
          if (!trade.tags || !Array.isArray(trade.tags)) {
            return { ...trade, tags: processedDefaultTags };
          }
          return { ...trade, tags: tagService.processTags(trade.tags) };
        });

        await this.buildAndPersistTagIndex(userId, updatedTrades, true);
      }

      const result = {
        totalTrades: trades.length,
        migratedTrades: migratedCount,
        errors
      };

      console.log('Tag migration completed:', result);
      return result;
    } catch (error) {
      console.error('Error in tag migration:', error);
      throw error;
    }
  }

  /**
   * Validates tag index integrity against actual trades
   * @param userId - User ID
   * @param trades - Array of trades to validate against
   * @returns Validation results
   */
  async validateTagIndexIntegrity(
    userId: string,
    trades: Trade[]
  ): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    recommendations: string[];
  }> {
    try {
      console.log(`Validating tag index integrity for user ${userId}`);

      const errors: string[] = [];
      const warnings: string[] = [];
      const recommendations: string[] = [];

      // Load current index
      let tagIndex = this.tagIndexCache[userId];
      if (!tagIndex) {
        const loadedIndex = await this.loadTagIndex(userId);
        if (!loadedIndex) {
          errors.push('No tag index found');
          return { isValid: false, errors, warnings, recommendations };
        }
        tagIndex = loadedIndex;
      }

      // Build expected index from trades
      tagService.buildTagIndex(trades);
      const expectedIndex = this.getTagIndexFromService();

      // Compare indexes
      const indexTags = new Set(Object.keys(tagIndex));
      const expectedTags = new Set(Object.keys(expectedIndex));

      // Check for missing tags in index
      expectedTags.forEach(tag => {
        if (!indexTags.has(tag)) {
          errors.push(`Tag missing from index: ${tag}`);
        }
      });

      // Check for orphaned tags in index
      indexTags.forEach(tag => {
        if (!expectedTags.has(tag)) {
          warnings.push(`Orphaned tag in index: ${tag}`);
        }
      });

      // Check tag counts and trade IDs
      Object.keys(expectedIndex).forEach(tag => {
        const indexData = tagIndex[tag];
        const expectedData = expectedIndex[tag];
        
        if (indexData && expectedData) {
          if (indexData.count !== expectedData.count) {
            errors.push(`Tag count mismatch for ${tag}: index=${indexData.count}, expected=${expectedData.count}`);
          }

          if (indexData.tradeIds.length !== expectedData.tradeIds.length) {
            errors.push(`Trade ID count mismatch for ${tag}: index=${indexData.tradeIds.length}, expected=${expectedData.tradeIds.length}`);
          }

          // Check if trade IDs match (order doesn't matter)
          const indexTradeIds = new Set(indexData.tradeIds);
          const expectedTradeIds = new Set(expectedData.tradeIds);
          
          expectedTradeIds.forEach(id => {
            if (!indexTradeIds.has(id)) {
              errors.push(`Missing trade ID ${id} for tag ${tag}`);
            }
          });

          indexTradeIds.forEach(id => {
            if (!expectedTradeIds.has(id)) {
              warnings.push(`Extra trade ID ${id} for tag ${tag}`);
            }
          });
        }
      });

      // Generate recommendations
      if (errors.length > 0) {
        recommendations.push('Rebuild tag index to fix integrity issues');
      }
      
      if (warnings.length > 0) {
        recommendations.push('Run tag cleanup to remove orphaned entries');
      }

      if (errors.length === 0 && warnings.length === 0) {
        recommendations.push('Tag index is healthy and up to date');
      }

      const result = {
        isValid: errors.length === 0,
        errors,
        warnings,
        recommendations
      };

      console.log('Tag index validation completed:', result);
      return result;
    } catch (error) {
      console.error('Error validating tag index integrity:', error);
      throw error;
    }
  }

  /**
   * Subscribes to real-time tag index updates
   * @param userId - User ID
   * @param callback - Callback function for index updates
   * @returns Unsubscribe function
   */
  subscribeToTagIndex(
    userId: string,
    callback: (tagIndex: TagIndex | null) => void
  ): () => void {
    const indexRef = this.getTagIndexRef(userId);
    
    const unsubscribe = onSnapshot(indexRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const tagIndex = data.index as TagIndex;
        this.tagIndexCache[userId] = tagIndex;
        callback(tagIndex);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Error in tag index subscription:', error);
      callback(null);
    });

    // Store subscription for cleanup
    this.indexSubscriptions[userId] = unsubscribe;
    
    return unsubscribe;
  }

  /**
   * Unsubscribes from tag index updates for a user
   * @param userId - User ID
   */
  unsubscribeFromTagIndex(userId: string): void {
    if (this.indexSubscriptions[userId]) {
      this.indexSubscriptions[userId]();
      delete this.indexSubscriptions[userId];
    }
  }

  /**
   * Gets cached tag index for a user
   * @param userId - User ID
   * @returns Cached tag index or null
   */
  getCachedTagIndex(userId: string): TagIndex | null {
    return this.tagIndexCache[userId] || null;
  }

  /**
   * Clears cached tag index for a user
   * @param userId - User ID
   */
  clearCachedTagIndex(userId: string): void {
    delete this.tagIndexCache[userId];
  }

  /**
   * Gets tag index from the tag service (helper method)
   * @returns Current tag index from tag service
   */
  private getTagIndexFromService(): TagIndex {
    // Access the private tagIndex from tagService
    // This is a workaround since tagService doesn't expose the index directly
    const serviceInstance = tagService as any;
    return serviceInstance.tagIndex || {};
  }

  /**
   * Exports tag persistence data for backup
   * @param userId - User ID
   * @returns Exportable tag persistence data
   */
  async exportTagPersistenceData(userId: string): Promise<{
    tagIndex: TagIndex | null;
    exportDate: string;
    version: string;
  }> {
    try {
      const tagIndex = await this.loadTagIndex(userId);
      
      return {
        tagIndex,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
    } catch (error) {
      console.error('Error exporting tag persistence data:', error);
      throw error;
    }
  }

  /**
   * Imports tag persistence data from backup
   * @param userId - User ID
   * @param data - Tag persistence data to import
   * @returns Import results
   */
  async importTagPersistenceData(
    userId: string,
    data: any
  ): Promise<{
    success: boolean;
    errors: string[];
    imported: boolean;
  }> {
    try {
      const errors: string[] = [];

      if (!data || typeof data !== 'object') {
        errors.push('Invalid import data format');
        return { success: false, errors, imported: false };
      }

      if (!data.tagIndex || typeof data.tagIndex !== 'object') {
        errors.push('Invalid or missing tag index in import data');
        return { success: false, errors, imported: false };
      }

      // Validate tag index structure
      const tagIndex = data.tagIndex as TagIndex;
      Object.keys(tagIndex).forEach(tag => {
        const tagData = tagIndex[tag];
        if (!tagData.count || !Array.isArray(tagData.tradeIds) || !tagData.lastUsed) {
          errors.push(`Invalid tag data structure for tag: ${tag}`);
        }
      });

      if (errors.length > 0) {
        return { success: false, errors, imported: false };
      }

      // Import the tag index
      const indexData = {
        index: tagIndex,
        lastUpdated: Timestamp.now(),
        totalTags: Object.keys(tagIndex).length,
        version: data.version || '1.0',
        importedAt: Timestamp.now()
      };

      const indexRef = this.getTagIndexRef(userId);
      await setDoc(indexRef, indexData);

      // Update local cache
      this.tagIndexCache[userId] = tagIndex;

      console.log(`Imported tag index with ${Object.keys(tagIndex).length} tags`);
      return { success: true, errors: [], imported: true };
    } catch (error) {
      console.error('Error importing tag persistence data:', error);
      return { 
        success: false, 
        errors: [`Import failed: ${error}`], 
        imported: false 
      };
    }
  }
}

// Export singleton instance
export const tagPersistenceService = TagPersistenceService.getInstance();