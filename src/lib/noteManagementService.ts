/**
 * Note Management Service
 * Handles advanced note operations including versioning, templates, and sanitization
 */

import { 
  TradeNotes, 
  NoteVersion, 
  NoteTemplate 
} from '../types/tradeReview';
import DOMPurify from 'dompurify';

class NoteManagementService {
  private static instance: NoteManagementService;
  private noteHistory: Map<string, NoteVersion[]> = new Map();
  private templates: NoteTemplate[] = [];

  private constructor() {
    this.initializeDefaultTemplates();
  }

  public static getInstance(): NoteManagementService {
    if (!NoteManagementService.instance) {
      NoteManagementService.instance = new NoteManagementService();
    }
    return NoteManagementService.instance;
  }

  /**
   * Initialize default note templates
   */
  private initializeDefaultTemplates(): void {
    this.templates = [
      {
        id: 'comprehensive-analysis',
        name: 'Comprehensive Analysis',
        category: 'detailed',
        description: 'Complete trade analysis template with all sections',
        template: {
          preTradeAnalysis: `Market Structure:
- Higher timeframe trend: 
- Key levels: 
- Confluence factors: 

Setup:
- Entry reason: 
- Risk management plan: 
- Target levels: `,
          executionNotes: `Entry Execution:
- Fill quality: 
- Slippage: 
- Market conditions at entry: 
- Platform performance: `,
          postTradeReflection: `Trade Outcome:
- What went well: 
- What could be improved: 
- Market behavior vs expectations: 
- Execution efficiency: `,
          lessonsLearned: `Key Takeaways:
- Technical lessons: 
- Psychological insights: 
- Process improvements: 
- Future considerations: `
        }
      },
      {
        id: 'quick-scalp',
        name: 'Quick Scalp',
        category: 'scalping',
        description: 'Template for quick scalping trades',
        template: {
          preTradeAnalysis: `Quick Setup:
- Entry signal: 
- Market conditions: 
- Risk/reward: `,
          executionNotes: `Execution:
- Entry timing: 
- Exit timing: 
- Platform performance: `,
          postTradeReflection: `Result:
- Profit/loss: 
- Execution quality: 
- Market reaction: `,
          lessonsLearned: `Improvements:
- Timing: 
- Risk management: 
- Platform optimization: `
        }
      },
      {
        id: 'swing-trade',
        name: 'Swing Trade',
        category: 'swing',
        description: 'Template for swing trading positions',
        template: {
          preTradeAnalysis: `Swing Analysis:
- Weekly/daily trend: 
- Key support/resistance: 
- Fundamental factors: 
- Position sizing: `,
          executionNotes: `Position Management:
- Entry execution: 
- Partial closes: 
- Stop adjustments: 
- Market events: `,
          postTradeReflection: `Trade Review:
- Overall performance: 
- Position management: 
- Market development: 
- Timing analysis: `,
          lessonsLearned: `Strategic Insights:
- Market timing: 
- Position sizing: 
- Risk management: 
- Patience and discipline: `
        }
      },
      {
        id: 'news-trade',
        name: 'News Trade',
        category: 'news',
        description: 'Template for news-based trades',
        template: {
          preTradeAnalysis: `News Event:
- Event type: 
- Expected impact: 
- Market positioning: 
- Risk factors: `,
          executionNotes: `News Execution:
- Event outcome: 
- Market reaction: 
- Entry timing: 
- Volatility impact: `,
          postTradeReflection: `News Analysis:
- Reaction vs expectation: 
- Market efficiency: 
- Execution challenges: 
- Volatility management: `,
          lessonsLearned: `News Trading Insights:
- Event interpretation: 
- Market reaction patterns: 
- Risk management: 
- Timing optimization: `
        }
      },
      {
        id: 'minimal',
        name: 'Minimal Notes',
        category: 'simple',
        description: 'Simple template for basic note-taking',
        template: {
          generalNotes: `Trade Summary:
- Setup: 
- Execution: 
- Result: 
- Lesson: `
        }
      }
    ];
  }

  /**
   * Save notes with versioning
   */
  public async saveNotes(tradeId: string, notes: TradeNotes): Promise<void> {
    try {
      // Sanitize notes content
      const sanitizedNotes = this.sanitizeNotes(notes);
      
      // Get current version history
      const history = this.noteHistory.get(tradeId) || [];
      
      // Create new version
      const newVersion: NoteVersion = {
        version: history.length + 1,
        content: sanitizedNotes,
        timestamp: new Date().toISOString(),
        changes: this.calculateChanges(history[history.length - 1]?.content, sanitizedNotes)
      };
      
      // Add to history
      history.push(newVersion);
      this.noteHistory.set(tradeId, history);
      
      // In a real implementation, this would save to Firebase/database
      // For now, we'll use localStorage as a fallback
      this.saveToLocalStorage(tradeId, history);
      
    } catch (error) {
      console.error('Error saving notes:', error);
      throw new Error('Failed to save notes');
    }
  }

  /**
   * Get note history for a trade
   */
  public async getNoteHistory(tradeId: string): Promise<NoteVersion[]> {
    try {
      // Try to get from memory first
      let history = this.noteHistory.get(tradeId);
      
      // If not in memory, try localStorage
      if (!history) {
        history = this.loadFromLocalStorage(tradeId);
        if (history) {
          this.noteHistory.set(tradeId, history);
        }
      }
      
      return history || [];
    } catch (error) {
      console.error('Error getting note history:', error);
      return [];
    }
  }

  /**
   * Get the latest notes for a trade
   */
  public async getLatestNotes(tradeId: string): Promise<TradeNotes | null> {
    try {
      const history = await this.getNoteHistory(tradeId);
      return history.length > 0 ? history[history.length - 1].content : null;
    } catch (error) {
      console.error('Error getting latest notes:', error);
      return null;
    }
  }

  /**
   * Apply a template to existing notes
   */
  public applyTemplate(template: NoteTemplate, existingNotes?: TradeNotes): TradeNotes {
    const now = new Date().toISOString();
    
    // Merge template with existing notes, preserving existing content
    const mergedNotes: TradeNotes = {
      preTradeAnalysis: existingNotes?.preTradeAnalysis || template.template.preTradeAnalysis || '',
      executionNotes: existingNotes?.executionNotes || template.template.executionNotes || '',
      postTradeReflection: existingNotes?.postTradeReflection || template.template.postTradeReflection || '',
      lessonsLearned: existingNotes?.lessonsLearned || template.template.lessonsLearned || '',
      generalNotes: existingNotes?.generalNotes || template.template.generalNotes || '',
      lastModified: now,
      version: (existingNotes?.version || 0) + 1
    };

    return mergedNotes;
  }

  /**
   * Get all available templates
   */
  public getTemplates(): NoteTemplate[] {
    return [...this.templates];
  }

  /**
   * Get templates by category
   */
  public getTemplatesByCategory(category: string): NoteTemplate[] {
    return this.templates.filter(template => template.category === category);
  }

  /**
   * Create a custom template
   */
  public createTemplate(name: string, notes: TradeNotes, category: string = 'custom', description: string = ''): NoteTemplate {
    const template: NoteTemplate = {
      id: `custom-${Date.now()}`,
      name,
      category,
      description,
      template: {
        preTradeAnalysis: notes.preTradeAnalysis,
        executionNotes: notes.executionNotes,
        postTradeReflection: notes.postTradeReflection,
        lessonsLearned: notes.lessonsLearned,
        generalNotes: notes.generalNotes
      }
    };

    this.templates.push(template);
    this.saveTemplatesToLocalStorage();
    
    return template;
  }

  /**
   * Delete a custom template
   */
  public deleteTemplate(templateId: string): boolean {
    const index = this.templates.findIndex(t => t.id === templateId && t.category === 'custom');
    if (index > -1) {
      this.templates.splice(index, 1);
      this.saveTemplatesToLocalStorage();
      return true;
    }
    return false;
  }

  /**
   * Compare two note versions
   */
  public compareVersions(version1: NoteVersion, version2: NoteVersion): { [key: string]: { old: string; new: string } } {
    const differences: { [key: string]: { old: string; new: string } } = {};
    
    const fields: (keyof TradeNotes)[] = ['preTradeAnalysis', 'executionNotes', 'postTradeReflection', 'lessonsLearned', 'generalNotes'];
    
    fields.forEach(field => {
      const oldValue = version1.content[field] || '';
      const newValue = version2.content[field] || '';
      
      if (oldValue !== newValue) {
        differences[field] = { old: oldValue, new: newValue };
      }
    });
    
    return differences;
  }

  /**
   * Sanitize notes content to prevent XSS
   */
  private sanitizeNotes(notes: TradeNotes): TradeNotes {
    return {
      preTradeAnalysis: notes.preTradeAnalysis ? DOMPurify.sanitize(notes.preTradeAnalysis) : notes.preTradeAnalysis,
      executionNotes: notes.executionNotes ? DOMPurify.sanitize(notes.executionNotes) : notes.executionNotes,
      postTradeReflection: notes.postTradeReflection ? DOMPurify.sanitize(notes.postTradeReflection) : notes.postTradeReflection,
      lessonsLearned: notes.lessonsLearned ? DOMPurify.sanitize(notes.lessonsLearned) : notes.lessonsLearned,
      generalNotes: notes.generalNotes ? DOMPurify.sanitize(notes.generalNotes) : notes.generalNotes,
      lastModified: notes.lastModified,
      version: notes.version
    };
  }

  /**
   * Calculate changes between two note versions
   */
  private calculateChanges(oldNotes?: TradeNotes, newNotes?: TradeNotes): string[] {
    if (!oldNotes || !newNotes) return ['Initial version'];
    
    const changes: string[] = [];
    const fields: (keyof TradeNotes)[] = ['preTradeAnalysis', 'executionNotes', 'postTradeReflection', 'lessonsLearned', 'generalNotes'];
    
    fields.forEach(field => {
      const oldValue = oldNotes[field] || '';
      const newValue = newNotes[field] || '';
      
      if (oldValue !== newValue) {
        if (!oldValue && newValue) {
          changes.push(`Added ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        } else if (oldValue && !newValue) {
          changes.push(`Removed ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        } else {
          changes.push(`Updated ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        }
      }
    });
    
    return changes.length > 0 ? changes : ['Minor changes'];
  }

  /**
   * Save to localStorage as fallback
   */
  private saveToLocalStorage(tradeId: string, history: NoteVersion[]): void {
    try {
      localStorage.setItem(`trade-notes-${tradeId}`, JSON.stringify(history));
    } catch (error) {
      console.warn('Failed to save notes to localStorage:', error);
      throw error; // Re-throw for testing purposes
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromLocalStorage(tradeId: string): NoteVersion[] | null {
    try {
      const data = localStorage.getItem(`trade-notes-${tradeId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('Failed to load notes from localStorage:', error);
      return null;
    }
  }

  /**
   * Save templates to localStorage
   */
  private saveTemplatesToLocalStorage(): void {
    try {
      const customTemplates = this.templates.filter(t => t.category === 'custom');
      localStorage.setItem('note-templates', JSON.stringify(customTemplates));
    } catch (error) {
      console.warn('Failed to save templates to localStorage:', error);
    }
  }

  /**
   * Load custom templates from localStorage
   */
  private loadCustomTemplatesFromLocalStorage(): void {
    try {
      const data = localStorage.getItem('note-templates');
      if (data) {
        const customTemplates: NoteTemplate[] = JSON.parse(data);
        this.templates.push(...customTemplates);
      }
    } catch (error) {
      console.warn('Failed to load custom templates from localStorage:', error);
    }
  }

  /**
   * Get note statistics
   */
  public getNoteStatistics(tradeId: string): Promise<{
    totalVersions: number;
    totalCharacters: number;
    lastModified: string;
    completionScore: number;
  }> {
    return this.getNoteHistory(tradeId).then(history => {
      if (history.length === 0) {
        return {
          totalVersions: 0,
          totalCharacters: 0,
          lastModified: '',
          completionScore: 0
        };
      }

      const latest = history[history.length - 1];
      const totalCharacters = Object.values(latest.content)
        .filter(value => typeof value === 'string')
        .join('').length;

      // Calculate completion score based on filled sections
      const sections = ['preTradeAnalysis', 'executionNotes', 'postTradeReflection', 'lessonsLearned', 'generalNotes'];
      const filledSections = sections.filter(section => {
        const value = latest.content[section as keyof TradeNotes];
        return value && typeof value === 'string' && value.trim().length > 0;
      });
      
      const completionScore = Math.round((filledSections.length / sections.length) * 100);

      return {
        totalVersions: history.length,
        totalCharacters,
        lastModified: latest.timestamp,
        completionScore
      };
    });
  }
}

export default NoteManagementService.getInstance();