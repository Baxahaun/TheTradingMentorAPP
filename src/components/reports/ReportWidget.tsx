import React, { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { getReportConfig } from '@/config/reports';

interface ReportWidgetProps {
  reportId: string;
}

const ReportWidget: React.FC<ReportWidgetProps> = ({ reportId }) => {
  const reportConfig = getReportConfig(reportId);

  if (!reportConfig) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Report Not Found
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            The report "{reportId}" could not be found. Please check the configuration.
          </p>
        </CardContent>
      </Card>
    );
  }

  const ReportComponent = reportConfig.component;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{reportConfig.title}</CardTitle>
        {reportConfig.description && (
          <p className="text-sm text-gray-600">{reportConfig.description}</p>
        )}
      </CardHeader>
      <CardContent>
        <Suspense fallback={<ReportSkeleton />}>
          <ReportComponent />
        </Suspense>
      </CardContent>
    </Card>
  );
};

// Loading skeleton for reports
const ReportSkeleton: React.FC = () => (
  <div className="space-y-4">
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-32 w-full" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-4/6" />
    </div>
  </div>
);

export default ReportWidget;