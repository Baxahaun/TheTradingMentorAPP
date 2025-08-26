export interface ExportOptions {
  format: 'pdf' | 'csv' | 'json';
  includeCharts?: boolean;
  anonymize?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  template?: ReportTemplate;
}

export interface ReportTemplate {
  id: string;
  name: string;
  sections: ReportSection[];
  styling: ReportStyling;
}

export interface ReportSection {
  type: 'summary' | 'performance' | 'trades' | 'charts' | 'insights';
  title: string;
  enabled: boolean;
  config?: Record<string, any>;
}

export interface ReportStyling {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  fontSize: number;
  includeHeader: boolean;
  includeFooter: boolean;
}

export interface ExportResult {
  success: boolean;
  data?: Blob | string;
  filename: string;
  error?: string;
}

export interface ShareableReport {
  id: string;
  strategyId: string;
  reportType: 'summary' | 'detailed' | 'custom';
  anonymized: boolean;
  createdAt: string;
  expiresAt?: string;
  accessCount: number;
  maxAccess?: number;
  shareUrl?: string;
}

export interface ExportPreferences {
  defaultFormat: 'pdf' | 'csv';
  defaultTemplate: string;
  autoAnonymize: boolean;
  includeChartsDefault: boolean;
  defaultDateRange: 'all' | '1m' | '3m' | '6m' | '1y';
}