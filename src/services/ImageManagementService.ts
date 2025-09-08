/**
 * Image Management Service
 * 
 * This service handles all image operations for the journal system including:
 * - Firebase Storage integration for image upload/download
 * - Image processing (resize, thumbnail generation)
 * - Annotation management
 * - Secure image handling with proper validation
 */

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  getMetadata,
  StorageReference
} from 'firebase/storage';

import { storage } from '../lib/firebase';
import {
  JournalImage,
  ImageAnnotation,
  AnnotationType,
  AnnotationPosition,
  ImageCategory,
  JOURNAL_CONSTANTS,
  JOURNAL_ERROR_CODES
} from '../types/journal';

/**
 * Configuration for image management service
 */
export interface ImageManagementConfig {
  maxImageSize?: number; // bytes
  maxImagesPerEntry?: number;
  supportedFormats?: string[];
  thumbnailSize?: { width: number; height: number };
  compressionQuality?: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<ImageManagementConfig> = {
  maxImageSize: JOURNAL_CONSTANTS.MAX_IMAGE_SIZE,
  maxImagesPerEntry: JOURNAL_CONSTANTS.MAX_IMAGES_PER_ENTRY,
  supportedFormats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  thumbnailSize: { width: 300, height: 200 },
  compressionQuality: 0.8
};

/**
 * Image upload result interface
 */
export interface ImageUploadResult {
  image: JournalImage;
  uploadProgress?: number;
}

/**
 * Image processing options
 */
export interface ImageProcessingOptions {
  resize?: { width: number; height: number };
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

/**
 * Image Management Service class
 */
export class ImageManagementService {
  private config: Required<ImageManagementConfig>;

  constructor(config: ImageManagementConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ===== IMAGE UPLOAD AND STORAGE =====

  /**
   * Uploads an image to Firebase Storage
   */
  async uploadImage(
    userId: string,
    file: File,
    entryId: string,
    options: {
      category?: ImageCategory;
      caption?: string;
      tradeId?: string;
      sectionId?: string;
    } = {}
  ): Promise<JournalImage> {
    try {
      // Validate file
      this.validateImageFile(file);

      // Generate unique image ID
      const imageId = this.generateImageId();
      const timestamp = new Date().toISOString();

      // Process image (resize if needed)
      const processedFile = await this.processImage(file, {
        resize: { width: 1920, height: 1080 }, // Max resolution
        quality: this.config.compressionQuality
      });

      // Generate thumbnail
      const thumbnailFile = await this.generateThumbnail(processedFile);

      // Upload original image
      const originalPath = `users/${userId}/journal-images/${entryId}/original/${imageId}.${this.getFileExtension(file.name)}`;
      const originalRef = ref(storage, originalPath);
      await uploadBytes(originalRef, processedFile);
      const originalUrl = await getDownloadURL(originalRef);

      // Upload thumbnail
      const thumbnailPath = `users/${userId}/journal-images/${entryId}/thumbnails/${imageId}_thumb.jpg`;
      const thumbnailRef = ref(storage, thumbnailPath);
      await uploadBytes(thumbnailRef, thumbnailFile);
      const thumbnailUrl = await getDownloadURL(thumbnailRef);

      // Get image dimensions
      const dimensions = await this.getImageDimensions(processedFile);

      // Create JournalImage object
      const journalImage: JournalImage = {
        id: imageId,
        url: originalUrl,
        thumbnailUrl,
        filename: file.name,
        fileSize: processedFile.size,
        mimeType: processedFile.type,
        width: dimensions.width,
        height: dimensions.height,
        uploadedAt: timestamp,
        annotations: [],
        caption: options.caption,
        tradeId: options.tradeId,
        sectionId: options.sectionId,
        tags: [],
        category: options.category || 'other'
      };

      return journalImage;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Deletes an image from Firebase Storage
   */
  async deleteImage(userId: string, entryId: string, imageId: string): Promise<void> {
    try {
      // Delete original image
      const originalPath = `users/${userId}/journal-images/${entryId}/original/${imageId}`;
      const originalRef = ref(storage, originalPath);
      
      try {
        await deleteObject(originalRef);
      } catch (error: any) {
        if (error.code !== 'storage/object-not-found') {
          throw error;
        }
      }

      // Delete thumbnail
      const thumbnailPath = `users/${userId}/journal-images/${entryId}/thumbnails/${imageId}_thumb.jpg`;
      const thumbnailRef = ref(storage, thumbnailPath);
      
      try {
        await deleteObject(thumbnailRef);
      } catch (error: any) {
        if (error.code !== 'storage/object-not-found') {
          throw error;
        }
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      throw new Error(`Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Updates image metadata (caption, category, etc.)
   */
  async updateImageMetadata(
    imageId: string,
    updates: {
      caption?: string;
      category?: ImageCategory;
      tags?: string[];
      tradeId?: string;
    }
  ): Promise<Partial<JournalImage>> {
    // This returns the updates to be applied to the JournalImage object
    // The actual persistence is handled by JournalDataService
    return {
      ...updates,
      // Note: We don't update the actual file in storage, just metadata
    };
  }

  // ===== IMAGE PROCESSING =====

  /**
   * Processes an image (resize, compress, format conversion)
   */
  async processImage(file: File, options: ImageProcessingOptions = {}): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          // Calculate dimensions
          let { width, height } = img;
          
          if (options.resize) {
            const aspectRatio = width / height;
            const targetAspectRatio = options.resize.width / options.resize.height;
            
            if (width > options.resize.width || height > options.resize.height) {
              if (aspectRatio > targetAspectRatio) {
                width = options.resize.width;
                height = width / aspectRatio;
              } else {
                height = options.resize.height;
                width = height * aspectRatio;
              }
            }
          }

          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;

          // Draw image
          ctx?.drawImage(img, 0, 0, width, height);

          // Convert to blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const processedFile = new File([blob], file.name, {
                  type: options.format ? `image/${options.format}` : file.type,
                  lastModified: Date.now()
                });
                resolve(processedFile);
              } else {
                reject(new Error('Failed to process image'));
              }
            },
            options.format ? `image/${options.format}` : file.type,
            options.quality || this.config.compressionQuality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Generates a thumbnail for an image
   */
  async generateThumbnail(file: File): Promise<File> {
    return this.processImage(file, {
      resize: this.config.thumbnailSize,
      format: 'jpeg',
      quality: 0.7
    });
  }

  /**
   * Gets image dimensions
   */
  private async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => reject(new Error('Failed to load image for dimension calculation'));
      img.src = URL.createObjectURL(file);
    });
  }

  // ===== ANNOTATION MANAGEMENT =====

  /**
   * Adds an annotation to an image
   */
  async addAnnotation(
    imageId: string,
    annotation: Omit<ImageAnnotation, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ImageAnnotation> {
    const now = new Date().toISOString();
    
    const newAnnotation: ImageAnnotation = {
      id: this.generateAnnotationId(),
      ...annotation,
      createdAt: now,
      updatedAt: now
    };

    // Validate annotation
    this.validateAnnotation(newAnnotation);

    return newAnnotation;
  }

  /**
   * Updates an existing annotation
   */
  async updateAnnotation(
    annotationId: string,
    updates: Partial<Omit<ImageAnnotation, 'id' | 'createdAt'>>
  ): Promise<Partial<ImageAnnotation>> {
    const updatedAnnotation = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    return updatedAnnotation;
  }

  /**
   * Removes an annotation from an image
   */
  async deleteAnnotation(annotationId: string): Promise<void> {
    // This is handled by removing the annotation from the JournalImage.annotations array
    // The actual persistence is handled by JournalDataService
  }

  // ===== VALIDATION =====

  /**
   * Validates an image file before upload
   */
  private validateImageFile(file: File): void {
    // Check file size
    if (file.size > this.config.maxImageSize) {
      throw new Error(`Image size (${Math.round(file.size / 1024 / 1024)}MB) exceeds maximum allowed size (${Math.round(this.config.maxImageSize / 1024 / 1024)}MB)`);
    }

    // Check file type
    if (!this.config.supportedFormats.includes(file.type)) {
      throw new Error(`Unsupported image format: ${file.type}. Supported formats: ${this.config.supportedFormats.join(', ')}`);
    }

    // Check if it's actually an image
    if (!file.type.startsWith('image/')) {
      throw new Error('File is not a valid image');
    }
  }

  /**
   * Validates an annotation
   */
  private validateAnnotation(annotation: ImageAnnotation): void {
    // Check position bounds
    if (annotation.position.x < 0 || annotation.position.x > 100 ||
        annotation.position.y < 0 || annotation.position.y > 100) {
      throw new Error('Annotation position must be within image bounds (0-100%)');
    }

    // Check content length
    if (annotation.content.length > 500) {
      throw new Error('Annotation content cannot exceed 500 characters');
    }

    // Validate color format (hex color)
    if (!/^#[0-9A-F]{6}$/i.test(annotation.color)) {
      throw new Error('Annotation color must be a valid hex color (e.g., #FF0000)');
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Generates a unique image ID
   */
  private generateImageId(): string {
    return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generates a unique annotation ID
   */
  private generateAnnotationId(): string {
    return `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Gets file extension from filename
   */
  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || 'jpg';
  }

  /**
   * Converts bytes to human-readable format
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Checks if a file type is supported
   */
  isImageTypeSupported(mimeType: string): boolean {
    return this.config.supportedFormats.includes(mimeType);
  }

  /**
   * Gets storage path for an image
   */
  getImageStoragePath(userId: string, entryId: string, imageId: string, type: 'original' | 'thumbnail' = 'original'): string {
    if (type === 'thumbnail') {
      return `users/${userId}/journal-images/${entryId}/thumbnails/${imageId}_thumb.jpg`;
    }
    return `users/${userId}/journal-images/${entryId}/original/${imageId}`;
  }
}

/**
 * Default image management service instance
 */
export const imageManagementService = new ImageManagementService();

/**
 * Creates a new ImageManagementService instance with custom configuration
 */
export function createImageManagementService(config?: ImageManagementConfig): ImageManagementService {
  return new ImageManagementService(config);
}