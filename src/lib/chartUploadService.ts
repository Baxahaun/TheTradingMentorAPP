import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  getMetadata,
  updateMetadata
} from 'firebase/storage';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { storage, db } from './firebase';
import { TradeChart, ChartAnnotation } from '@/types/tradeReview';

/**
 * Chart Upload Service
 * Handles secure chart upload, validation, and management for trade review system
 */
class ChartUploadService {
  private readonly COLLECTION_NAME = 'trade-charts';
  private readonly STORAGE_PATH = 'charts';
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  /**
   * Validate uploaded file
   */
  private validateFile(file: File): void {
    // Check file type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      throw new Error(`Invalid file type: ${file.type}. Allowed types: ${this.ALLOWED_TYPES.join(', ')}`);
    }

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File size too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum allowed: ${this.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Check file name
    if (file.name.length > 255) {
      throw new Error('File name too long (max 255 characters)');
    }
  }

  /**
   * Generate secure file path
   */
  private generateFilePath(tradeId: string, file: File): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    return `${this.STORAGE_PATH}/${tradeId}/${timestamp}_${randomId}_${sanitizedName}`;
  }

  /**
   * Upload chart image to Firebase Storage
   */
  async uploadChart(
    tradeId: string, 
    file: File, 
    chartType: TradeChart['type'] = 'analysis',
    timeframe: string = '1h',
    description?: string
  ): Promise<TradeChart> {
    try {
      // Validate file
      this.validateFile(file);

      // Generate unique file path
      const filePath = this.generateFilePath(tradeId, file);
      const storageRef = ref(storage, filePath);

      // Upload file with metadata
      const metadata = {
        contentType: file.type,
        customMetadata: {
          tradeId,
          chartType,
          timeframe,
          originalName: file.name,
          uploadedBy: 'user', // TODO: Get from auth context
          uploadedAt: new Date().toISOString()
        }
      };

      const uploadResult = await uploadBytes(storageRef, file, metadata);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      // Create chart document
      const chartId = `chart_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      const chart: TradeChart = {
        id: chartId,
        url: downloadURL,
        type: chartType,
        timeframe,
        description,
        uploadedAt: new Date().toISOString(),
        annotations: []
      };

      // Save chart metadata to Firestore
      await setDoc(doc(db, this.COLLECTION_NAME, chartId), {
        ...chart,
        tradeId,
        filePath,
        fileSize: file.size,
        fileName: file.name,
        contentType: file.type
      });

      return chart;
    } catch (error) {
      console.error('Chart upload failed:', error);
      throw error;
    }
  }

  /**
   * Get all charts for a trade
   */
  async getChartsForTrade(tradeId: string): Promise<TradeChart[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('tradeId', '==', tradeId)
      );
      
      const querySnapshot = await getDocs(q);
      const charts: TradeChart[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        charts.push({
          id: data.id,
          url: data.url,
          type: data.type,
          timeframe: data.timeframe,
          description: data.description,
          uploadedAt: data.uploadedAt,
          annotations: data.annotations || []
        });
      });

      // Sort by upload date (newest first)
      return charts.sort((a, b) => 
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );
    } catch (error) {
      console.error('Failed to get charts for trade:', error);
      throw error;
    }
  }

  /**
   * Update chart metadata
   */
  async updateChart(tradeId: string, chart: TradeChart): Promise<void> {
    try {
      const chartRef = doc(db, this.COLLECTION_NAME, chart.id);
      
      // Verify chart belongs to trade
      const chartDoc = await getDoc(chartRef);
      if (!chartDoc.exists()) {
        throw new Error('Chart not found');
      }
      
      const chartData = chartDoc.data();
      if (chartData.tradeId !== tradeId) {
        throw new Error('Chart does not belong to this trade');
      }

      // Update chart metadata
      await updateDoc(chartRef, {
        type: chart.type,
        timeframe: chart.timeframe,
        description: chart.description,
        annotations: chart.annotations || [],
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to update chart:', error);
      throw error;
    }
  }

  /**
   * Delete chart and associated file
   */
  async deleteChart(tradeId: string, chartId: string): Promise<void> {
    try {
      const chartRef = doc(db, this.COLLECTION_NAME, chartId);
      
      // Get chart data
      const chartDoc = await getDoc(chartRef);
      if (!chartDoc.exists()) {
        throw new Error('Chart not found');
      }
      
      const chartData = chartDoc.data();
      if (chartData.tradeId !== tradeId) {
        throw new Error('Chart does not belong to this trade');
      }

      // Delete file from storage
      if (chartData.filePath) {
        const fileRef = ref(storage, chartData.filePath);
        try {
          await deleteObject(fileRef);
        } catch (storageError) {
          console.warn('Failed to delete file from storage:', storageError);
          // Continue with document deletion even if file deletion fails
        }
      }

      // Delete chart document
      await deleteDoc(chartRef);
    } catch (error) {
      console.error('Failed to delete chart:', error);
      throw error;
    }
  }

  /**
   * Update chart annotations
   */
  async updateAnnotations(tradeId: string, chartId: string, annotations: ChartAnnotation[]): Promise<void> {
    try {
      const chartRef = doc(db, this.COLLECTION_NAME, chartId);
      
      // Verify chart belongs to trade
      const chartDoc = await getDoc(chartRef);
      if (!chartDoc.exists()) {
        throw new Error('Chart not found');
      }
      
      const chartData = chartDoc.data();
      if (chartData.tradeId !== tradeId) {
        throw new Error('Chart does not belong to this trade');
      }

      // Update annotations
      await updateDoc(chartRef, {
        annotations,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to update annotations:', error);
      throw error;
    }
  }

  /**
   * Get chart by ID
   */
  async getChart(chartId: string): Promise<TradeChart | null> {
    try {
      const chartDoc = await getDoc(doc(db, this.COLLECTION_NAME, chartId));
      
      if (!chartDoc.exists()) {
        return null;
      }

      const data = chartDoc.data();
      return {
        id: data.id,
        url: data.url,
        type: data.type,
        timeframe: data.timeframe,
        description: data.description,
        uploadedAt: data.uploadedAt,
        annotations: data.annotations || []
      };
    } catch (error) {
      console.error('Failed to get chart:', error);
      throw error;
    }
  }

  /**
   * Batch upload multiple charts
   */
  async uploadMultipleCharts(
    tradeId: string,
    files: File[],
    defaultType: TradeChart['type'] = 'analysis',
    defaultTimeframe: string = '1h'
  ): Promise<{ successful: TradeChart[]; failed: { file: File; error: string }[] }> {
    const successful: TradeChart[] = [];
    const failed: { file: File; error: string }[] = [];

    for (const file of files) {
      try {
        const chart = await this.uploadChart(tradeId, file, defaultType, defaultTimeframe);
        successful.push(chart);
      } catch (error) {
        failed.push({
          file,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return { successful, failed };
  }

  /**
   * Get storage usage for a trade
   */
  async getStorageUsage(tradeId: string): Promise<{ totalSize: number; chartCount: number }> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('tradeId', '==', tradeId)
      );
      
      const querySnapshot = await getDocs(q);
      let totalSize = 0;
      let chartCount = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        totalSize += data.fileSize || 0;
        chartCount++;
      });

      return { totalSize, chartCount };
    } catch (error) {
      console.error('Failed to get storage usage:', error);
      throw error;
    }
  }

  /**
   * Clean up orphaned charts (charts without associated trades)
   * This should be run periodically as a maintenance task
   */
  async cleanupOrphanedCharts(): Promise<{ deleted: number; errors: string[] }> {
    // This would require additional logic to check if trades exist
    // Implementation depends on your trade storage structure
    throw new Error('Not implemented - requires trade existence validation');
  }
}

// Export singleton instance
export const chartUploadService = new ChartUploadService();