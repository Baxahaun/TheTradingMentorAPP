import React from 'react';
import { NavigationContext } from '../../types/navigation';
import { Button } from '../ui/button';
import { ChevronRight, Home, Calendar, List, Search, BarChart3 } from 'lucide-react';

interface BreadcrumbNavigationProps {
  navigationContext?: NavigationContext | null;
  currentTradePair?: string;
  onNavigateToSource: (context: NavigationContext) => void;
  onNavigateHome: () => void;
}

const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({
  navigationContext,
  currentTradePair,
  onNavigateToSource,
  onNavigateHome
}) => {
  if (!navigationContext) {
    return (
      <nav className="flex items-center space-x-2 text-sm text-gray-500">
        <Button
          variant="ghost"
          size="sm"
          onClick={onNavigateHome}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
        >
          <Home className="w-4 h-4" />
          Dashboard
        </Button>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">
          {currentTradePair || 'Trade Review'}
        </span>
      </nav>
    );
  }

  const getSourceIcon = (source: NavigationContext['source']) => {
    switch (source) {
      case 'calendar':
        return <Calendar className="w-4 h-4" />;
      case 'trade-list':
        return <List className="w-4 h-4" />;
      case 'search':
        return <Search className="w-4 h-4" />;
      case 'analytics':
        return <BarChart3 className="w-4 h-4" />;
      case 'dashboard':
      default:
        return <Home className="w-4 h-4" />;
    }
  };

  const getSourceLabel = (source: NavigationContext['source']) => {
    switch (source) {
      case 'calendar':
        return 'Calendar';
      case 'trade-list':
        return 'Trade List';
      case 'search':
        return 'Search Results';
      case 'analytics':
        return 'Analytics';
      case 'dashboard':
      default:
        return 'Dashboard';
    }
  };

  const getSourceDetails = (context: NavigationContext) => {
    if (!context.sourceParams) return '';

    switch (context.source) {
      case 'calendar':
        if (context.sourceParams.date) {
          const date = new Date(context.sourceParams.date);
          return ` (${date.toLocaleDateString()})`;
        }
        break;
      case 'search':
        if (context.sourceParams.searchQuery) {
          return ` ("${context.sourceParams.searchQuery}")`;
        }
        break;
      case 'trade-list':
        if (context.sourceParams.filters) {
          const filterCount = Object.values(context.sourceParams.filters).filter(Boolean).length;
          if (filterCount > 0) {
            return ` (${filterCount} filter${filterCount > 1 ? 's' : ''})`;
          }
        }
        break;
    }
    return '';
  };

  // If source is dashboard, don't show redundant breadcrumb
  if (navigationContext.source === 'dashboard') {
    return (
      <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
        {/* Dashboard */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigateToSource(navigationContext)}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
        >
          <Home className="w-4 h-4" />
          Dashboard
        </Button>

        <ChevronRight className="w-4 h-4" />

        {/* Current Trade */}
        <span className="text-gray-900 font-medium">
          {currentTradePair || 'Trade Review'}
        </span>
      </nav>
    );
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
      {/* Home/Dashboard */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onNavigateHome}
        className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
      >
        <Home className="w-4 h-4" />
        Dashboard
      </Button>

      <ChevronRight className="w-4 h-4" />

      {/* Source */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigateToSource(navigationContext)}
        className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
      >
        {getSourceIcon(navigationContext.source)}
        {getSourceLabel(navigationContext.source)}
        {getSourceDetails(navigationContext)}
      </Button>

      <ChevronRight className="w-4 h-4" />

      {/* Current Trade */}
      <span className="text-gray-900 font-medium">
        {currentTradePair || 'Trade Review'}
      </span>
    </nav>
  );
};

export default BreadcrumbNavigation;