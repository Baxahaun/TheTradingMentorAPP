export class TagMigrationService {
  private static instance: TagMigrationService;

  private constructor() {}

  public static getInstance(): TagMigrationService {
    if (!TagMigrationService.instance) {
      TagMigrationService.instance = new TagMigrationService();
    }
    return TagMigrationService.instance;
  }

  test(): string {
    return 'working';
  }
}

export const tagMigrationService = TagMigrationService.getInstance();