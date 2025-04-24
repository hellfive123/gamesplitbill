import { useState, useEffect } from 'react';
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Achievement,
  UserStats,
  ACHIEVEMENTS,
  calculateLevel,
  calculateExperienceForNextLevel
} from '@/lib/achievements';

interface AchievementPanelProps {
  stats: UserStats;
}

const RARITY_COLORS = {
  common: 'bg-gray-100 text-gray-800',
  rare: 'bg-blue-100 text-blue-800',
  epic: 'bg-purple-100 text-purple-800',
  legendary: 'bg-yellow-100 text-yellow-800'
};

const AchievementPanel = ({ stats }: AchievementPanelProps) => {
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const [expToNextLevel, setExpToNextLevel] = useState(0);
  const [expProgress, setExpProgress] = useState(0);

  useEffect(() => {
    // Tính toán thành tích đã mở khóa
    const unlocked = ACHIEVEMENTS.filter(achievement => achievement.condition(stats));
    setUnlockedAchievements(unlocked);

    // Tính toán kinh nghiệm cho cấp độ tiếp theo
    const expNeeded = calculateExperienceForNextLevel(stats.level);
    setExpToNextLevel(expNeeded);

    // Tính phần trăm tiến độ
    const prevLevelExp = calculateExperienceForNextLevel(stats.level - 1);
    const currentLevelProgress = stats.experience - prevLevelExp;
    const progressPercentage = (currentLevelProgress / expNeeded) * 100;
    setExpProgress(Math.min(100, Math.max(0, progressPercentage)));
  }, [stats]);

  return (
    <div className="space-y-6">
      {/* Hiển thị cấp độ và thanh kinh nghiệm */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Cấp độ {stats.level}</h2>
            <p className="text-gray-600 dark:text-gray-400">
              {stats.experience.toLocaleString()} / {(expToNextLevel + stats.experience).toLocaleString()} EXP
            </p>
          </div>
          <div className="h-16 w-16 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
            <span className="text-2xl">{stats.level >= 10 ? '👑' : '⭐'}</span>
          </div>
        </div>
        <Progress value={expProgress} className="h-2" />
      </div>

      {/* Hiển thị thống kê */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <h3 className="font-semibold text-gray-600 dark:text-gray-400">Tổng giao dịch</h3>
          <p className="text-2xl font-bold">{stats.totalTransactions}</p>
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold text-gray-600 dark:text-gray-400">Tổng lợi nhuận</h3>
          <p className="text-2xl font-bold text-green-600">{stats.totalProfit.toLocaleString()} VNĐ</p>
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold text-gray-600 dark:text-gray-400">Lợi nhuận cao nhất</h3>
          <p className="text-2xl font-bold text-purple-600">{stats.highestProfit.toLocaleString()} VNĐ</p>
        </Card>
      </div>

      {/* Hiển thị thành tích */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ACHIEVEMENTS.map((achievement) => {
          const isUnlocked = achievement.condition(stats);
          return (
            <Card
              key={achievement.id}
              className={`p-4 ${isUnlocked ? 'bg-white dark:bg-gray-800' : 'bg-gray-100 dark:bg-gray-900 opacity-60'}`}
            >
              <div className="flex items-start space-x-4">
                <div className="text-3xl">{achievement.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{achievement.title}</h3>
                    <Badge className={RARITY_COLORS[achievement.rarity]}>
                      {achievement.rarity}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {achievement.description}
                  </p>
                  {isUnlocked && (
                    <Badge className="mt-2 bg-green-100 text-green-800">
                      Đã mở khóa
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AchievementPanel; 