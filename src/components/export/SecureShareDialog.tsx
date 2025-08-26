import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { ProfessionalStrategy } from '../../types/strategy';
import { Trade } from '../../types/trade';
import { ShareableReport } from '../../types/export';
import { Share2, Copy, Clock, Eye, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface SecureShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  strategy: ProfessionalStrategy;
  trades: Trade[];
}

export const SecureShareDialog: React.FC<SecureShareDialogProps> = ({
  open,
  onOpenChange,
  strategy,
  trades
}) => {
  const [shareConfig, setShareConfig] = useState({
    reportType: 'summary' as 'summary' | 'detailed' | 'custom',
    anonymized: true,
    expirationDays: 7,
    maxAccess: 10,
    requirePassword: false,
    password: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>('');

  const handleGenerateShareLink = async () => {
    setIsGenerating(true);
    
    try {
      // In a real implementation, this would call an API to generate a secure share link
      const shareableReport: ShareableReport = {
        id: `share_${Date.now()}`,
        strategyId: strategy.id,
        reportType: shareConfig.reportType,
        anonymized: shareConfig.anonymized,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + shareConfig.expirationDays * 24 * 60 * 60 * 1000).toISOString(),
        accessCount: 0,
        maxAccess: shareConfig.maxAccess
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockShareUrl = `https://app.tradingjournal.com/shared/${shareableReport.id}`;
      setShareUrl(mockShareUrl);
      
      toast.success('Secure share link generated successfully');
    } catch (error) {
      toast.error('Failed to generate share link');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success('Share link copied to clipboard');
  };

  const handleRevokeAccess = () => {
    // In a real implementation, this would revoke the share link
    setShareUrl('');
    toast.success('Share link revoked');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Secure Strategy Sharing
          </DialogTitle>
          <DialogDescription>
            Generate a secure, time-limited link to share your strategy performance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Report Type */}
          <div className="space-y-2">
            <Label>Report Type</Label>
            <Select
              value={shareConfig.reportType}
              onValueChange={(value: 'summary' | 'detailed' | 'custom') => 
                setShareConfig(prev => ({ ...prev, reportType: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">Executive Summary</SelectItem>
                <SelectItem value="detailed">Detailed Report</SelectItem>
                <SelectItem value="custom">Custom Template</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Security Options */}
          <div className="space-y-4">
            <Label className="text-base font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security Settings
            </Label>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="anonymized"
                  checked={shareConfig.anonymized}
                  onCheckedChange={(checked) => 
                    setShareConfig(prev => ({ ...prev, anonymized: !!checked }))
                  }
                />
                <Label htmlFor="anonymized">
                  Anonymize sensitive data
                  <span className="text-sm text-muted-foreground block">
                    Removes dollar amounts and personal information
                  </span>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requirePassword"
                  checked={shareConfig.requirePassword}
                  onCheckedChange={(checked) => 
                    setShareConfig(prev => ({ ...prev, requirePassword: !!checked }))
                  }
                />
                <Label htmlFor="requirePassword">Require password</Label>
              </div>

              {shareConfig.requirePassword && (
                <div className="ml-6 space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={shareConfig.password}
                    onChange={(e) => 
                      setShareConfig(prev => ({ ...prev, password: e.target.value }))
                    }
                    placeholder="Enter password"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Access Limits */}
          <div className="space-y-4">
            <Label className="text-base font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Access Limits
            </Label>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expirationDays">Expires in (days)</Label>
                <Select
                  value={shareConfig.expirationDays.toString()}
                  onValueChange={(value) => 
                    setShareConfig(prev => ({ ...prev, expirationDays: parseInt(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="7">1 week</SelectItem>
                    <SelectItem value="14">2 weeks</SelectItem>
                    <SelectItem value="30">1 month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxAccess">Max views</Label>
                <Select
                  value={shareConfig.maxAccess.toString()}
                  onValueChange={(value) => 
                    setShareConfig(prev => ({ ...prev, maxAccess: parseInt(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 view</SelectItem>
                    <SelectItem value="5">5 views</SelectItem>
                    <SelectItem value="10">10 views</SelectItem>
                    <SelectItem value="25">25 views</SelectItem>
                    <SelectItem value="100">100 views</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Generated Link */}
          {shareUrl && (
            <div className="space-y-2">
              <Label>Share Link</Label>
              <div className="flex gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="flex items-center gap-1"
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  0 / {shareConfig.maxAccess} views
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Expires in {shareConfig.expirationDays} days
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {shareUrl && (
            <Button
              variant="destructive"
              onClick={handleRevokeAccess}
              className="flex items-center gap-2"
            >
              Revoke Access
            </Button>
          )}
          
          <Button
            onClick={handleGenerateShareLink}
            disabled={isGenerating || (shareConfig.requirePassword && !shareConfig.password)}
            className="flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Generating...
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" />
                {shareUrl ? 'Regenerate Link' : 'Generate Share Link'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};