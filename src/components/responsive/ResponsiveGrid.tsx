import React from 'react';
import { useResponsive } from '../../hooks/useResponsive';

interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  gap?: number;
  className?: string;
}

/**
 * Responsive grid component that adapts to screen size
 */
export function ResponsiveGrid({ 
  children, 
  columns = { xs: 1, sm: 2, md: 3, lg: 4 },
  gap = 4,
  className = '' 
}: ResponsiveGridProps) {
  const { currentBreakpoint } = useResponsive();
  
  const getCurrentColumns = () => {
    const breakpoints = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'] as const;
    
    for (const bp of breakpoints) {
      if (columns[bp] !== undefined && 
          (bp === currentBreakpoint || 
           breakpoints.indexOf(currentBreakpoint) <= breakpoints.indexOf(bp))) {
        return columns[bp];
      }
    }
    
    return columns.xs || 1;
  };

  const cols = getCurrentColumns();
  
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gap: `${gap * 0.25}rem`,
  };

  return (
    <div 
      className={`responsive-grid ${className}`}
      style={gridStyle}
    >
      {children}
    </div>
  );
}

interface ResponsiveStackProps {
  children: React.ReactNode;
  direction?: {
    xs?: 'row' | 'column';
    sm?: 'row' | 'column';
    md?: 'row' | 'column';
    lg?: 'row' | 'column';
  };
  spacing?: number;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  className?: string;
}

/**
 * Responsive stack component for flexible layouts
 */
export function ResponsiveStack({
  children,
  direction = { xs: 'column', md: 'row' },
  spacing = 4,
  align = 'start',
  justify = 'start',
  className = ''
}: ResponsiveStackProps) {
  const { currentBreakpoint } = useResponsive();
  
  const getCurrentDirection = () => {
    const breakpoints = ['lg', 'md', 'sm', 'xs'] as const;
    
    for (const bp of breakpoints) {
      if (direction[bp] !== undefined && 
          (bp === currentBreakpoint || 
           breakpoints.indexOf(currentBreakpoint) <= breakpoints.indexOf(bp))) {
        return direction[bp];
      }
    }
    
    return direction.xs || 'column';
  };

  const currentDirection = getCurrentDirection();
  
  const stackStyle = {
    display: 'flex',
    flexDirection: currentDirection,
    gap: `${spacing * 0.25}rem`,
    alignItems: align === 'start' ? 'flex-start' : 
                align === 'end' ? 'flex-end' : 
                align === 'stretch' ? 'stretch' : 'center',
    justifyContent: justify === 'start' ? 'flex-start' :
                   justify === 'end' ? 'flex-end' :
                   justify === 'between' ? 'space-between' :
                   justify === 'around' ? 'space-around' : 'center',
  };

  return (
    <div 
      className={`responsive-stack ${className}`}
      style={stackStyle}
    >
      {children}
    </div>
  );
}

interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
  };
  className?: string;
}

/**
 * Responsive container with max-width and padding
 */
export function ResponsiveContainer({
  children,
  maxWidth = 'xl',
  padding = { xs: 4, sm: 6, md: 8 },
  className = ''
}: ResponsiveContainerProps) {
  const { currentBreakpoint } = useResponsive();
  
  const getCurrentPadding = () => {
    const breakpoints = ['lg', 'md', 'sm', 'xs'] as const;
    
    for (const bp of breakpoints) {
      if (padding[bp] !== undefined && 
          (bp === currentBreakpoint || 
           breakpoints.indexOf(currentBreakpoint) <= breakpoints.indexOf(bp))) {
        return padding[bp];
      }
    }
    
    return padding.xs || 4;
  };

  const maxWidthMap = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
    full: '100%'
  };

  const containerStyle = {
    maxWidth: maxWidthMap[maxWidth],
    margin: '0 auto',
    padding: `0 ${getCurrentPadding() * 0.25}rem`,
  };

  return (
    <div 
      className={`responsive-container ${className}`}
      style={containerStyle}
    >
      {children}
    </div>
  );
}