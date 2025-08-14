import { Trade, TradeSetup, TradePattern, PartialClose, PositionEvent, ValidationResult } from '../types/trade';
import { tradeService } from './firebaseService';

/**
 * Enhanced Data Migration Service for Advanced Trade Features
 * Handles migration of existing trade data to support new classification features
 */
export class EnhancedDataMigrationService {
  private static readonly MIGRATION_VERSION_KEY = 'enhancedFeaturesMigrationVersion';
  private static readonly CURRENT_VERSION = '1.0.0';

  /**
   * Check if enhanced features migration has been completed
   */
  static isEnhancedMigrationCompleted(): boolean {
    const version = localStorage.getItem(this.MIGRATION_VERSION_KEY);
    return version === this.CURRENT_VERSION;
  }

  /**
   * Mark enhanced features migration as completed
   */
  static markEnhancedMigrationCompleted(): void {
    localStorage.setItem(this.MIGRATION_VERSION_KEY, this.CURRENT_VERSION);
  }

  /**
   * Migrate existing trades to support enhanced features
   * Adds optional fields for backward compatibility
   */
  static async migrateExistingTrades(userId: string): Promise<{
    success: boolean;
    migrated: number;
    errors: string[];
    skipped: number;
  }> {
    const errors: string[] = [];
    let migrated = 0;
    let skipped = 0;

    try {
      // Check if migration already completed
      if (this.isEnhancedMigrationCompleted()) {
        console.log('Enhanced features migration already completed, skipping...');
        return { success: true, migrated: 0, errors: [], skipped: 0 };
      }

      // Get all existing trades
      const existingTrades = await tradeService.getTrades(userId);
      console.log(`Found ${existingTrades.length} trades to check for migration`);

      for (const trade of existingTrades) {
        try {
          // Check if trade already has enhanced features
          if (this.hasEnhancedFeatures(trade)) {
            skipped++;
            continue;
          }

          // Migrate trade to enhanced format
          const migratedTrade = this.migrateTradeToEnhanced(trade);
          
          // Validate migrated trade
          const validation = this.validateMigratedTrade(migratedTrade);
          if (!validation.isValid) {
            errors.push(`Trade ${trade.id} validation failed: ${validation.errors.join(', ')}`);
            continue;
          }

          // Update trade in Firebase
          await tradeService.updateTrade(userId, trade.id, migratedTrade);
          migrated++;

        } catch (error) {
          console.error('Error migrating trade:', trade.id, error);
          errors.push(`Failed to migrate trade ${trade.id}: ${error}`);
        }
      }

      // Mark migration as completed if no errors
      if (errors.length === 0) {
        this.markEnhancedMigrationCompleted();
        console.log(`Enhanced features migration completed successfully! Migrated: ${migrated}, Skipped: ${skipped}`);
      } else {
        console.warn(`Enhanced features migration completed with errors. Migrated: ${migrated}, Errors: ${errors.length}`);
      }

      return {
        success: errors.length === 0,
        migrated,
        errors,
        skipped
      };

    } catch (error) {
      console.error('Enhanced features migration failed:', error);
      errors.push(`Migration failed: ${error}`);
      return {
        success: false,
        migrated,
        errors,
        skipped
      };
    }
  }

  /**
   * Check if a trade already has enhanced features
   */
  private static hasEnhancedFeatures(trade: Trade): boolean {
    return !!(
      trade.setup || 
      trade.patterns || 
      trade.partialCloses || 
      trade.positionHistory ||
      trade.setupPerformance ||
      trade.patternConfluence !== undefined ||
      trade.positionManagementScore !== undefined
    );
  }

  /**
   * Migrate a trade to enhanced format with optional fields
   */
  private static migrateTradeToEnhanced(trade: Trade): Partial<Trade> {
    const migratedTrade: Partial<Trade> = {
      // Initialize enhanced features as undefined for backward compatibility
      setup: undefined,
      patterns: undefined,
      partialCloses: undefined,
      positionHistory: undefined,
      setupPerformance: undefined,
      patternConfluence: undefined,
      positionManagementScore: undefined,
    };

    // If trade is closed, create basic position history
    if (trade.status === 'closed' && trade.entryPrice && trade.exitPrice) {
      migratedTrade.positionHistory = this.createBasicPositionHistory(trade);
    }

    return migratedTrade;
  }

  /**
   * Create basic position history for closed trades
   */
  private static createBasicPositionHistory(trade: Trade): PositionEvent[] {
    const events: PositionEvent[] = [];

    // Entry event
    events.push({
      id: `entry_${trade.id}`,
      timestamp: `${trade.date}T${trade.timeIn || '00:00:00'}`,
      type: 'entry',
      lotSize: trade.lotSize,
      price: trade.entryPrice,
      totalPosition: trade.lotSize,
      averagePrice: trade.entryPrice
    });

    // Exit event (if trade is closed)
    if (trade.status === 'closed' && trade.exitPrice && trade.timeOut) {
      events.push({
        id: `exit_${trade.id}`,
        timestamp: `${trade.date}T${trade.timeOut}`,
        type: 'full_close',
        lotSize: trade.lotSize,
        price: trade.exitPrice,
        totalPosition: 0,
        averagePrice: trade.entryPrice
      });
    }

    return events;
  }

  /**
   * Validate migrated trade data
   */
  private static validateMigratedTrade(trade: Partial<Trade>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate position history if present
    if (trade.positionHistory) {
      const historyValidation = this.validatePositionHistory(trade.positionHistory);
      errors.push(...historyValidation.errors);
      warnings.push(...historyValidation.warnings);
    }

    // Validate setup if present
    if (trade.setup) {
      const setupValidation = this.validateTradeSetup(trade.setup);
      errors.push(...setupValidation.errors);
      warnings.push(...setupValidation.warnings);
    }

    // Validate patterns if present
    if (trade.patterns) {
      for (const pattern of trade.patterns) {
        const patternValidation = this.validateTradePattern(pattern);
        errors.push(...patternValidation.errors);
        warnings.push(...patternValidation.warnings);
      }
    }

    // Validate partial closes if present
    if (trade.partialCloses) {
      for (const partialClose of trade.partialCloses) {
        const partialValidation = this.validatePartialClose(partialClose);
        errors.push(...partialValidation.errors);
        warnings.push(...partialValidation.warnings);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate position history data
   */
  private static validatePositionHistory(history: PositionEvent[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (history.length === 0) {
      warnings.push('Position history is empty');
      return { isValid: true, errors, warnings };
    }

    // Check for required fields
    for (const event of history) {
      if (!event.id) errors.push('Position event missing ID');
      if (!event.timestamp) errors.push('Position event missing timestamp');
      if (!event.type) errors.push('Position event missing type');
      if (typeof event.lotSize !== 'number') errors.push('Position event missing or invalid lot size');
      if (typeof event.price !== 'number') errors.push('Position event missing or invalid price');
    }

    // Check chronological order
    for (let i = 1; i < history.length; i++) {
      const prevTime = new Date(history[i - 1].timestamp);
      const currTime = new Date(history[i].timestamp);
      if (currTime < prevTime) {
        warnings.push('Position events are not in chronological order');
        break;
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate trade setup data
   */
  private static validateTradeSetup(setup: TradeSetup): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!setup.id) errors.push('Setup missing ID');
    if (!setup.type) errors.push('Setup missing type');
    if (!setup.timeframe) errors.push('Setup missing timeframe');
    if (!setup.marketCondition) errors.push('Setup missing market condition');
    if (typeof setup.quality !== 'number' || setup.quality < 1 || setup.quality > 5) {
      errors.push('Setup quality must be a number between 1 and 5');
    }

    if (!setup.confluence || setup.confluence.length === 0) {
      warnings.push('Setup has no confluence factors');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate trade pattern data
   */
  private static validateTradePattern(pattern: TradePattern): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!pattern.id) errors.push('Pattern missing ID');
    if (!pattern.type) errors.push('Pattern missing type');
    if (!pattern.timeframe) errors.push('Pattern missing timeframe');
    if (typeof pattern.quality !== 'number' || pattern.quality < 1 || pattern.quality > 5) {
      errors.push('Pattern quality must be a number between 1 and 5');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate partial close data
   */
  private static validatePartialClose(partialClose: PartialClose): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!partialClose.id) errors.push('Partial close missing ID');
    if (!partialClose.timestamp) errors.push('Partial close missing timestamp');
    if (typeof partialClose.lotSize !== 'number' || partialClose.lotSize <= 0) {
      errors.push('Partial close lot size must be a positive number');
    }
    if (typeof partialClose.price !== 'number' || partialClose.price <= 0) {
      errors.push('Partial close price must be a positive number');
    }
    if (!partialClose.reason) errors.push('Partial close missing reason');

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Create retroactive classification interface data
   */
  static createRetroactiveClassificationData(trades: Trade[]): {
    unclassifiedTrades: Trade[];
    suggestedClassifications: { [tradeId: string]: any };
    migrationStats: {
      total: number;
      classified: number;
      unclassified: number;
      withPatterns: number;
      withPartialCloses: number;
    };
  } {
    const unclassifiedTrades: Trade[] = [];
    const suggestedClassifications: { [tradeId: string]: any } = {};
    
    let classified = 0;
    let withPatterns = 0;
    let withPartialCloses = 0;

    for (const trade of trades) {
      if (!this.hasEnhancedFeatures(trade)) {
        unclassifiedTrades.push(trade);
        
        // Generate suggested classifications based on existing trade data
        suggestedClassifications[trade.id] = this.generateSuggestedClassification(trade);
      } else {
        classified++;
        if (trade.patterns && trade.patterns.length > 0) withPatterns++;
        if (trade.partialCloses && trade.partialCloses.length > 0) withPartialCloses++;
      }
    }

    return {
      unclassifiedTrades,
      suggestedClassifications,
      migrationStats: {
        total: trades.length,
        classified,
        unclassified: unclassifiedTrades.length,
        withPatterns,
        withPartialCloses
      }
    };
  }

  /**
   * Generate suggested classification based on existing trade data
   */
  private static generateSuggestedClassification(trade: Trade): any {
    const suggestions: any = {
      setup: null,
      patterns: [],
      confidence: 0
    };

    // Analyze trade characteristics to suggest setup type
    if (trade.strategy) {
      suggestions.setup = this.suggestSetupFromStrategy(trade.strategy);
      suggestions.confidence += 0.3;
    }

    if (trade.marketConditions) {
      suggestions.patterns = this.suggestPatternsFromMarketConditions(trade.marketConditions);
      suggestions.confidence += 0.2;
    }

    if (trade.timeframe) {
      suggestions.confidence += 0.1;
    }

    if (trade.notes) {
      const noteAnalysis = this.analyzeNotesForClassification(trade.notes);
      if (noteAnalysis.setup) suggestions.setup = noteAnalysis.setup;
      if (noteAnalysis.patterns.length > 0) suggestions.patterns.push(...noteAnalysis.patterns);
      suggestions.confidence += noteAnalysis.confidence;
    }

    return suggestions;
  }

  /**
   * Suggest setup type from strategy string
   */
  private static suggestSetupFromStrategy(strategy: string): string | null {
    const strategyLower = strategy.toLowerCase();
    
    if (strategyLower.includes('trend') || strategyLower.includes('continuation')) {
      return 'trend_continuation';
    }
    if (strategyLower.includes('pullback') || strategyLower.includes('retracement')) {
      return 'pullback_entry';
    }
    if (strategyLower.includes('breakout')) {
      return 'range_breakout';
    }
    if (strategyLower.includes('support') || strategyLower.includes('resistance')) {
      return 'support_resistance_bounce';
    }
    if (strategyLower.includes('news') || strategyLower.includes('event')) {
      return 'news_reaction';
    }
    
    return null;
  }

  /**
   * Suggest patterns from market conditions
   */
  private static suggestPatternsFromMarketConditions(conditions: string): string[] {
    const patterns: string[] = [];
    const conditionsLower = conditions.toLowerCase();
    
    if (conditionsLower.includes('triangle')) patterns.push('triangle');
    if (conditionsLower.includes('flag')) patterns.push('flag');
    if (conditionsLower.includes('pennant')) patterns.push('pennant');
    if (conditionsLower.includes('support') || conditionsLower.includes('resistance')) {
      patterns.push('horizontal_level');
    }
    if (conditionsLower.includes('trend')) patterns.push('ascending_trend');
    if (conditionsLower.includes('fibonacci') || conditionsLower.includes('fib')) {
      patterns.push('retracement');
    }
    
    return patterns;
  }

  /**
   * Analyze notes for classification hints
   */
  private static analyzeNotesForClassification(notes: string): {
    setup: string | null;
    patterns: string[];
    confidence: number;
  } {
    const notesLower = notes.toLowerCase();
    let setup: string | null = null;
    const patterns: string[] = [];
    let confidence = 0;

    // Look for setup keywords
    if (notesLower.includes('breakout')) {
      setup = 'range_breakout';
      confidence += 0.2;
    }
    if (notesLower.includes('pullback')) {
      setup = 'pullback_entry';
      confidence += 0.2;
    }
    if (notesLower.includes('trend')) {
      setup = 'trend_continuation';
      confidence += 0.2;
    }

    // Look for pattern keywords
    if (notesLower.includes('doji')) patterns.push('doji');
    if (notesLower.includes('hammer')) patterns.push('hammer');
    if (notesLower.includes('engulfing')) patterns.push('engulfing');
    if (notesLower.includes('pin bar') || notesLower.includes('pinbar')) patterns.push('pin_bar');
    if (notesLower.includes('inside bar')) patterns.push('inside_bar');

    if (patterns.length > 0) confidence += 0.1 * patterns.length;

    return { setup, patterns, confidence: Math.min(confidence, 1.0) };
  }

  /**
   * Clean up invalid or corrupted data
   */
  static async cleanupInvalidData(userId: string): Promise<{
    success: boolean;
    cleaned: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let cleaned = 0;

    try {
      const trades = await tradeService.getTrades(userId);
      
      for (const trade of trades) {
        let needsUpdate = false;
        const updates: Partial<Trade> = {};

        // Clean up invalid setup data
        if (trade.setup && !this.validateTradeSetup(trade.setup).isValid) {
          updates.setup = undefined;
          needsUpdate = true;
        }

        // Clean up invalid patterns
        if (trade.patterns) {
          const validPatterns = trade.patterns.filter(pattern => 
            this.validateTradePattern(pattern).isValid
          );
          if (validPatterns.length !== trade.patterns.length) {
            updates.patterns = validPatterns.length > 0 ? validPatterns : undefined;
            needsUpdate = true;
          }
        }

        // Clean up invalid partial closes
        if (trade.partialCloses) {
          const validPartialCloses = trade.partialCloses.filter(pc => 
            this.validatePartialClose(pc).isValid
          );
          if (validPartialCloses.length !== trade.partialCloses.length) {
            updates.partialCloses = validPartialCloses.length > 0 ? validPartialCloses : undefined;
            needsUpdate = true;
          }
        }

        // Clean up invalid position history
        if (trade.positionHistory) {
          const validHistory = trade.positionHistory.filter(event => 
            event.id && event.timestamp && event.type && 
            typeof event.lotSize === 'number' && typeof event.price === 'number'
          );
          if (validHistory.length !== trade.positionHistory.length) {
            updates.positionHistory = validHistory.length > 0 ? validHistory : undefined;
            needsUpdate = true;
          }
        }

        if (needsUpdate) {
          await tradeService.updateTrade(userId, trade.id, updates);
          cleaned++;
        }
      }

      return { success: true, cleaned, errors };

    } catch (error) {
      console.error('Data cleanup failed:', error);
      errors.push(`Cleanup failed: ${error}`);
      return { success: false, cleaned, errors };
    }
  }
}