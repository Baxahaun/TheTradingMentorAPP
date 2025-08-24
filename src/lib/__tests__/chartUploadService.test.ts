import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  ref
} from 'firebase/storage';
import { 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { chartUploadService } from '../chartUploadService';
import { TradeChart } from '@/types/tradeReview';

// Mock Firebase modules
vi.mock('firebase/storage');
vi.mock('firebase/firestore');
vi.mock('../firebase', () => ({
  storage: {},
  db: {}
}));

const mockUploadBytes = vi.mocked(uploadBytes);
const mockGetDownloadURL = vi.mocked(getDownloadURL);
const mockDeleteObject = vi.mocked(deleteObject);
const mockRef = vi.mocked(ref);
const mockSetDoc = vi.mocked(setDoc);
const mockGetDoc = vi.mocked(getDoc);
const mockUpdateDoc = vi.mocked(updateDoc);
const mockDeleteDoc = vi.mocked(deleteDoc);
const mockCollection = vi.mocked(collection);
const mockQuery = vi.mocked(query);
const mockWhere = vi.mocked(where);
const mockGetDocs = vi.mocked(getDocs);

// Mock file for testing
const createMockFile = (name: string, type: string, size: number): File => {
  const file = new File(['mock content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('ChartUploadService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('File Validation', () => {
    it('should accept valid image files', async () => {
      const validFile = createMockFile('chart.png', 'image/png', 1024 * 1024);
      
      mockRef.mockReturnValue({} as any);
      mockUploadBytes.mockResolvedValue({ ref: {} } as any);
      mockGetDownloadURL.mockResolvedValue('https://example.com/chart.png');
      mockSetDoc.mockResolvedValue();

      const result = await chartUploadService.uploadChart('trade-123', validFile);
      
      expect(result).toBeDefined();
      expect(result.url).toBe('https://example.com/chart.png');
      expect(result.type).toBe('analysis');
    });

    it('should reject invalid file types', async () => {
      const invalidFile = createMockFile('document.pdf', 'application/pdf', 1024);
      
      await expect(
        chartUploadService.uploadChart('trade-123', invalidFile)
      ).rejects.toThrow('Invalid file type: application/pdf');
    });

    it('should reject files that are too large', async () => {
      const largeFile = createMockFile('large.png', 'image/png', 15 * 1024 * 1024); // 15MB
      
      await expect(
        chartUploadService.uploadChart('trade-123', largeFile)
      ).rejects.toThrow('File size too large');
    });

    it('should reject files with names that are too long', async () => {
      const longName = 'a'.repeat(300) + '.png';
      const fileWithLongName = createMockFile(longName, 'image/png', 1024);
      
      await expect(
        chartUploadService.uploadChart('trade-123', fileWithLongName)
      ).rejects.toThrow('File name too long');
    });

    it('should accept all supported image formats', async () => {
      const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      
      mockRef.mockReturnValue({} as any);
      mockUploadBytes.mockResolvedValue({ ref: {} } as any);
      mockGetDownloadURL.mockResolvedValue('https://example.com/chart.png');
      mockSetDoc.mockResolvedValue();

      for (const type of supportedTypes) {
        const file = createMockFile(`chart.${type.split('/')[1]}`, type, 1024);
        
        await expect(
          chartUploadService.uploadChart('trade-123', file)
        ).resolves.toBeDefined();
      }
    });
  });

  describe('Upload Process', () => {
    it('should upload file with correct metadata', async () => {
      const file = createMockFile('test-chart.png', 'image/png', 1024 * 1024);
      const mockStorageRef = { path: 'charts/trade-123/test-chart.png' };
      
      mockRef.mockReturnValue(mockStorageRef as any);
      mockUploadBytes.mockResolvedValue({ ref: mockStorageRef } as any);
      mockGetDownloadURL.mockResolvedValue('https://example.com/chart.png');
      mockSetDoc.mockResolvedValue();

      await chartUploadService.uploadChart('trade-123', file, 'entry', '4h', 'Test description');
      
      expect(mockUploadBytes).toHaveBeenCalledWith(
        mockStorageRef,
        file,
        expect.objectContaining({
          contentType: 'image/png',
          customMetadata: expect.objectContaining({
            tradeId: 'trade-123',
            chartType: 'entry',
            timeframe: '4h',
            originalName: 'test-chart.png'
          })
        })
      );
    });

    it('should save chart metadata to Firestore', async () => {
      const file = createMockFile('test-chart.png', 'image/png', 1024 * 1024);
      
      mockRef.mockReturnValue({} as any);
      mockUploadBytes.mockResolvedValue({ ref: {} } as any);
      mockGetDownloadURL.mockResolvedValue('https://example.com/chart.png');
      mockSetDoc.mockResolvedValue();

      await chartUploadService.uploadChart('trade-123', file, 'exit', '1h', 'Exit chart');
      
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          tradeId: 'trade-123',
          type: 'exit',
          timeframe: '1h',
          description: 'Exit chart',
          url: 'https://example.com/chart.png',
          fileSize: 1024 * 1024,
          fileName: 'test-chart.png',
          contentType: 'image/png'
        })
      );
    });

    it('should handle upload failures gracefully', async () => {
      const file = createMockFile('test-chart.png', 'image/png', 1024);
      
      mockRef.mockReturnValue({} as any);
      mockUploadBytes.mockRejectedValue(new Error('Storage error'));

      await expect(
        chartUploadService.uploadChart('trade-123', file)
      ).rejects.toThrow('Storage error');
    });
  });

  describe('Chart Retrieval', () => {
    it('should get all charts for a trade', async () => {
      const mockQuerySnapshot = {
        forEach: vi.fn((callback) => {
          const mockDocs = [
            {
              data: () => ({
                id: 'chart1',
                url: 'https://example.com/chart1.png',
                type: 'entry',
                timeframe: '1h',
                uploadedAt: '2024-01-01T10:00:00Z',
                annotations: []
              })
            },
            {
              data: () => ({
                id: 'chart2',
                url: 'https://example.com/chart2.png',
                type: 'exit',
                timeframe: '4h',
                uploadedAt: '2024-01-01T11:00:00Z',
                annotations: []
              })
            }
          ];
          mockDocs.forEach(callback);
        })
      };

      mockCollection.mockReturnValue({} as any);
      mockQuery.mockReturnValue({} as any);
      mockWhere.mockReturnValue({} as any);
      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any);

      const charts = await chartUploadService.getChartsForTrade('trade-123');
      
      expect(charts).toHaveLength(2);
      expect(charts[0].id).toBe('chart2'); // Should be sorted by upload date (newest first)
      expect(charts[1].id).toBe('chart1');
    });

    it('should get specific chart by ID', async () => {
      const mockDoc = {
        exists: () => true,
        data: () => ({
          id: 'chart1',
          url: 'https://example.com/chart1.png',
          type: 'entry',
          timeframe: '1h',
          uploadedAt: '2024-01-01T10:00:00Z',
          annotations: []
        })
      };

      mockGetDoc.mockResolvedValue(mockDoc as any);

      const chart = await chartUploadService.getChart('chart1');
      
      expect(chart).toBeDefined();
      expect(chart!.id).toBe('chart1');
      expect(chart!.type).toBe('entry');
    });

    it('should return null for non-existent chart', async () => {
      const mockDoc = {
        exists: () => false
      };

      mockGetDoc.mockResolvedValue(mockDoc as any);

      const chart = await chartUploadService.getChart('non-existent');
      
      expect(chart).toBeNull();
    });
  });

  describe('Chart Updates', () => {
    it('should update chart metadata', async () => {
      const mockDoc = {
        exists: () => true,
        data: () => ({ tradeId: 'trade-123' })
      };

      mockGetDoc.mockResolvedValue(mockDoc as any);
      mockUpdateDoc.mockResolvedValue();

      const updatedChart: TradeChart = {
        id: 'chart1',
        url: 'https://example.com/chart1.png',
        type: 'analysis',
        timeframe: '1d',
        description: 'Updated description',
        uploadedAt: '2024-01-01T10:00:00Z',
        annotations: []
      };

      await chartUploadService.updateChart('trade-123', updatedChart);
      
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          type: 'analysis',
          timeframe: '1d',
          description: 'Updated description',
          annotations: []
        })
      );
    });

    it('should reject updates for charts from different trades', async () => {
      const mockDoc = {
        exists: () => true,
        data: () => ({ tradeId: 'different-trade' })
      };

      mockGetDoc.mockResolvedValue(mockDoc as any);

      const chart: TradeChart = {
        id: 'chart1',
        url: 'https://example.com/chart1.png',
        type: 'analysis',
        timeframe: '1d',
        uploadedAt: '2024-01-01T10:00:00Z',
        annotations: []
      };

      await expect(
        chartUploadService.updateChart('trade-123', chart)
      ).rejects.toThrow('Chart does not belong to this trade');
    });

    it('should update chart annotations', async () => {
      const mockDoc = {
        exists: () => true,
        data: () => ({ tradeId: 'trade-123' })
      };

      mockGetDoc.mockResolvedValue(mockDoc as any);
      mockUpdateDoc.mockResolvedValue();

      const annotations = [
        {
          id: 'annotation1',
          type: 'line' as const,
          coordinates: { x1: 10, y1: 20, x2: 30, y2: 40 },
          style: { color: '#ff0000', thickness: 2, opacity: 1 },
          timestamp: '2024-01-01T10:00:00Z'
        }
      ];

      await chartUploadService.updateAnnotations('trade-123', 'chart1', annotations);
      
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          annotations
        })
      );
    });
  });

  describe('Chart Deletion', () => {
    it('should delete chart and associated file', async () => {
      const mockDoc = {
        exists: () => true,
        data: () => ({ 
          tradeId: 'trade-123',
          filePath: 'charts/trade-123/chart1.png'
        })
      };

      mockGetDoc.mockResolvedValue(mockDoc as any);
      mockDeleteObject.mockResolvedValue();
      mockDeleteDoc.mockResolvedValue();
      mockRef.mockReturnValue({} as any);

      await chartUploadService.deleteChart('trade-123', 'chart1');
      
      expect(mockDeleteObject).toHaveBeenCalled();
      expect(mockDeleteDoc).toHaveBeenCalled();
    });

    it('should continue deletion even if file deletion fails', async () => {
      const mockDoc = {
        exists: () => true,
        data: () => ({ 
          tradeId: 'trade-123',
          filePath: 'charts/trade-123/chart1.png'
        })
      };

      mockGetDoc.mockResolvedValue(mockDoc as any);
      mockDeleteObject.mockRejectedValue(new Error('File not found'));
      mockDeleteDoc.mockResolvedValue();
      mockRef.mockReturnValue({} as any);

      // Should not throw error
      await chartUploadService.deleteChart('trade-123', 'chart1');
      
      expect(mockDeleteDoc).toHaveBeenCalled();
    });

    it('should reject deletion for charts from different trades', async () => {
      const mockDoc = {
        exists: () => true,
        data: () => ({ tradeId: 'different-trade' })
      };

      mockGetDoc.mockResolvedValue(mockDoc as any);

      await expect(
        chartUploadService.deleteChart('trade-123', 'chart1')
      ).rejects.toThrow('Chart does not belong to this trade');
    });
  });

  describe('Batch Operations', () => {
    it('should upload multiple charts', async () => {
      const files = [
        createMockFile('chart1.png', 'image/png', 1024),
        createMockFile('chart2.jpg', 'image/jpeg', 2048),
        createMockFile('invalid.pdf', 'application/pdf', 1024) // This should fail
      ];

      mockRef.mockReturnValue({} as any);
      mockUploadBytes.mockResolvedValue({ ref: {} } as any);
      mockGetDownloadURL.mockResolvedValue('https://example.com/chart.png');
      mockSetDoc.mockResolvedValue();

      const result = await chartUploadService.uploadMultipleCharts('trade-123', files);
      
      expect(result.successful).toHaveLength(2);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].error).toContain('Invalid file type');
    });
  });

  describe('Storage Usage', () => {
    it('should calculate storage usage for a trade', async () => {
      const mockQuerySnapshot = {
        forEach: vi.fn((callback) => {
          const mockDocs = [
            { data: () => ({ fileSize: 1024 * 1024 }) },
            { data: () => ({ fileSize: 2 * 1024 * 1024 }) },
            { data: () => ({ fileSize: 512 * 1024 }) }
          ];
          mockDocs.forEach(callback);
        })
      };

      mockCollection.mockReturnValue({} as any);
      mockQuery.mockReturnValue({} as any);
      mockWhere.mockReturnValue({} as any);
      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any);

      const usage = await chartUploadService.getStorageUsage('trade-123');
      
      expect(usage.totalSize).toBe(3.5 * 1024 * 1024); // 3.5MB
      expect(usage.chartCount).toBe(3);
    });
  });
});