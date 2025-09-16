/**
 * TradeLog Integration Service
 *
 * This service enables seamless bidirectional integration between TradeLog and Daily Journal systems.
 * It provides methods for linking trades to journal entries, checking journal status, and
 * facilitating navigation between the two systems.
 *
 * Key Features:
 * - Bidirectional navigation between TradeLog ↔ Daily Journal
 * - Trade-to-journal entry linking and validation
 * - Journal status checking and metadata retrieval
 * - Navigation context management
 * - Real-time subscription to linked data changes
 */

import { Trade } from '../types/trade';
import { JournalEntry } from '../types/journal';
import { TradeLogIntegrationData, DailyJournalNavigationState } from '../types/dailyJournal';
import { WeekRange } from '../types/dailyJournal';
import { journalDataService } from './JournalDataService';
import { tradeService } from '../lib/firebaseService';
import { NavigationContext } from '../types/navigation';

// Constants for collection paths and linking
const TRADE_JOURNAL_LINKS_COLLECTION = 'tradeJournalLinks';
const JOURNAL_TRADE_LINKS_COLLECTION = 'journalTradeLinks';

/**
 * Trade-Journal Link Interface
 * Represents the relationship between a trade and a journal entry
 */
interface TradeJournalLink {
  id: string;
  tradeId: string;
  journalEntryId: string;
  journalDate: string;
  userId: string;
  linkType: 'direct' | 'auto' | 'manual'; // How the link was created
  createdAt: string;
  updatedAt: string;
  metadata?: {
    tradeSnapshot?: Partial<Trade>;
    journalSnippet?: string;
    linkStrength?: 'strong' | 'weak' | 'tentative'; // Confidence in the link
  };
}

/**
 * TradeLog Integration Service Class
 * Handles all integration between TradeLog and Daily Journal systems
 */
export class TradeLogIntegrationService {
  private static instance: TradeLogIntegrationService;
  private activeSubscriptions: Map<string, () => void> = new Map();

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): TradeLogIntegrationService {
    if (!TradeLogIntegrationService.instance) {
      TradeLogIntegrationService.instance = new TradeLogIntegrationService();
    }
    return TradeLogIntegrationService.instance;
  }

  // ===== TRADE-JOURNAL LINKING =====

  /**
   * Links a trade to a journal entry
   */
  async linkTradeToJournal(
    userId: string,
    tradeId: string,
    journalDate: string,
    linkType: 'direct' | 'auto' | 'manual' = 'direct'
  ): Promise<TradeJournalLink> {
    try {
      // Get the journal entry to verify it exists
      const journalEntry = await journalDataService.getJournalEntry(userId, journalDate);
      if (!journalEntry) {
        throw new Error(`Journal entry not found for date ${journalDate}`);
      }

      // Get the trade to verify it exists
      const trade = await tradeService.getTrade(userId, tradeId);
      if (!trade) {
        throw new Error(`Trade not found with ID ${tradeId}`);
      }

      // Create the link
      const linkId = `${tradeId}_${journalDate}`;
      const link: TradeJournalLink = {
        id: linkId,
        tradeId,
        journalEntryId: journalEntry.id,
        journalDate,
        userId,
        linkType,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          tradeSnapshot: {
            currencyPair: trade.currencyPair,
            side: trade.side,
            pnl: trade.pnl
          },
          linkStrength: 'strong'
        }
      };

      // Store the link in Firestore
      await this.storeTradeJournalLink(link);

      return link;
    } catch (error) {
      console.error('Error linking trade to journal:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to link trade to journal: ${message}`);
    }
  }

  /**
   * Removes the link between a trade and journal entry
   */
  async unlinkTradeFromJournal(userId: string, tradeId: string, journalDate: string): Promise<void> {
    try {
      const linkId = `${tradeId}_${journalDate}`;
      await this.removeTradeJournalLink(userId, linkId);
    } catch (error) {
      console.error('Error unlinking trade from journal:', error);
      throw new Error(`Failed to unlink trade from journal: ${error.message}`);
    }
  }

  /**
   * Gets all journal links for a trade
   */
  async getJournalLinksForTrade(userId: string, tradeId: string): Promise<TradeJournalLink[]> {
    try {
      // Query for all links associated with this trade
      const links = await this.queryTradeJournalLinks(userId, 'tradeId', tradeId);
      return links;
    } catch (error) {
      console.error('Error getting journal links for trade:', error);
      return [];
    }
  }

  /**
   * Gets all trade links for a journal entry
   */
  async getTradeLinksForJournal(userId: string, journalDate: string): Promise<TradeJournalLink[]> {
    try {
      // Query for all links associated with this journal date
      const links = await this.queryTradeJournalLinks(userId, 'journalDate', journalDate);
      return links;
    } catch (error) {
      console.error('Error getting trade links for journal:', error);
      return [];
    }
  }

  // ===== NAVIGATION HELPERS =====

  /**
   * Gets integration data for a trade (used by TradeLog component)
   */
  async getTradeIntegrationData(userId: string, tradeId: string): Promise<TradeLogIntegrationData> {
    try {
      // Get all journal links for this trade
      const links = await this.getJournalLinksForTrade(userId, tradeId);
      const hasJournalNotes = links.length > 0;

      // Get the most recent journal entry
      const latestLink = links.sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )[0];

      // Get screenshot count from the most recent journal entry
      let screenshotCount = 0;
      if (latestLink) {
        const journalEntry = await journalDataService.getJournalEntry(userId, latestLink.journalDate);
        if (journalEntry) {
          // Count screenshots in all sections (this would need to be implemented based on journal structure)
          screenshotCount = this.countScreenshotsInJournalEntry(journalEntry);
        }
      }

      return {
        tradeId,
        hasJournalNotes,
        journalEntryId: latestLink?.journalEntryId,
        lastNoteDate: latestLink ? new Date(latestLink.updatedAt) : undefined,
        noteCount: links.length,
        screenshotCount,
        canNavigateToNotes: hasJournalNotes
      };
    } catch (error) {
      console.error('Error getting trade integration data:', error);
      return {
        tradeId,
        hasJournalNotes: false,
        journalEntryId: undefined,
        lastNoteDate: undefined,
        noteCount: 0,
        screenshotCount: 0,
        canNavigateToNotes: false
      };
    }
  }

  /**
   * Navigates from TradeLog to Daily Journal with proper context
   */
  async navigateToJournalFromTrade(
    userId: string,
    tradeId: string,
    navigationCallback: (navigationState: DailyJournalNavigationState) => void
  ): Promise<void> {
    try {
      // Get the trade to extract date information
      const trade = await tradeService.getTrade(userId, tradeId);
      if (!trade) {
        throw new Error('Trade not found');
      }

      // Get journal links for this trade
      const links = await this.getJournalLinksForTrade(userId, tradeId);

      let targetDate: Date;
      let entryType: 'trade-note' | 'daily-journal' | 'empty' = 'empty';

      if (links.length > 0) {
        // Navigate to the most recent journal entry
        const latestLink = links.sort((a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )[0];

        targetDate = new Date(latestLink.journalDate);
        entryType = 'trade-note'; // Assuming trade links point to trade notes
      } else {
        // Navigate to the trade date even if no journal entry exists
        targetDate = new Date(trade.date);
      }

      // Create navigation state
      const navigationState: DailyJournalNavigationState = {
        selectedDate: targetDate,
        selectedWeek: this.getWeekRangeForDate(targetDate),
        selectedTradeId: tradeId,
        entryType,
        viewMode: 'content',
        isNavigating: true
      };

      // Call the navigation callback
      navigationCallback(navigationState);
    } catch (error) {
      console.error('Error navigating to journal from trade:', error);
      throw new Error(`Navigation failed: ${error.message}`);
    }
  }

  /**
   * Navigates from Daily Journal back to TradeLog with context
   */
  async navigateToTradeFromJournal(
    userId: string,
    journalDate: string,
    navigationCallback: (tradeId: string, context: NavigationContext) => void
  ): Promise<void> {
    try {
      // Get all trade links for this journal date
      const links = await this.getTradeLinksForJournal(userId, journalDate);

      if (links.length === 0) {
        throw new Error('No trades linked to this journal entry');
      }

      // Navigate to the most recently linked trade
      const latestLink = links.sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )[0];

      // Create navigation context
      const context: NavigationContext = {
        source: 'daily-journal',
        sourceParams: {
          date: journalDate,
          journalEntryId: latestLink.journalEntryId,
          viewMode: 'trade-focus'
        },
        breadcrumb: ['Dashboard', 'Daily Journal', 'Trade Details'],
        timestamp: Date.now()
      };

      // Call the navigation callback
      navigationCallback(latestLink.tradeId, context);
    } catch (error) {
      console.error('Error navigating to trade from journal:', error);
      throw new Error(`Navigation failed: ${error.message}`);
    }
  }

  // ===== AUTO-LINKING =====

  /**
   * Automatically links trades to journal entries based on date matching
   */
  async autoLinkTradesToJournal(userId: string, date: string): Promise<number> {
    try {
      // Get all trades for the specified date
      const trades = await tradeService.getTradesForDate(userId, date);

      // Get the journal entry for this date
      const journalEntry = await journalDataService.getJournalEntry(userId, date);

      if (!journalEntry) {
        return 0; // No journal entry to link to
      }

      let linkCount = 0;

      // Link each trade to the journal entry
      for (const trade of trades) {
        try {
          await this.linkTradeToJournal(userId, trade.id, date, 'auto');
          linkCount++;
        } catch (error) {
          // Skip individual trade linking errors to continue with others
          console.warn(`Failed to auto-link trade ${trade.id}:`, error);
        }
      }

      return linkCount;
    } catch (error) {
      console.error('Error in auto-linking trades to journal:', error);
      return 0;
    }
  }

  /**
   * Batch auto-linking for multiple dates
   */
  async batchAutoLinkTrades(userId: string, startDate: string, endDate: string): Promise<{
    totalProcessed: number;
    totalLinked: number;
    errors: string[];
  }> {
    try {
      const result = {
        totalProcessed: 0,
        totalLinked: 0,
        errors: [] as string[]
      };

      const start = new Date(startDate);
      const end = new Date(endDate);

      // Process each date in the range
      for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0];
        result.totalProcessed++;

        try {
          const linked = await this.autoLinkTradesToJournal(userId, dateStr);
          result.totalLinked += linked;
        } catch (error) {
          result.errors.push(`Failed to process ${dateStr}: ${error.message}`);
        }
      }

      return result;
    } catch (error) {
      console.error('Error in batch auto-linking:', error);
      throw error;
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Gets week range for a given date
   */
  private getWeekRangeForDate(date: Date): WeekRange {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
    startOfWeek.setDate(diff);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 4); // Friday

    const weekNumber = this.getWeekNumber(startOfWeek);
    const year = startOfWeek.getFullYear();

    return {
      startDate: startOfWeek,
      endDate: endOfWeek,
      weekNumber,
      year,
      displayName: `Week of ${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    };
  }

  /**
   * Gets ISO week number for a date
   */
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  /**
   * Counts screenshots in a journal entry
   */
  private countScreenshotsInJournalEntry(entry: JournalEntry): number {
    // This is a simplified implementation
    // In a real implementation, you'd need to parse the journal sections
    // for screenshot attachments based on your journal structure
    return 0; // Placeholder
  }

  // ===== FIRESTORE OPERATIONS =====

  /**
   * Stores a trade-journal link in Firestore
   */
  private async storeTradeJournalLink(link: TradeJournalLink): Promise<void> {
    try {
      // Store in user's trade-journal links collection
      const docRef = doc(db, TRADE_JOURNAL_LINKS_COLLECTION, link.userId, 'links', link.id);
      await setDoc(docRef, {
        ...link,
        createdAt: Timestamp.fromDate(new Date(link.createdAt)),
        updatedAt: Timestamp.fromDate(new Date(link.updatedAt))
      });
    } catch (error) {
      console.error('Error storing trade-journal link:', error);
      throw error;
    }
  }

  /**
   * Removes a trade-journal link from Firestore
   */
  private async removeTradeJournalLink(userId: string, linkId: string): Promise<void> {
    try {
      const docRef = doc(db, TRADE_JOURNAL_LINKS_COLLECTION, userId, 'links', linkId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error removing trade-journal link:', error);
      throw error;
    }
  }

  /**
   * Queries trade-journal links
   */
  private async queryTradeJournalLinks(
    userId: string,
    field: 'tradeId' | 'journalDate',
    value: string
  ): Promise<TradeJournalLink[]> {
    try {
      const collectionRef = collection(db, TRADE_JOURNAL_LINKS_COLLECTION, userId, 'links');
      const q = query(collectionRef, where(field, '==', value));
      const querySnapshot = await getDocs(q);

      const links: TradeJournalLink[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        links.push({
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
        } as TradeJournalLink);
      });

      return links;
    } catch (error) {
      console.error('Error querying trade-journal links:', error);
      return [];
    }
  }

  // ===== SUBSCRIPTION MANAGEMENT =====

  /**
   * Subscribes to changes in trade-journal links for a user
   */
  subscribeToLinks(
    userId: string,
    callback: (links: TradeJournalLink[]) => void
  ): () => void {
    const collectionRef = collection(db, TRADE_JOURNAL_LINKS_COLLECTION, userId, 'links');
    const q = query(collectionRef, orderBy('updatedAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const links: TradeJournalLink[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          links.push({
            ...data,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
          } as TradeJournalLink);
        });
        callback(links);
      },
      (error) => {
        console.error('Error in links subscription:', error);
        callback([]);
      }
    );

    const subscriptionKey = `links_${userId}`;
    this.activeSubscriptions.set(subscriptionKey, unsubscribe);

    return () => {
      unsubscribe();
      this.activeSubscriptions.delete(subscriptionKey);
    };
  }

  /**
   * Cleans up all active subscriptions
   */
  cleanup(): void {
    this.activeSubscriptions.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.activeSubscriptions.clear();
  }
}

// Import required Firebase functions (need to be added at top)
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Default service instance
 */
export const tradeLogIntegrationService = TradeLogIntegrationService.getInstance();

/**
 * Utility functions for integration
 */
export const integrationUtils = {
  /**
   * Checks if a date has any linked trades
   */
  async hasLinkedTrades(userId: string, date: string): Promise<boolean> {
    const links = await tradeLogIntegrationService.getTradeLinksForJournal(userId, date);
    return links.length > 0;
  },

  /**
   * Gets the most relevant trade for a journal entry
   */
  async getPrimaryTradeForJournal(userId: string, date: string): Promise<Trade | null> {
    try {
      const links = await tradeLogIntegrationService.getTradeLinksForJournal(userId, date);
      if (links.length === 0) return null;

      // Get the most recently linked trade
      const latestLink = links.sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )[0];

      return await tradeService.getTrade(userId, latestLink.tradeId);
    } catch (error) {
      console.error('Error getting primary trade for journal:', error);
      return null;
    }
  }

};