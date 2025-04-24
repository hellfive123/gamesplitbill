export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: (stats: UserStats) => boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface UserStats {
  totalTransactions: number;
  totalProfit: number;
  highestProfit: number;
  transactionsToday: number;
  averageProfit: number;
  consecutiveProfitDays: number;
  level: number;
  experience: number;
}

export const EXPERIENCE_PER_LEVEL = 1000; // Kinh nghiệm cần để lên mỗi cấp
export const EXPERIENCE_MULTIPLIER = 1.5; // Hệ số tăng kinh nghiệm mỗi cấp

export const calculateLevel = (experience: number): number => {
  let level = 1;
  let expNeeded = EXPERIENCE_PER_LEVEL;
  let totalExpNeeded = expNeeded;

  while (experience >= totalExpNeeded) {
    level++;
    expNeeded *= EXPERIENCE_MULTIPLIER;
    totalExpNeeded += expNeeded;
  }

  return level;
};

export const calculateExperienceForNextLevel = (currentLevel: number): number => {
  return Math.floor(EXPERIENCE_PER_LEVEL * Math.pow(EXPERIENCE_MULTIPLIER, currentLevel - 1));
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_trade',
    title: 'Thương Nhân Tập Sự',
    description: 'Hoàn thành giao dịch đầu tiên',
    icon: '🌟',
    condition: (stats) => stats.totalTransactions >= 1,
    rarity: 'common'
  },
  {
    id: 'profit_master',
    title: 'Bậc Thầy Lợi Nhuận',
    description: 'Đạt tổng lợi nhuận 10,000,000 VNĐ',
    icon: '💰',
    condition: (stats) => stats.totalProfit >= 10000000,
    rarity: 'rare'
  },
  {
    id: 'speed_trader',
    title: 'Thương Nhân Siêu Tốc',
    description: 'Hoàn thành 5 giao dịch trong một ngày',
    icon: '⚡',
    condition: (stats) => stats.transactionsToday >= 5,
    rarity: 'rare'
  },
  {
    id: 'golden_deal',
    title: 'Thương Vụ Vàng',
    description: 'Đạt lợi nhuận trên 5,000,000 VNĐ trong một giao dịch',
    icon: '🏆',
    condition: (stats) => stats.highestProfit >= 5000000,
    rarity: 'epic'
  },
  {
    id: 'consistent_trader',
    title: 'Thương Nhân Bền Bỉ',
    description: 'Duy trì lợi nhuận dương trong 7 ngày liên tiếp',
    icon: '📈',
    condition: (stats) => stats.consecutiveProfitDays >= 7,
    rarity: 'epic'
  },
  {
    id: 'legendary_trader',
    title: 'Thương Nhân Huyền Thoại',
    description: 'Đạt cấp độ 10',
    icon: '👑',
    condition: (stats) => stats.level >= 10,
    rarity: 'legendary'
  }
]; 