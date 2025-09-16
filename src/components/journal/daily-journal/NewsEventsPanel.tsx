import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog';
import { Label } from '../../ui/label';
import { Switch } from '../../ui/switch';
import {
  Plus,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info,
  Globe,
  DollarSign,
  Edit,
  Trash2,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { cn } from '../../../lib/utils';

// Import journal types for news events
import { JournalEntry } from '../../../types/journal';

interface NewsEvent {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  type: 'economic' | 'political' | 'corporate' | 'weather' | 'other';
  region: 'us' | 'eu' | 'asia' | 'global' | 'other';
  timestamp: string;
  source?: string;
  url?: string;
  isActive: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface NewsEventsPanelProps {
  selectedDate: Date;
  journalEntry?: JournalEntry;
  onEventAdd?: (event: NewsEvent) => void;
  onEventUpdate?: (eventId: string, updates: Partial<NewsEvent>) => void;
  onEventDelete?: (eventId: string) => void;
  className?: string;
}

/**
 * NewsEventsPanel Component
 *
 * Manual news event entry with future API integration support.
 * Allows users to track market-moving news events alongside journal entries.
 * Designed to be extensible for future news API integrations.
 */
export const NewsEventsPanel: React.FC<NewsEventsPanelProps> = ({
  selectedDate,
  journalEntry,
  onEventAdd,
  onEventUpdate,
  onEventDelete,
  className
}) => {
  const { user } = useAuth();

  // ===== STATE MANAGEMENT =====

  // Events state
  const [events, setEvents] = useState<NewsEvent[]>([]);
  const [loading, setLoading] = useState(false);

  // UI state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<NewsEvent | null>(null);
  const [showApiIntegration, setShowApiIntegration] = useState(false);

  // Form state for new/editing events
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    impact: 'medium' as NewsEvent['impact'],
    type: 'economic' as NewsEvent['type'],
    region: 'us' as NewsEvent['region'],
    source: '',
    url: '',
    isActive: true
  });

  // ===== DATA LOADING =====

  // Load events for the selected date
  useEffect(() => {
    const loadEventsForDate = async () => {
      if (!user) return;

      setLoading(true);
      try {
        // TODO: Load from Firebase when storage is implemented
        // For now, use mock data
        const mockEvents: NewsEvent[] = [];

        // Filter events for selected date
        const dateKey = selectedDate.toISOString().split('T')[0];
        const filteredEvents = mockEvents.filter(event =>
          dateKey && event.timestamp.startsWith(dateKey)
        );

        setEvents(filteredEvents);
      } catch (error) {
        console.error('Error loading news events:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEventsForDate();
  }, [user, selectedDate]);

  // ===== EVENT HANDLERS =====

  // Handle form submission for adding/editing events
  const handleEventSubmit = async () => {
    if (!user || !eventForm.title.trim()) return;

    try {
      const now = new Date().toISOString();
      const eventData: Omit<NewsEvent, 'id'> = {
        ...eventForm,
        timestamp: selectedDate.toISOString(),
        userId: user.uid,
        createdAt: now,
        updatedAt: now
      };

      if (editingEvent) {
        // Update existing event
        const updatedEvent: NewsEvent = {
          ...editingEvent,
          ...eventData,
          updatedAt: now
        };

        // TODO: Save to Firebase
        setEvents(prev => prev.map(e => e.id === editingEvent.id ? updatedEvent : e));
        onEventUpdate?.(editingEvent.id, updatedEvent);
      } else {
        // Create new event
        const newEvent: NewsEvent = {
          ...eventData,
          id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };

        // TODO: Save to Firebase
        setEvents(prev => [...prev, newEvent]);
        onEventAdd?.(newEvent);
      }

      // Reset form and close dialog
      setEventForm({
        title: '',
        description: '',
        impact: 'medium',
        type: 'economic',
        region: 'us',
        source: '',
        url: '',
        isActive: true
      });
      setShowAddDialog(false);
      setEditingEvent(null);

    } catch (error) {
      console.error('Error saving news event:', error);
    }
  };

  // Handle editing an event
  const handleEditEvent = (event: NewsEvent) => {
    setEventForm({
      title: event.title,
      description: event.description,
      impact: event.impact,
      type: event.type,
      region: event.region,
      source: event.source || '',
      url: event.url || '',
      isActive: event.isActive
    });
    setEditingEvent(event);
    setShowAddDialog(true);
  };

  // Handle deleting an event
  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this news event?')) return;

    try {
      // TODO: Delete from Firebase
      setEvents(prev => prev.filter(e => e.id !== eventId));
      onEventDelete?.(eventId);
    } catch (error) {
      console.error('Error deleting news event:', error);
    }
  };

  // Handle toggling event active status
  const handleToggleActive = async (eventId: string, isActive: boolean) => {
    try {
      // TODO: Update in Firebase
      setEvents(prev => prev.map(e =>
        e.id === eventId ? { ...e, isActive, updatedAt: new Date().toISOString() } : e
      ));
      onEventUpdate?.(eventId, { isActive, updatedAt: new Date().toISOString() });
    } catch (error) {
      console.error('Error updating event status:', error);
    }
  };

  // ===== UTILITY FUNCTIONS =====

  // Get impact color and icon
  const getImpactInfo = (impact: NewsEvent['impact']) => {
    switch (impact) {
      case 'high':
        return { color: 'text-red-600', bgColor: 'bg-red-50', icon: TrendingUp };
      case 'medium':
        return { color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: AlertTriangle };
      case 'low':
        return { color: 'text-blue-600', bgColor: 'bg-blue-50', icon: Info };
    }
  };

  // Get region display name
  const getRegionName = (region: NewsEvent['region']) => {
    switch (region) {
      case 'us': return 'United States';
      case 'eu': return 'Europe';
      case 'asia': return 'Asia';
      case 'global': return 'Global';
      case 'other': return 'Other';
    }
  };

  // Get type display name
  const getTypeName = (type: NewsEvent['type']) => {
    switch (type) {
      case 'economic': return 'Economic';
      case 'political': return 'Political';
      case 'corporate': return 'Corporate';
      case 'weather': return 'Weather';
      case 'other': return 'Other';
    }
  };

  // ===== RENDER HELPERS =====

  // Render event card
  const renderEventCard = (event: NewsEvent) => {
    const impactInfo = getImpactInfo(event.impact);
    const Icon = impactInfo.icon;

    return (
      <Card key={event.id} className={cn(
        "transition-all duration-200 hover:shadow-md",
        !event.isActive && "opacity-60"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                impactInfo.bgColor
              )}>
                <Icon className={cn("h-4 w-4", impactInfo.color)} />
              </div>
              <div className="flex-1">
                <CardTitle className="text-sm font-medium">{event.title}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {getTypeName(event.type)}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {getRegionName(event.region)}
                  </Badge>
                  {!event.isActive && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      Inactive
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Switch
                checked={event.isActive}
                onCheckedChange={(checked) => handleToggleActive(event.id, checked)}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditEvent(event)}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteEvent(event.id)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {event.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {event.description}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                {new Date(event.timestamp).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              {event.source && (
                <>
                  <span>•</span>
                  <span>{event.source}</span>
                </>
              )}
            </div>

            {event.url && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(event.url, '_blank')}
                className="h-6 w-6 p-0"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // ===== MAIN RENDER =====

  if (!user) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Please log in to access news events</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Globe className="h-5 w-5" />
            News Events
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Track market-moving news and events for {selectedDate.toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowApiIntegration(true)}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            API Integration
          </Button>

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Event
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingEvent ? 'Edit News Event' : 'Add News Event'}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="event-title">Title *</Label>
                  <Input
                    id="event-title"
                    value={eventForm.title}
                    onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., FOMC Meeting, CPI Data Release"
                  />
                </div>

                <div>
                  <Label htmlFor="event-description">Description</Label>
                  <Textarea
                    id="event-description"
                    value={eventForm.description}
                    onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Details about the news event..."
                    className="min-h-[80px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="event-impact">Impact Level</Label>
                    <Select
                      value={eventForm.impact}
                      onValueChange={(value: NewsEvent['impact']) =>
                        setEventForm(prev => ({ ...prev, impact: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High Impact</SelectItem>
                        <SelectItem value="medium">Medium Impact</SelectItem>
                        <SelectItem value="low">Low Impact</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="event-type">Event Type</Label>
                    <Select
                      value={eventForm.type}
                      onValueChange={(value: NewsEvent['type']) =>
                        setEventForm(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="economic">Economic</SelectItem>
                        <SelectItem value="political">Political</SelectItem>
                        <SelectItem value="corporate">Corporate</SelectItem>
                        <SelectItem value="weather">Weather</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="event-region">Region</Label>
                  <Select
                    value={eventForm.region}
                    onValueChange={(value: NewsEvent['region']) =>
                      setEventForm(prev => ({ ...prev, region: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="us">United States</SelectItem>
                      <SelectItem value="eu">Europe</SelectItem>
                      <SelectItem value="asia">Asia</SelectItem>
                      <SelectItem value="global">Global</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="event-source">Source</Label>
                  <Input
                    id="event-source"
                    value={eventForm.source}
                    onChange={(e) => setEventForm(prev => ({ ...prev, source: e.target.value }))}
                    placeholder="e.g., Bloomberg, Reuters"
                  />
                </div>

                <div>
                  <Label htmlFor="event-url">URL</Label>
                  <Input
                    id="event-url"
                    type="url"
                    value={eventForm.url}
                    onChange={(e) => setEventForm(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="event-active"
                    checked={eventForm.isActive}
                    onCheckedChange={(checked) => setEventForm(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="event-active">Active event</Label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddDialog(false);
                      setEditingEvent(null);
                      setEventForm({
                        title: '',
                        description: '',
                        impact: 'medium',
                        type: 'economic',
                        region: 'us',
                        source: '',
                        url: '',
                        isActive: true
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleEventSubmit}
                    disabled={!eventForm.title.trim()}
                  >
                    {editingEvent ? 'Update Event' : 'Add Event'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* API Integration Preview */}
      <Dialog open={showApiIntegration} onOpenChange={setShowApiIntegration}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              API Integration (Coming Soon)
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Planned API Integrations:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Bloomberg Terminal API</li>
                <li>• Reuters Eikon API</li>
                <li>• ForexFactory Calendar API</li>
                <li>• Custom news aggregators</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Current Status:</h4>
              <p className="text-sm text-blue-800">
                Currently supports manual news event entry. API integrations will be added in future updates
                to automatically fetch and display market-moving news events.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Events List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2 mt-2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-16 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No news events</h3>
            <p className="text-muted-foreground mb-4">
              Add news events that may impact your trading for {selectedDate.toLocaleDateString()}
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Event
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map(renderEventCard)}
        </div>
      )}

      {/* Summary */}
      {events.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {events.filter(e => e.isActive).length} active events for {selectedDate.toLocaleDateString()}
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {events.filter(e => e.impact === 'high').length} high impact
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {events.filter(e => e.impact === 'medium').length} medium impact
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NewsEventsPanel;