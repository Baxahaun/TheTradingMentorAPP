import React from 'react';
import { useMediaQuery } from '../hooks/useMediaQuery';
import SetupAnalyticsWidget from './SetupAnalyticsWidget';
import PositionManagementAnalyticsWidget from './PositionManagementAnalyticsWidget';
import MobileSetupAnalyticsWidget from './mobile/MobileSetupAnalyticsWidget';
import MobilePositionManagementAnalyticsWidget from './mobile/MobilePositionManagementAnalyticsWidget';
import { Trade } from '../types/trade';

interface ResponsiveAnalyticsWidgetProps {
  type: 'setup' | 'position';
  trades: Trade[];
  size?: { w: number; h: number };
}

const ResponsiveAnalyticsWidget: React.FC<ResponsiveAnalyticsWidgetProps> = ({ 
  type, 
  trades, 
  size 
}) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isSmallWidget = size && (size.w <= 6 || size.h <= 4);
  
  // Use mobile version if on mobile device OR if widget is small
  const useMobileVersion = isMobile || isSmallWidget;

  if (type === 'setup') {
    return useMobileVersion ? (
      <MobileSetupAnalyticsWidget trades={trades} size={size} />
    ) : (
      <SetupAnalyticsWidget trades={trades} size={size} />
    );
  }

  if (type === 'position') {
    return useMobileVersion ? (
      <MobilePositionManagementAnalyticsWidget trades={trades} size={size} />
    ) : (
      <PositionManagementAnalyticsWidget trades={trades} size={size} />
    );
  }

  return null;
};

export default ResponsiveAnalyticsWidget;