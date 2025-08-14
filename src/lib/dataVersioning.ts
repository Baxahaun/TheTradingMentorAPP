/**
 * Data Versioning Service for Future Migration Compatibility
 * Handles version tracking and migration paths for trade data structure changes
 */
export class DataVersioningService {
  private static readonly VERSION_KEY = 'tradeDataVersion';
  private static readonly CURRENT_VERSION = '2.0.0'; // Enhanced features version
  
  // Version history and migration paths
  private static readonly VERSION_HISTORY = {
    '1.0.0': {
      description: 'Initial trade data structure',
      features: ['basic trade logging', 'account management'],
      migrationRequired: true
    },
    '1.1.0': {
      description: 'Added Firebase integration',
      features: ['cloud sync', 'real-time updates'],
      migrationRequired: false
    },
    '2.0.0': {
      description: 'Enhanced trade features',
      features: ['setup classification', 'pattern recognition', 'partial close tracking'],
      migrationRequired: true
    }
  };

  /**
   * Get current data version
   */
  static getCurrentVersion(): string {
    return localStorage.getItem(this.VERSION_KEY) || '1.0.0';
  }

  /**
   * Set current data version
   */
  static setCurrentVersion(version: string): void {
    localStorage.setItem(this.VERSION_KEY, version);
  }

  /**
   * Check if migration is needed
   */
  static isMigrationNeeded(): boolean {
    const currentVersion = this.getCurrentVersion();
    return currentVersion !== this.CURRENT_VERSION;
  }

  /**
   * Get migration path from current version to target version
   */
  static getMigrationPath(fromVersion?: string, toVersion?: string): string[] {
    const from = fromVersion || this.getCurrentVersion();
    const to = toVersion || this.CURRENT_VERSION;
    
    const versions = Object.keys(this.VERSION_HISTORY).sort();
    const fromIndex = versions.indexOf(from);
    const toIndex = versions.indexOf(to);
    
    if (fromIndex === -1 || toIndex === -1 || fromIndex >= toIndex) {
      return [];
    }
    
    return versions.slice(fromIndex + 1, toIndex + 1);
  }

  /**
   * Get version information
   */
  static getVersionInfo(version: string): any {
    return this.VERSION_HISTORY[version as keyof typeof this.VERSION_HISTORY] || null;
  }

  /**
   * Get all versions that require migration
   */
  static getVersionsRequiringMigration(): string[] {
    return Object.entries(this.VERSION_HISTORY)
      .filter(([_, info]) => info.migrationRequired)
      .map(([version, _]) => version);
  }

  /**
   * Check if specific version requires migration
   */
  static doesVersionRequireMigration(version: string): boolean {
    const versionInfo = this.getVersionInfo(version);
    return versionInfo ? versionInfo.migrationRequired : false;
  }

  /**
   * Get migration summary for user display
   */
  static getMigrationSummary(): {
    currentVersion: string;
    targetVersion: string;
    migrationPath: string[];
    newFeatures: string[];
    requiresMigration: boolean;
  } {
    const currentVersion = this.getCurrentVersion();
    const migrationPath = this.getMigrationPath();
    const newFeatures: string[] = [];
    
    // Collect new features from migration path
    migrationPath.forEach(version => {
      const versionInfo = this.getVersionInfo(version);
      if (versionInfo && versionInfo.features) {
        newFeatures.push(...versionInfo.features);
      }
    });

    return {
      currentVersion,
      targetVersion: this.CURRENT_VERSION,
      migrationPath,
      newFeatures: [...new Set(newFeatures)], // Remove duplicates
      requiresMigration: this.isMigrationNeeded()
    };
  }

  /**
   * Mark migration as completed for specific version
   */
  static markMigrationCompleted(version?: string): void {
    const targetVersion = version || this.CURRENT_VERSION;
    this.setCurrentVersion(targetVersion);
    
    // Store migration completion timestamp
    const migrationKey = `migration_${targetVersion}_completed`;
    localStorage.setItem(migrationKey, new Date().toISOString());
  }

  /**
   * Get migration history
   */
  static getMigrationHistory(): { [version: string]: string } {
    const history: { [version: string]: string } = {};
    
    Object.keys(this.VERSION_HISTORY).forEach(version => {
      const migrationKey = `migration_${version}_completed`;
      const timestamp = localStorage.getItem(migrationKey);
      if (timestamp) {
        history[version] = timestamp;
      }
    });
    
    return history;
  }

  /**
   * Validate data structure for specific version
   */
  static validateDataStructure(data: any, version: string): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    switch (version) {
      case '1.0.0':
        // Validate basic trade structure
        if (!data.id) errors.push('Trade missing ID');
        if (!data.currencyPair) errors.push('Trade missing currency pair');
        if (!data.date) errors.push('Trade missing date');
        if (!data.side) errors.push('Trade missing side');
        if (typeof data.entryPrice !== 'number') errors.push('Trade missing or invalid entry price');
        break;

      case '1.1.0':
        // Validate Firebase integration fields
        if (!data.accountId) warnings.push('Trade missing account ID (Firebase integration)');
        break;

      case '2.0.0':
        // Validate enhanced features
        if (data.setup) {
          if (!data.setup.id) errors.push('Setup missing ID');
          if (!data.setup.type) errors.push('Setup missing type');
          if (!data.setup.timeframe) errors.push('Setup missing timeframe');
        }
        
        if (data.patterns && Array.isArray(data.patterns)) {
          data.patterns.forEach((pattern: any, index: number) => {
            if (!pattern.id) errors.push(`Pattern ${index} missing ID`);
            if (!pattern.type) errors.push(`Pattern ${index} missing type`);
          });
        }
        
        if (data.partialCloses && Array.isArray(data.partialCloses)) {
          data.partialCloses.forEach((pc: any, index: number) => {
            if (!pc.id) errors.push(`Partial close ${index} missing ID`);
            if (typeof pc.lotSize !== 'number') errors.push(`Partial close ${index} missing lot size`);
          });
        }
        break;

      default:
        warnings.push(`Unknown version: ${version}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Create backup before migration
   */
  static createMigrationBackup(data: any): string {
    const backup = {
      version: this.getCurrentVersion(),
      timestamp: new Date().toISOString(),
      data: data
    };
    
    const backupKey = `migration_backup_${backup.version}_${Date.now()}`;
    const backupData = JSON.stringify(backup);
    
    try {
      localStorage.setItem(backupKey, backupData);
      return backupKey;
    } catch (error) {
      console.error('Failed to create migration backup:', error);
      return '';
    }
  }

  /**
   * Restore from migration backup
   */
  static restoreFromBackup(backupKey: string): boolean {
    try {
      const backupData = localStorage.getItem(backupKey);
      if (!backupData) {
        console.error('Backup not found:', backupKey);
        return false;
      }

      const backup = JSON.parse(backupData);
      
      // Restore version
      this.setCurrentVersion(backup.version);
      
      console.log('Restored from backup:', backup.version, backup.timestamp);
      return true;
    } catch (error) {
      console.error('Failed to restore from backup:', error);
      return false;
    }
  }

  /**
   * Clean up old migration backups
   */
  static cleanupOldBackups(keepCount: number = 5): void {
    try {
      const backupKeys: string[] = [];
      
      // Find all backup keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('migration_backup_')) {
          backupKeys.push(key);
        }
      }
      
      // Sort by timestamp (newest first)
      backupKeys.sort((a, b) => {
        const timestampA = parseInt(a.split('_').pop() || '0');
        const timestampB = parseInt(b.split('_').pop() || '0');
        return timestampB - timestampA;
      });
      
      // Remove old backups
      if (backupKeys.length > keepCount) {
        const toRemove = backupKeys.slice(keepCount);
        toRemove.forEach(key => localStorage.removeItem(key));
        console.log(`Cleaned up ${toRemove.length} old migration backups`);
      }
    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
    }
  }

  /**
   * Get storage usage information
   */
  static getStorageInfo(): {
    totalSize: number;
    backupSize: number;
    backupCount: number;
    availableSpace: number;
  } {
    let totalSize = 0;
    let backupSize = 0;
    let backupCount = 0;

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key) || '';
          const itemSize = key.length + value.length;
          totalSize += itemSize;
          
          if (key.startsWith('migration_backup_')) {
            backupSize += itemSize;
            backupCount++;
          }
        }
      }

      // Estimate available space (localStorage typically has 5-10MB limit)
      const estimatedLimit = 5 * 1024 * 1024; // 5MB
      const availableSpace = Math.max(0, estimatedLimit - totalSize);

      return {
        totalSize,
        backupSize,
        backupCount,
        availableSpace
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return {
        totalSize: 0,
        backupSize: 0,
        backupCount: 0,
        availableSpace: 0
      };
    }
  }
}