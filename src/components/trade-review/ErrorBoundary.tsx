import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { errorHandlingService, TradeReviewErrorType } from '../../lib/errorHandlingService';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class TradeReviewErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      errorInfo
    });

    // Log error to error handling service
    const tradeReviewError = errorHandlingService.createError(
      TradeReviewErrorType.REVIEW_WORKFLOW_ERROR,
      `React Error Boundary caught error: ${error.message}`,
      {
        error: error.toString(),
        errorInfo,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      }
    );

    errorHandlingService.handleError(tradeReviewError);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReportError = () => {
    const { error, errorInfo, errorId } = this.state;
    
    // Create error report
    const errorReport = {
      id: errorId,
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Copy to clipboard
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
      .then(() => {
        alert('Error report copied to clipboard. Please share this with support.');
      })
      .catch(() => {
        console.error('Failed to copy error report to clipboard');
      });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">
                Something went wrong
              </CardTitle>
              <CardDescription>
                The trade review system encountered an unexpected error. 
                Your data is safe and we're working to fix this issue.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {this.props.showDetails && this.state.error && (
                <div className="bg-gray-100 p-3 rounded-md">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Error Details:
                  </p>
                  <p className="text-xs text-gray-600 font-mono break-all">
                    {this.state.error.message}
                  </p>
                  {this.state.errorId && (
                    <p className="text-xs text-gray-500 mt-2">
                      Error ID: {this.state.errorId}
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={this.handleRetry}
                  className="flex-1"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                
                <Button 
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>

              <Button 
                onClick={this.handleReportError}
                variant="ghost"
                size="sm"
                className="w-full text-gray-600"
              >
                <Bug className="w-4 h-4 mr-2" />
                Report Error
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to handle errors
export const useErrorHandler = () => {
  const handleError = React.useCallback((error: Error, context?: string) => {
    const tradeReviewError = errorHandlingService.createError(
      TradeReviewErrorType.REVIEW_WORKFLOW_ERROR,
      error.message,
      { originalError: error, context }
    );
    
    errorHandlingService.handleError(tradeReviewError);
  }, []);

  return handleError;
};

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <TradeReviewErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </TradeReviewErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}