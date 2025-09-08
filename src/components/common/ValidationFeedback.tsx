import React from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { ValidationError } from '../../services/ValidationService';

interface ValidationFeedbackProps {
  errors?: ValidationError[];
  warnings?: ValidationError[];
  suggestions?: ValidationError[];
  className?: string;
  showSuggestions?: boolean;
}

export const ValidationFeedback: React.FC<ValidationFeedbackProps> = ({
  errors = [],
  warnings = [],
  suggestions = [],
  className = '',
  showSuggestions = true
}) => {
  if (errors.length === 0 && warnings.length === 0 && (!showSuggestions || suggestions.length === 0)) {
    return null;
  }

  const getIcon = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getBackgroundColor = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getTextColor = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-gray-800';
    }
  };

  const renderValidationItem = (item: ValidationError, index: number) => (
    <div
      key={`${item.severity}-${index}`}
      className={`flex items-start space-x-2 p-3 rounded-lg border ${getBackgroundColor(item.severity)}`}
    >
      {getIcon(item.severity)}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${getTextColor(item.severity)}`}>
          {item.message}
        </p>
        {item.suggestion && (
          <p className={`text-xs mt-1 ${getTextColor(item.severity)} opacity-75`}>
            💡 {item.suggestion}
          </p>
        )}
        {process.env.NODE_ENV === 'development' && (
          <p className="text-xs text-gray-500 mt-1">
            Field: {item.field} | Code: {item.code}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Errors */}
      {errors.map((error, index) => renderValidationItem(error, index))}
      
      {/* Warnings */}
      {warnings.map((warning, index) => renderValidationItem(warning, index))}
      
      {/* Suggestions */}
      {showSuggestions && suggestions.map((suggestion, index) => renderValidationItem(suggestion, index))}
    </div>
  );
};

// Field-specific validation feedback component
interface FieldValidationProps {
  error?: ValidationError | null;
  className?: string;
  inline?: boolean;
}

export const FieldValidation: React.FC<FieldValidationProps> = ({
  error,
  className = '',
  inline = false
}) => {
  if (!error) return null;

  const containerClass = inline 
    ? 'flex items-center space-x-2' 
    : 'mt-1';

  return (
    <div className={`${containerClass} ${className}`}>
      <div className="flex items-center space-x-1">
        {getIcon(error.severity)}
        <span className={`text-sm ${getTextColor(error.severity)}`}>
          {error.message}
        </span>
      </div>
      {error.suggestion && !inline && (
        <p className={`text-xs mt-1 ${getTextColor(error.severity)} opacity-75`}>
          💡 {error.suggestion}
        </p>
      )}
    </div>
  );
};

// Summary component for validation results
interface ValidationSummaryProps {
  errorCount: number;
  warningCount: number;
  suggestionCount: number;
  className?: string;
}

export const ValidationSummary: React.FC<ValidationSummaryProps> = ({
  errorCount,
  warningCount,
  suggestionCount,
  className = ''
}) => {
  const totalIssues = errorCount + warningCount;
  
  if (totalIssues === 0) {
    return (
      <div className={`flex items-center space-x-2 text-green-600 ${className}`}>
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm font-medium">All validation checks passed</span>
        {suggestionCount > 0 && (
          <span className="text-xs text-blue-600">
            ({suggestionCount} suggestions available)
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      {errorCount > 0 && (
        <div className="flex items-center space-x-1 text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm font-medium">
            {errorCount} error{errorCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}
      
      {warningCount > 0 && (
        <div className="flex items-center space-x-1 text-yellow-600">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium">
            {warningCount} warning{warningCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}
      
      {suggestionCount > 0 && (
        <div className="flex items-center space-x-1 text-blue-600">
          <Info className="w-4 h-4" />
          <span className="text-sm">
            {suggestionCount} suggestion{suggestionCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
};

// Helper functions (moved outside component for reuse)
function getIcon(severity: 'error' | 'warning' | 'info') {
  switch (severity) {
    case 'error':
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    case 'info':
      return <Info className="w-4 h-4 text-blue-500" />;
    default:
      return <CheckCircle className="w-4 h-4 text-green-500" />;
  }
}

function getTextColor(severity: 'error' | 'warning' | 'info') {
  switch (severity) {
    case 'error':
      return 'text-red-800';
    case 'warning':
      return 'text-yellow-800';
    case 'info':
      return 'text-blue-800';
    default:
      return 'text-gray-800';
  }
}

export default ValidationFeedback;