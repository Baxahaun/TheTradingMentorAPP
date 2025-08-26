/**
 * Playbook Migration Manager Component
 * Manages the complete migration workflow including wizard, rollback, and status tracking
 */

import React, { useState, useCallback } from 'react';
import { 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  RotateCcw,
  History,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { StrategyMigrationWizard } from './StrategyMigrationWizard';
import { MigrationRollbackDialog } from './MigrationRollbackDialog';
import { 
  LegacyPlaybook,
  MigrationResult,
  RollbackOperation
} from '../types/migration';

interface PlaybookMigrationManagerProps {
  playbooks: LegacyPlaybook[];
  onPlaybookMigrated: (result: MigrationResult) => void;
  onPlaybookRolledBack: (rollback: RollbackOperation) => void;
  onError: (error: string) => void;
}

interface MigrationHistory {
  playbook: LegacyPlaybook;
  result: MigrationResult;
  rollback?: RollbackOperation;
}

export const PlaybookMigrationManager: React.FC<PlaybookMigrationManagerProps> = ({
  playbooks,
  onPlaybookMigrated,
  onPlaybookRolledBack,
  onError
}) => {
  const [selectedPlaybook, setSelectedPlaybook] = useState<LegacyPlaybook | null>(null);
  const [showMigrationWizard, setShowMigrationWizard] = useState(false);
  const [showRollbackDialog, setShowRollbackDialog] = useState(false);
  const [selectedMigrationResult, setSelectedMigrationResult] = useState<MigrationResult | null>(null);
  const [migrationHistory, setMigrationHistory] = useState<MigrationHistory[]>([]);
  const [activeTab, setActiveTab] = useState('available');

  // Get playbooks that haven't been migrated yet
  const availablePlaybooks = playbooks.filter(playbook => 
    !migrationHistory.some(h => h.playbook.id === playbook.id && h.result.status === 'success' && !h.rollback)
  );

  // Get successfully migrated playbooks
  const migratedPlaybooks = migrationHistory.filter(h => 
    h.result.status === 'success' && !h.rollback
  );

  // Get failed migrations
  const failedMigrations = migrationHistory.filter(h => 
    h.result.status === 'failed' || (h.result.status === 'partial' && h.result.errors.length > 0)
  );

  const handleStartMigration = (playbook: LegacyPlaybook) => {
    setSelectedPlaybook(playbook);
    setShowMigrationWizard(true);
  };

  const handleMigrationComplete = useCallback((result: MigrationResult) => {
    if (selectedPlaybook) {
      const historyEntry: MigrationHistory = {
        playbook: selectedPlaybook,
        result
      };
      
      setMigrationHistory(prev => [...prev, historyEntry]);
      onPlaybookMigrated(result);
    }
    
    setShowMigrationWizard(false);
    setSelectedPlaybook(null);
    setActiveTab('migrated');
  }, [selectedPlaybook, onPlaybookMigrated]);

  const handleMigrationError = useCallback((error: string) => {
    onError(error);
    setShowMigrationWizard(false);
    setSelectedPlaybook(null);
  }, [onError]);

  const handleStartRollback = (result: MigrationResult) => {
    setSelectedMigrationResult(result);
    setShowRollbackDialog(true);
  };

  const handleRollbackComplete = useCallback((rollback: RollbackOperation) => {
    // Update migration history to include rollback
    setMigrationHistory(prev => 
      prev.map(h => 
        h.result.sourcePlaybookId === rollback.sourcePlaybookId 
          ? { ...h, rollback }
          : h
      )
    );
    
    onPlaybookRolledBack(rollback);
    setShowRollbackDialog(false);
    setSelectedMigrationResult(null);
    setActiveTab('available');
  }, [onPlaybookRolledBack]);

  const handleRollbackError = useCallback((error: string) => {
    onError(error);
    setShowRollbackDialog(false);
    setSelectedMigrationResult(null);
  }, [onError]);

  const renderPlaybookCard = (playbook: LegacyPlaybook, showMigrateButton = true) => (
    <Card key={playbook.id} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: playbook.color }}
            />
            <span className="truncate">{playbook.title}</span>
          </CardTitle>
          {showMigrateButton && (
            <Button
              size="sm"
              onClick={() => handleStartMigration(playbook)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Upload className="w-3 h-3 mr-1" />
              Migrate
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {playbook.description}
        </p>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-500">Times Used:</span>
            <span className="ml-1 font-medium">{playbook.timesUsed || 0}</span>
          </div>
          <div>
            <span className="text-gray-500">Win Rate:</span>
            <span className="ml-1 font-medium">
              {playbook.tradesWon && playbook.tradesLost 
                ? Math.round((playbook.tradesWon / (playbook.tradesWon + playbook.tradesLost)) * 100)
                : 0}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderMigrationResultCard = (history: MigrationHistory) => (
    <Card key={history.result.sourcePlaybookId} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: history.playbook.color }}
            />
            <span className="truncate">{history.playbook.title}</span>
            <Badge variant={
              history.result.status === 'success' ? 'default' :
              history.result.status === 'partial' ? 'secondary' :
              'destructive'
            }>
              {history.result.status}
            </Badge>
          </CardTitle>
          
          {history.result.rollbackAvailable && !history.rollback && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStartRollback(history.result)}
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Rollback
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="text-xs text-gray-500">
            Migrated: {new Date(history.result.completedAt).toLocaleDateString()}
          </div>
          
          {history.result.migratedFields.length > 0 && (
            <div>
              <span className="text-xs text-gray-500">Fields migrated:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {history.result.migratedFields.slice(0, 4).map(field => (
                  <Badge key={field} variant="outline" className="text-xs">
                    {field}
                  </Badge>
                ))}
                {history.result.migratedFields.length > 4 && (
                  <Badge variant="outline" className="text-xs">
                    +{history.result.migratedFields.length - 4}
                  </Badge>
                )}
              </div>
            </div>
          )}
          
          {history.result.errors.length > 0 && (
            <div className="text-xs">
              <span className="text-red-600">Errors: {history.result.errors.length}</span>
            </div>
          )}
          
          {history.result.warnings.length > 0 && (
            <div className="text-xs">
              <span className="text-yellow-600">Warnings: {history.result.warnings.length}</span>
            </div>
          )}
          
          {history.rollback && (
            <div className="text-xs text-gray-500">
              Rolled back: {new Date(history.rollback.completedAt!).toLocaleDateString()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Playbook Migration</h2>
          <p className="text-gray-600 text-sm">
            Upgrade your playbooks to professional strategies with enhanced analytics
          </p>
        </div>
        
        {migrationHistory.length > 0 && (
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>{migratedPlaybooks.length} migrated</span>
            </div>
            {failedMigrations.length > 0 && (
              <div className="flex items-center space-x-1">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span>{failedMigrations.length} failed</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Migration Info */}
      {availablePlaybooks.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">Ready to upgrade your playbooks?</p>
              <p className="text-sm">
                Migration will preserve all your existing data while adding professional features like 
                advanced performance metrics, risk management rules, and AI-powered insights.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="available" className="flex items-center space-x-2">
            <Upload className="w-4 h-4" />
            <span>Available ({availablePlaybooks.length})</span>
          </TabsTrigger>
          <TabsTrigger value="migrated" className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>Migrated ({migratedPlaybooks.length})</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center space-x-2">
            <History className="w-4 h-4" />
            <span>History ({migrationHistory.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* Available Playbooks */}
        <TabsContent value="available" className="space-y-4">
          {availablePlaybooks.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">All Playbooks Migrated</h3>
                <p className="text-gray-600">
                  All your playbooks have been successfully upgraded to professional strategies.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availablePlaybooks.map(playbook => renderPlaybookCard(playbook, true))}
            </div>
          )}
        </TabsContent>

        {/* Migrated Playbooks */}
        <TabsContent value="migrated" className="space-y-4">
          {migratedPlaybooks.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Migrations Yet</h3>
                <p className="text-gray-600">
                  Start by migrating your first playbook to see it here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {migratedPlaybooks.map(history => renderMigrationResultCard(history))}
            </div>
          )}
        </TabsContent>

        {/* Migration History */}
        <TabsContent value="history" className="space-y-4">
          {migrationHistory.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Migration History</h3>
                <p className="text-gray-600">
                  Migration history will appear here once you start migrating playbooks.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {migrationHistory
                .sort((a, b) => new Date(b.result.completedAt).getTime() - new Date(a.result.completedAt).getTime())
                .map(history => renderMigrationResultCard(history))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Migration Wizard */}
      <StrategyMigrationWizard
        isOpen={showMigrationWizard}
        onClose={() => {
          setShowMigrationWizard(false);
          setSelectedPlaybook(null);
        }}
        playbook={selectedPlaybook}
        onMigrationComplete={handleMigrationComplete}
        onMigrationError={handleMigrationError}
      />

      {/* Rollback Dialog */}
      <MigrationRollbackDialog
        isOpen={showRollbackDialog}
        onClose={() => {
          setShowRollbackDialog(false);
          setSelectedMigrationResult(null);
        }}
        migrationResult={selectedMigrationResult}
        onRollbackComplete={handleRollbackComplete}
        onRollbackError={handleRollbackError}
      />
    </div>
  );
};

export default PlaybookMigrationManager;