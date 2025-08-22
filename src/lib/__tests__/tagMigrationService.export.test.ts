import { describe, it, expect } from 'vitest';

describe('TagMigrationService Export Test', () => {
  it('should be able to import tagService first', async () => {
    const tagServiceModule = await import('../tagService');
    console.log('TagService module:', Object.keys(tagServiceModule));
    expect(tagServiceModule.tagService).toBeDefined();
  });

  it('should be able to import the migration service', async () => {
    try {
      const module = await import('../tagMigrationService.minimal');
      console.log('Imported module:', Object.keys(module));
      const { tagMigrationService } = module;
      expect(tagMigrationService).toBeDefined();
      expect(typeof tagMigrationService.test).toBe('function');
    } catch (error) {
      console.error('Import error:', error);
      throw error;
    }
  });
});