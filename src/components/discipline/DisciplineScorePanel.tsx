import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  Award, 
  Flame, 
  Star,
  ChevronRight,
  Info
} from 'lucide-react';
import { DisciplineMetrics, Achievement, Badge as DisciplineBadge, PositiveReinforcement } from '../../types/discipline';
import { DisciplineTrackingService } from '../../services/DisciplineTrackingService';

interface DisciplineScorePanelProps {
  userId: string;
  className?: string;
  onReinforcementAcknowledged?: (reinforcement: PositiveReinforcement) => void;
}

export const DisciplineScorePanel: React.FC<DisciplineScorePanelProps> = ({
  userId,
  className = '',
  onReinforcementAcknowledged
}) => {
  const [metrics, setMetrics] = useState<DisciplineMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [pendingReinforcements, setPendingReinforcements] = useState<PositiveReinforcement[]>([]);

  const disciplineService = DisciplineTrackingService.getInstance();

  useEffect(() => {
    loadDisciplineMetrics();
  }, [userId]);

  const loadDisciplineMetrics = async () => {
    try {
      setLoading(true);
      const data = await disciplineService.getDisciplineMetrics(userId);
      setMetrics(data);
    } catch (error) {
      console.error('Failed to load discipline metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReinforcementAcknowledged = (reinforcement: PositiveReinforcement) => {
    reinforcement.acknowledged = true;
    setPendingReinforcements(prev => prev.filter(r => r.id !== reinforcement.id));
    onReinforcementAcknowledged?.(reinforcement);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <p className="text-gray-500">Unable to load discipline metrics</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Pending Reinforcements */}
      {pendingReinforcements.map(reinforcement => (
        <ReinforcementNotification
          key={reinforcement.id}
          reinforcement={reinforcement}
          onAcknowledge={() => handleReinforcementAcknowledged(reinforcement)}
        />
      ))}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="streaks">Streaks</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <OverviewTab metrics={metrics} />
        </TabsContent>

        <TabsContent value="streaks" className="space-y-4">
          <StreaksTab metrics={metrics} />
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <AchievementsTab metrics={metrics} />
        </TabsContent>

        <TabsContent value="badges" className="space-y-4">
          <BadgesTab metrics={metrics} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const OverviewTab: React.FC<{ metrics: DisciplineMetrics }> = ({ metrics }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {/* Overall Score */}
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Target className="h-4 w-4" />
          Discipline Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{metrics.adherenceScore.overall}%</div>
        <Progress value={metrics.adherenceScore.overall} className="mt-2" />
        <p className="text-xs text-gray-500 mt-1">
          {metrics.adherenceScore.overall >= 90 ? 'Excellent' :
           metrics.adherenceScore.overall >= 80 ? 'Good' :
           metrics.adherenceScore.overall >= 70 ? 'Fair' : 'Needs Improvement'}
        </p>
      </CardContent>
    </Card>

    {/* Level & Points */}
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Star className="h-4 w-4" />
          Level & Points
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">Level {metrics.level}</div>
        <div className="text-sm text-gray-600">{metrics.totalPoints} points</div>
        <Progress 
          value={(metrics.totalPoints / metrics.nextLevelPoints) * 100} 
          className="mt-2" 
        />
        <p className="text-xs text-gray-500 mt-1">
          {metrics.nextLevelPoints - metrics.totalPoints} points to next level
        </p>
      </CardContent>
    </Card>

    {/* Current Streak */}
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Flame className="h-4 w-4" />
          Current Streak
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{metrics.streaks.adherentTrades.current}</div>
        <p className="text-sm text-gray-600">Adherent trades</p>
        <div className="text-xs text-gray-500 mt-1">
          Best: {metrics.streaks.adherentTrades.longest}
        </div>
      </CardContent>
    </Card>
  </div>
);

const StreaksTab: React.FC<{ metrics: DisciplineMetrics }> = ({ metrics }) => (
  <div className="space-y-4">
    <StreakCard
      title="Adherent Trades"
      icon={<Target className="h-5 w-5" />}
      current={metrics.streaks.adherentTrades.current}
      longest={metrics.streaks.adherentTrades.longest}
      lastBroken={metrics.streaks.adherentTrades.lastBroken}
      description="Consecutive trades following your strategy rules"
    />
    
    <StreakCard
      title="Profitable Adherent Trades"
      icon={<TrendingUp className="h-5 w-5" />}
      current={metrics.streaks.profitableAdherentTrades.current}
      longest={metrics.streaks.profitableAdherentTrades.longest}
      lastBroken={metrics.streaks.profitableAdherentTrades.lastBroken}
      description="Consecutive profitable trades that followed your rules"
    />
  </div>
);

const StreakCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  current: number;
  longest: number;
  lastBroken: string | null;
  description: string;
}> = ({ title, icon, current, longest, lastBroken, description }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        {icon}
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-2xl font-bold text-blue-600">{current}</div>
          <p className="text-sm text-gray-600">Current</p>
        </div>
        <div>
          <div className="text-2xl font-bold text-green-600">{longest}</div>
          <p className="text-sm text-gray-600">Best Ever</p>
        </div>
      </div>
      <p className="text-sm text-gray-500 mt-2">{description}</p>
      {lastBroken && (
        <p className="text-xs text-gray-400 mt-1">
          Last broken: {new Date(lastBroken).toLocaleDateString()}
        </p>
      )}
    </CardContent>
  </Card>
);

const AchievementsTab: React.FC<{ metrics: DisciplineMetrics }> = ({ metrics }) => {
  const disciplineService = DisciplineTrackingService.getInstance();
  const availableAchievements = disciplineService.getAvailableAchievements();

  return (
    <div className="space-y-4">
      {availableAchievements.map(achievement => (
        <AchievementCard key={achievement.id} achievement={achievement} />
      ))}
    </div>
  );
};

const AchievementCard: React.FC<{ achievement: Achievement }> = ({ achievement }) => (
  <Card className={achievement.unlockedAt ? 'border-green-200 bg-green-50' : ''}>
    <CardContent className="p-4">
      <div className="flex items-start gap-3">
        <div className="text-2xl">{achievement.icon}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{achievement.name}</h3>
            {achievement.unlockedAt && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Trophy className="h-3 w-3 mr-1" />
                Unlocked
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
          
          {!achievement.unlockedAt && (
            <div className="mt-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Progress</span>
                <span>{Math.round(achievement.progress)}%</span>
              </div>
              <Progress value={achievement.progress} className="h-2" />
            </div>
          )}
          
          {achievement.unlockedAt && (
            <p className="text-xs text-green-600 mt-1">
              Unlocked on {new Date(achievement.unlockedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

const BadgesTab: React.FC<{ metrics: DisciplineMetrics }> = ({ metrics }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {metrics.badges.length === 0 ? (
      <Card className="col-span-full">
        <CardContent className="p-6 text-center">
          <Award className="h-12 w-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">No badges earned yet</p>
          <p className="text-sm text-gray-400">Keep following your strategies to earn badges!</p>
        </CardContent>
      </Card>
    ) : (
      metrics.badges.map(badge => (
        <BadgeCard key={badge.id} badge={badge} />
      ))
    )}
  </div>
);

const BadgeCard: React.FC<{ badge: DisciplineBadge }> = ({ badge }) => (
  <Card>
    <CardContent className="p-4 text-center">
      <div className="text-3xl mb-2">{badge.icon}</div>
      <h3 className="font-semibold">{badge.name}</h3>
      <p className="text-sm text-gray-600 mt-1">{badge.description}</p>
      <Badge 
        variant="secondary" 
        className={`mt-2 ${
          badge.rarity === 'legendary' ? 'bg-purple-100 text-purple-800' :
          badge.rarity === 'epic' ? 'bg-orange-100 text-orange-800' :
          badge.rarity === 'rare' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}
      >
        {badge.rarity}
      </Badge>
      <p className="text-xs text-gray-400 mt-1">
        Earned {new Date(badge.earnedAt).toLocaleDateString()}
      </p>
    </CardContent>
  </Card>
);

const ReinforcementNotification: React.FC<{
  reinforcement: PositiveReinforcement;
  onAcknowledge: () => void;
}> = ({ reinforcement, onAcknowledge }) => (
  <Card className="border-green-200 bg-green-50">
    <CardContent className="p-4">
      <div className="flex items-start gap-3">
        <div className="text-2xl">
          {reinforcement.type === 'achievement_unlocked' ? '🏆' :
           reinforcement.type === 'streak_milestone' ? '🔥' :
           reinforcement.type === 'level_up' ? '⭐' : '🎉'}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-green-800">{reinforcement.title}</h3>
          <p className="text-sm text-green-700 mt-1">{reinforcement.message}</p>
          {reinforcement.points && (
            <p className="text-xs text-green-600 mt-1">+{reinforcement.points} points</p>
          )}
        </div>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={onAcknowledge}
          className="border-green-300 text-green-700 hover:bg-green-100"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </CardContent>
  </Card>
);

export default DisciplineScorePanel;