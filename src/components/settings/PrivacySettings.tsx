/**
 * Privacy Settings Component
 * Allows users to manage their privacy preferences and data access controls
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Shield, 
  Lock, 
  Eye, 
  Download, 
  Share2, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Users
} from 'lucide-react';
import PrivacySettingsService, { PrivacySettings, AuditSummary } from '../../services/PrivacySettingsService';
import { useAuth } from '../../contexts/AuthContext';

interface PrivacySettingsProps {
  onSettingsChange?: (settings: PrivacySettings) => void;
}

export const PrivacySettingsComponent: React.FC<PrivacySettingsProps> = ({
  onSettingsChange
}) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [auditSummary, setAuditSummary] = useState<AuditSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newMentorEmail, setNewMentorEmail] = useState('');

  const privacyService = PrivacySettingsService.getInstance();

  useEffect(() => {
    if (user?.uid) {
      loadPrivacySettings();
      loadAuditSummary();
    }
  }, [user]);

  const loadPrivacySettings = async () => {
    try {
      setLoading(true);
      const userSettings = await privacyService.getPrivacySettings(user!.uid);
      setSettings(userSettings);
    } catch (err) {
      setError('Failed to load privacy settings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditSummary = async () => {
    try {
      const summary = await privacyService.generateAuditSummary(user!.uid);
      setAuditSummary(summary);
    } catch (err) {
      console.error('Failed to load audit summary:', err);
    }
  };

  const updateSettings = async (updates: Partial<PrivacySettings>) => {
    if (!settings || !user) return;

    try {
      setSaving(true);
      setError(null);

      const validation = privacyService.validatePrivacySettings(updates);
      if (!validation.isValid) {
        setError(validation.errors.join(', '));
        return;
      }

      await privacyService.updatePrivacySettings(user.uid, updates);
      const updatedSettings = { ...settings, ...updates };
      setSettings(updatedSettings);
      onSettingsChange?.(updatedSettings);
    } catch (err) {
      setError('Failed to update privacy settings');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const addMentorEmail = async () => {
    if (!settings || !newMentorEmail.trim()) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newMentorEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    if (settings.mentorEmails.includes(newMentorEmail)) {
      setError('This email is already added');
      return;
    }

    await updateSettings({
      mentorEmails: [...settings.mentorEmails, newMentorEmail]
    });
    setNewMentorEmail('');
  };

  const removeMentorEmail = async (email: string) => {
    if (!settings) return;
    
    await updateSettings({
      mentorEmails: settings.mentorEmails.filter(e => e !== email)
    });
  };

  const exportData = async () => {
    if (!user) return;

    try {
      const exportResult = await privacyService.exportUserData(user.uid, 'json');
      
      // Create download link
      const blob = new Blob([JSON.stringify(exportResult.data, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `journal-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export data');
      console.error(err);
    }
  };

  const deleteAllData = async () => {
    if (!user || !confirm('Are you sure you want to delete all your journal data? This action cannot be undone.')) {
      return;
    }

    try {
      await privacyService.deleteUserData(user.uid);
      alert('Data deletion request submitted. Your data will be permanently deleted within 24 hours.');
    } catch (err) {
      setError('Failed to submit deletion request');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Failed to load privacy settings</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="encryption" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="encryption">
            <Lock className="h-4 w-4 mr-2" />
            Encryption
          </TabsTrigger>
          <TabsTrigger value="sharing">
            <Share2 className="h-4 w-4 mr-2" />
            Sharing
          </TabsTrigger>
          <TabsTrigger value="access">
            <Eye className="h-4 w-4 mr-2" />
            Access
          </TabsTrigger>
          <TabsTrigger value="audit">
            <Shield className="h-4 w-4 mr-2" />
            Audit
          </TabsTrigger>
          <TabsTrigger value="data">
            <Download className="h-4 w-4 mr-2" />
            Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="encryption">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Encryption Settings
              </CardTitle>
              <CardDescription>
                Control how your sensitive journal data is encrypted and protected
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Enable Encryption</Label>
                  <p className="text-sm text-muted-foreground">
                    Encrypt all journal data for maximum security
                  </p>
                </div>
                <Switch
                  checked={settings.encryptionEnabled}
                  onCheckedChange={(checked) => updateSettings({ encryptionEnabled: checked })}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Encrypt Sensitive Fields</Label>
                  <p className="text-sm text-muted-foreground">
                    Encrypt personal notes and reflections
                  </p>
                </div>
                <Switch
                  checked={settings.encryptSensitiveFields}
                  onCheckedChange={(checked) => updateSettings({ encryptSensitiveFields: checked })}
                  disabled={saving || !settings.encryptionEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Encrypt Emotional Data</Label>
                  <p className="text-sm text-muted-foreground">
                    Encrypt emotional tracking and mood data
                  </p>
                </div>
                <Switch
                  checked={settings.encryptEmotionalData}
                  onCheckedChange={(checked) => updateSettings({ encryptEmotionalData: checked })}
                  disabled={saving || !settings.encryptionEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Encrypt Personal Notes</Label>
                  <p className="text-sm text-muted-foreground">
                    Encrypt all personal notes and observations
                  </p>
                </div>
                <Switch
                  checked={settings.encryptPersonalNotes}
                  onCheckedChange={(checked) => updateSettings({ encryptPersonalNotes: checked })}
                  disabled={saving || !settings.encryptionEnabled}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sharing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Data Sharing Settings
              </CardTitle>
              <CardDescription>
                Control how your data can be shared with others
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Allow Data Sharing</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable sharing journal entries with mentors or coaches
                  </p>
                </div>
                <Switch
                  checked={settings.allowDataSharing}
                  onCheckedChange={(checked) => updateSettings({ allowDataSharing: checked })}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Allow Template Sharing</Label>
                  <p className="text-sm text-muted-foreground">
                    Share your custom templates with the community
                  </p>
                </div>
                <Switch
                  checked={settings.allowTemplateSharing}
                  onCheckedChange={(checked) => updateSettings({ allowTemplateSharing: checked })}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Share with Mentors</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow designated mentors to view your journal entries
                  </p>
                </div>
                <Switch
                  checked={settings.shareWithMentors}
                  onCheckedChange={(checked) => updateSettings({ shareWithMentors: checked })}
                  disabled={saving || !settings.allowDataSharing}
                />
              </div>

              {settings.shareWithMentors && (
                <div className="space-y-4">
                  <Label>Mentor Email Addresses</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="mentor@example.com"
                      value={newMentorEmail}
                      onChange={(e) => setNewMentorEmail(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addMentorEmail()}
                    />
                    <Button onClick={addMentorEmail} disabled={saving}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {settings.mentorEmails.map((email) => (
                      <Badge key={email} variant="secondary" className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {email}
                        <button
                          onClick={() => removeMentorEmail(email)}
                          className="ml-1 hover:text-red-500"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Access Controls
              </CardTitle>
              <CardDescription>
                Manage access controls and session security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Require Password for Sensitive Data</Label>
                  <p className="text-sm text-muted-foreground">
                    Require additional password verification for emotional data
                  </p>
                </div>
                <Switch
                  checked={settings.requirePasswordForSensitiveData}
                  onCheckedChange={(checked) => updateSettings({ requirePasswordForSensitiveData: checked })}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label>Session Timeout (minutes)</Label>
                <Input
                  type="number"
                  min="5"
                  max="480"
                  value={settings.sessionTimeout}
                  onChange={(e) => updateSettings({ sessionTimeout: parseInt(e.target.value) || 60 })}
                  disabled={saving}
                />
                <p className="text-sm text-muted-foreground">
                  Automatically log out after this period of inactivity
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Enable Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Switch
                  checked={settings.enableTwoFactorAuth}
                  onCheckedChange={(checked) => updateSettings({ enableTwoFactorAuth: checked })}
                  disabled={saving}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Audit & Monitoring
              </CardTitle>
              <CardDescription>
                Security monitoring and audit trail settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Enable Audit Logging</Label>
                  <p className="text-sm text-muted-foreground">
                    Track all access to your journal data
                  </p>
                </div>
                <Switch
                  checked={settings.enableAuditLogging}
                  onCheckedChange={(checked) => updateSettings({ enableAuditLogging: checked })}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Alert on Suspicious Activity</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified of unusual access patterns
                  </p>
                </div>
                <Switch
                  checked={settings.alertOnSuspiciousActivity}
                  onCheckedChange={(checked) => updateSettings({ alertOnSuspiciousActivity: checked })}
                  disabled={saving || !settings.enableAuditLogging}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Email Security Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive security alerts via email
                  </p>
                </div>
                <Switch
                  checked={settings.emailSecurityAlerts}
                  onCheckedChange={(checked) => updateSettings({ emailSecurityAlerts: checked })}
                  disabled={saving || !settings.alertOnSuspiciousActivity}
                />
              </div>

              {auditSummary && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-3">Security Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total Access Events:</span>
                      <span className="ml-2 font-medium">{auditSummary.totalAccess}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Security Alerts:</span>
                      <span className="ml-2 font-medium">{auditSummary.securityAlerts.length}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Risk Level:</span>
                      <Badge 
                        variant={auditSummary.riskAssessment.level === 'high' ? 'destructive' : 
                                auditSummary.riskAssessment.level === 'medium' ? 'default' : 'secondary'}
                        className="ml-2"
                      >
                        {auditSummary.riskAssessment.level.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription>
                Export, backup, and delete your journal data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Allow Data Export</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable exporting your journal data
                  </p>
                </div>
                <Switch
                  checked={settings.allowDataExport}
                  onCheckedChange={(checked) => updateSettings({ allowDataExport: checked })}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Encrypt Exports</Label>
                  <p className="text-sm text-muted-foreground">
                    Encrypt exported data files
                  </p>
                </div>
                <Switch
                  checked={settings.encryptExports}
                  onCheckedChange={(checked) => updateSettings({ encryptExports: checked })}
                  disabled={saving || !settings.allowDataExport}
                />
              </div>

              <div className="space-y-4">
                <Button 
                  onClick={exportData}
                  disabled={!settings.allowDataExport || saving}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export All Data
                </Button>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Data Deletion:</strong> This action will permanently delete all your journal data.
                    This cannot be undone.
                  </AlertDescription>
                </Alert>

                <Button 
                  onClick={deleteAllData}
                  variant="destructive"
                  disabled={saving}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {saving && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Updating privacy settings...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrivacySettingsComponent;