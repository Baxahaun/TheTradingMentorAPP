import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { 
  Lock, 
  Eye, 
  Calendar, 
  Users, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Printer
} from 'lucide-react';
import { ShareableReport } from '../../lib/tradeReviewExportService';
import PrintableTradeReport from './PrintableTradeReport';

interface SharedReportViewerProps {
  shareId: string;
  onAccessGranted?: (report: ShareableReport) => void;
  onAccessDenied?: (reason: string) => void;
}

export const SharedReportViewer: React.FC<SharedReportViewerProps> = ({
  shareId,
  onAccessGranted,
  onAccessDenied
}) => {
  const [report, setReport] = useState<ShareableReport | null>(null);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessGranted, setAccessGranted] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);

  useEffect(() => {
    loadSharedReport();
  }, [shareId]);

  const loadSharedReport = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // In a real implementation, this would be an API call
      const storedReports = localStorage.getItem('tradeReviewSharedReports');
      const reports = storedReports ? JSON.parse(storedReports) : {};
      const sharedReport = reports[shareId];

      if (!sharedReport) {
        setError('Shared report not found or has been removed.');
        onAccessDenied?.('Report not found');
        return;
      }

      // Check if report has expired
      if (sharedReport.expiresAt && new Date(sharedReport.expiresAt) < new Date()) {
        setError('This shared report has expired.');
        onAccessDenied?.('Report expired');
        return;
      }

      // Check if max access count has been reached
      if (sharedReport.maxAccess && sharedReport.accessCount >= sharedReport.maxAccess) {
        setError('This shared report has reached its maximum access limit.');
        onAccessDenied?.('Access limit reached');
        return;
      }

      setReport(sharedReport);

      // If public access, grant access immediately
      if (sharedReport.accessLevel === 'public') {
        grantAccess(sharedReport);
      }

    } catch (err) {
      console.error('Error loading shared report:', err);
      setError('Failed to load shared report. Please try again.');
      onAccessDenied?.('Load error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = () => {
    if (!report) return;

    if (report.accessLevel === 'protected' && report.password === password) {
      grantAccess(report);
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  const grantAccess = (sharedReport: ShareableReport) => {
    // Increment access count
    const storedReports = localStorage.getItem('tradeReviewSharedReports');
    const reports = storedReports ? JSON.parse(storedReports) : {};
    
    if (reports[shareId]) {
      reports[shareId].accessCount += 1;
      localStorage.setItem('tradeReviewSharedReports', JSON.stringify(reports));
    }

    setAccessGranted(true);
    setError(null);
    onAccessGranted?.(sharedReport);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days > 1 ? 's' : ''} remaining`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shared report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
            <CardTitle className="text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Report not found.</p>
      </div>
    );
  }

  // Show password prompt for protected reports
  if (report.accessLevel === 'protected' && !accessGranted) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Lock className="w-12 h-12 text-blue-500 mx-auto mb-2" />
            <CardTitle>Protected Report</CardTitle>
            <CardDescription>
              This report is password protected. Please enter the password to continue.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                placeholder="Enter password"
              />
            </div>
            
            {error && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Button onClick={handlePasswordSubmit} className="w-full">
              <Eye className="w-4 h-4 mr-2" />
              View Report
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show private access denied
  if (report.accessLevel === 'private' && !accessGranted) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Shield className="w-12 h-12 text-gray-500 mx-auto mb-2" />
            <CardTitle>Private Report</CardTitle>
            <CardDescription>
              This report is private and requires special access permissions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You do not have permission to view this report. Please contact the report owner for access.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show the report content
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with report info */}
      <div className="bg-white border-b border-gray-200 p-4 print:hidden">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Shared Trade Report
              </h1>
              <p className="text-gray-600">
                {report.reportData.trade.currencyPair} - {report.reportData.trade.date}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Report status badges */}
              <div className="flex items-center gap-2">
                <Badge variant={report.accessLevel === 'public' ? 'default' : 
                              report.accessLevel === 'protected' ? 'secondary' : 'outline'}>
                  {report.accessLevel === 'public' && <Eye className="w-3 h-3 mr-1" />}
                  {report.accessLevel === 'protected' && <Lock className="w-3 h-3 mr-1" />}
                  {report.accessLevel === 'private' && <Shield className="w-3 h-3 mr-1" />}
                  {report.accessLevel.charAt(0).toUpperCase() + report.accessLevel.slice(1)}
                </Badge>
                
                {report.expiresAt && (
                  <Badge variant="outline">
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatTimeRemaining(report.expiresAt)}
                  </Badge>
                )}
                
                <Badge variant="outline">
                  <Users className="w-3 h-3 mr-1" />
                  {report.accessCount}/{report.maxAccess || '∞'} views
                </Badge>
              </div>
              
              <Button onClick={handlePrint} variant="outline">
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Report content */}
      <div className="max-w-6xl mx-auto p-4">
        <Card>
          <CardContent className="p-0">
            <PrintableTradeReport
              trade={report.reportData.trade}
              includeCharts={true}
              includeNotes={true}
              includePerformanceMetrics={true}
              includeReviewWorkflow={true}
              customTitle={`Shared Trade Report - ${report.reportData.trade.currencyPair}`}
            />
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 p-4 mt-8 print:hidden">
        <div className="max-w-6xl mx-auto text-center text-sm text-gray-600">
          <p>
            This report was shared on {new Date(report.createdAt).toLocaleDateString()} and 
            has been viewed {report.accessCount} time{report.accessCount !== 1 ? 's' : ''}.
          </p>
          {report.expiresAt && (
            <p className="mt-1">
              Report expires on {new Date(report.expiresAt).toLocaleString()}.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SharedReportViewer;