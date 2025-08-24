/**
 * Lazy Chart Image Component
 * Provides lazy loading functionality for chart images with loading states
 * and memory management for the chart gallery.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { ImageIcon, AlertCircle } from 'lucide-react';
import { useLazyLoading, useMemoryManagement } from '@/lib/performanceOptimization';
import { cn } from '@/lib/utils';

interface LazyChartImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  placeholder?: React.ReactNode;
  errorFallback?: React.ReactNode;
  priority?: boolean; // For above-the-fold images
}

export const LazyChartImage: React.FC<LazyChartImageProps> = ({
  src,
  alt,
  className,
  onClick,
  onLoad,
  onError,
  placeholder,
  errorFallback,
  priority = false
}) => {
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [error, setError] = useState<Error | null>(null);
  const { elementRef, isVisible, markAsLoaded } = useLazyLoading(0.1);
  const { registerImage, unregisterImage, registerObjectUrl } = useMemoryManagement();

  const shouldLoad = priority || isVisible;

  const handleImageLoad = useCallback((img: HTMLImageElement) => {
    setLoadState('loaded');
    markAsLoaded();
    registerImage(img);
    onLoad?.();
  }, [markAsLoaded, registerImage, onLoad]);

  const handleImageError = useCallback((img: HTMLImageElement, errorEvent: Event) => {
    const error = new Error(`Failed to load image: ${src}`);
    setError(error);
    setLoadState('error');
    unregisterImage(img);
    onError?.(error);
  }, [src, unregisterImage, onError]);

  useEffect(() => {
    if (!shouldLoad || loadState !== 'idle') return;

    setLoadState('loading');
    const img = new Image();
    
    img.onload = () => handleImageLoad(img);
    img.onerror = (e) => handleImageError(img, e);
    
    // Handle blob URLs for uploaded images
    if (src.startsWith('blob:')) {
      registerObjectUrl(src);
    }
    
    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
      unregisterImage(img);
    };
  }, [shouldLoad, loadState, src, handleImageLoad, handleImageError, registerObjectUrl]);

  const renderPlaceholder = () => {
    if (placeholder) return placeholder;
    
    return (
      <div className="flex flex-col items-center justify-center h-full bg-muted text-muted-foreground">
        <ImageIcon className="h-8 w-8 mb-2" />
        <span className="text-sm">Loading chart...</span>
      </div>
    );
  };

  const renderError = () => {
    if (errorFallback) return errorFallback;
    
    return (
      <div className="flex flex-col items-center justify-center h-full bg-destructive/10 text-destructive">
        <AlertCircle className="h-8 w-8 mb-2" />
        <span className="text-sm text-center px-2">
          Failed to load chart image
        </span>
        {error && (
          <span className="text-xs text-center px-2 mt-1 opacity-70">
            {error.message}
          </span>
        )}
      </div>
    );
  };

  return (
    <div
      ref={elementRef}
      className={cn(
        "relative overflow-hidden bg-muted",
        className
      )}
      onClick={onClick}
    >
      {loadState === 'loaded' ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover transition-opacity duration-300"
          style={{ opacity: 1 }}
          loading={priority ? 'eager' : 'lazy'}
        />
      ) : loadState === 'error' ? (
        renderError()
      ) : loadState === 'loading' ? (
        <div className="relative">
          {renderPlaceholder()}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
        </div>
      ) : (
        renderPlaceholder()
      )}
    </div>
  );
};

/**
 * Optimized chart thumbnail component with lazy loading
 */
interface ChartThumbnailProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  priority?: boolean;
}

export const ChartThumbnail: React.FC<ChartThumbnailProps> = ({
  src,
  alt,
  className,
  onClick,
  priority = false
}) => {
  return (
    <LazyChartImage
      src={src}
      alt={alt}
      className={cn("aspect-video cursor-pointer hover:opacity-90 transition-opacity", className)}
      onClick={onClick}
      priority={priority}
      placeholder={
        <div className="flex items-center justify-center h-full bg-muted">
          <ImageIcon className="h-6 w-6 text-muted-foreground" />
        </div>
      }
    />
  );
};

/**
 * Full-size chart image with lazy loading and zoom support
 */
interface ChartImageProps {
  src: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  priority?: boolean;
}

export const ChartImage: React.FC<ChartImageProps> = ({
  src,
  alt,
  className,
  onLoad,
  onError,
  priority = false
}) => {
  return (
    <LazyChartImage
      src={src}
      alt={alt}
      className={cn("w-full h-auto", className)}
      onLoad={onLoad}
      onError={onError}
      priority={priority}
      placeholder={
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-muted">
          <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <div className="w-32 h-2 bg-muted-foreground/20 rounded animate-pulse" />
        </div>
      }
    />
  );
};