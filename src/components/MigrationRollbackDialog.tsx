/**
 * Migration Rollback Dialog Component
 * Provides interface for rolling back failed or unwanted migrations
 */

import React, { useState } from 'react';
import { 
  AlertTriangle, 
  RotateCcw, 
  CheckCircle, 
  X,
  Clock,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { 
  MigrationResult,
  RollbackOperation
} from '../types/migration';
import { StrategyMigrationService } from '../services/StrategyMigrationService';

interface MigrationRollbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  migrationResult: MigrationResult | null;
  onRollbackComplete: (rollback: RollbackOperation) => void;
  onRollbackError: (error: string) => void;
}

export const MigrationRollbackDialog: React.FC<MigrationRollbackDialogProps> = ({
  isOpen,
  onClose,
  migrationResult,
  onRollbackComplete,
  onRollbackError
}) => {
  const [migrationService] = useState(() => new StrategyMigrationService());
  const [rollbackReason, setRollbackReason] = useState('');
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [confirmRollback, setConfirmRollback] = useState(false);

  const handleRollback = async () => {
    if (!migrationResult || !rollbackReason.trim()) return;

    setIsRollingBack(true);

    try {
      const rollback = await migrationService.rollbackMigration(
        migrationResult,
        rollbackReason.trim()
      );

      if (rollback.success) {
        onRollbackComplete(rollback);
        onClose();
      } else {
        onRollbackError(rollback.error || 'Rollback failed for unknown reason');
      }
    } catch (error) {
      onRollbackError(error instanceof Error ? error.message : 'Rollback operation failed');
    } finally {
      setIsRollingBack(false);
    }
  };

  const handleClose = () => {
    if (!isRollingBack) {
      setRollbackReason('');
      setConfirmRollback(false);
      onClose();
    }
  };

  const canRollback = migrationResult?.rollbackAvailable && migrationResult?.backupId;
  const hasValidReason = rollbackReason.trim().length >= 10;

  if (!isOpen || !migrationResult) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <RotateCcw className="w-5 h-5 text-orange-500" />
              <span>Rollback Migration</span>
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleClose} disabled={isRollingBack}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Migration Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-sm">
                <FileText className="w-4 h-4" />
                <span>Migration Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-500">Source Playbook</Label>
                  <p className="font-medium">{migrationResult.sourcePlaybookId}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Target Strategy</Label>
                  <p className="font-medium">{migrationResult.targetStrategyId || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Status</Label>
                  <Badge variant={
                    migrationResult.status === 'success' ? 'default' :
                    migrationResult.status === 'partial' ? 'secondary' :
                    'destructive'
                  }>
                    {migrationResult.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-gray-500">Completed</Label>
                  <p className="text-sm">{new Date(migrationResult.completedAt).toLocaleString()}</p>
                </div>
              </div>

              {migrationResult.migratedFields.length > 0 && (
                <div>
                  <Label className="text-gray-500">Migrated Fields ({migrationResult.migratedFields.length})</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {migrationResult.migratedFields.slice(0, 8).map(field => (
                      <Badge key={field} variant="outline" className="text-xs">
                        {field}
                      </Badge>
                    ))}
                    {migrationResult.migratedFields.length > 8 && (
                      <Badge variant="outline" className="text-xs">
                        +{migrationResult.migratedFields.length - 8} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {migrationResult.errors.length > 0 && (
                <div>
                  <Label className="text-gray-500">Errors ({migrationResult.errors.length})</Label>
                  <div className="space-y-1 mt-1">
                    {migrationResult.errors.slice(0, 3).map((error, index) => (
                      <p key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        {error}
                      </p>
                    ))}
                    {migrationResult.errors.length > 3 && (
                      <p className="text-sm text-gray-500">
                        +{migrationResult.errors.length - 3} more errors
                      </p>
                    )}
                  </div>
                </div>
              )}

              {migrationResult.warnings.length > 0 && (
                <div>
                  <Label className="text-gray-500">Warnings ({migrationResult.warnings.length})</Label>
                  <div className="space-y-1 mt-1">
                    {migrationResult.warnings.slice(0, 2).map((warning, index) => (
                      <p key={index} className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                        {warning}
                      </p>
                    ))}
                    {migrationResult.warnings.length > 2 && (
                      <p className="text-sm text-gray-500">
                        +{migrationResult.warnings.length - 2} more warnings
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rollback Availability */}
          {!canRollback ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Rollback Not Available</p>
                  <p>
                    {!migrationResult.rollbackAvailable 
                      ? 'This migration was performed without creating a backup.'
                      : 'No backup data is available for this migration.'
                    }
                  </p>
                  <p className="text-sm text-gray-600">
                    You may need to manually restore your original playbook data or recreate it from scratch.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Rollback Warning */}
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Rollback Warning</p>
                    <p>
                      Rolling back this migration will:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Delete the migrated professional strategy</li>
                      <li>Restore your original playbook from backup</li>
                      <li>Remove any performance data calculated during migration</li>
                      <li>Cannot be undone once completed</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>

              {/* Rollback Reason */}
              <div className="space-y-2">
                <Label htmlFor="rollbackReason">
                  Reason for Rollback <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="rollbackReason"
                  value={rollbackReason}
                  onChange={(e) => setRollbackReason(e.target.value)}
                  placeholder="Please explain why you want to rollback this migration (minimum 10 characters)..."
                  rows={3}
                  disabled={isRollingBack}
                />
                <p className="text-sm text-gray-500">
                  {rollbackReason.length}/10 characters minimum
                </p>
              </div>

              {/* Confirmation Checkbox */}
              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="confirmRollback"
                  checked={confirmRollback}
                  onChange={(e) => setConfirmRollback(e.target.checked)}
                  disabled={isRollingBack}
                  className="mt-1"
                />
                <label htmlFor="confirmRollback" className="text-sm">
                  I understand that this rollback operation cannot be undone and will permanently 
                  delete the migrated strategy and restore the original playbook.
                </label>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isRollingBack}
            >
              Cancel
            </Button>

            {canRollback && (
              <Button
                variant="destructive"
                onClick={handleRollback}
                disabled={!hasValidReason || !confirmRollback || isRollingBack}
              >
                {isRollingBack ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Rolling Back...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Rollback Migration
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Rollback Status */}
          {isRollingBack && (
            <Alert>
              <Clock className="h-4 w-4 animate-spin" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Rollback in Progress</p>
                  <p className="text-sm">
                    Please wait while we restore your original playbook data...
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MigrationRollbackDialog;