export type AgeGroupId = '3-5' | '6-9' | '10-15' | '16-20';

export type GameCategory =
  | 'mantiq'
  | 'xotira'
  | 'matematika'
  | 'diqqat'
  | 'strategiya';

export type NavSection =
  | 'bosh_sahifa'
  | 'barcha_oyinlar'
  | 'mantiq'
  | 'xotira'
  | 'matematika'
  | 'diqqat'
  | 'strategiya'
  | 'natijalarim'
  | 'profil';

export type DifficultyLevel = 'oson' | 'orta' | 'qiyin';

export interface AgeGroupConfig {
  id: AgeGroupId;
  label: string;
  title: string;
  subtitle: string;
  worldDescription: string;
  imageUrl: string;
  accentHex: string;
  secondaryHex: string;
  surfaceTint: string;
  styleMode: 'playful' | 'adventure' | 'observatory' | 'grandmaster';
}

export interface GameDefinition {
  id: string;
  title: string;
  shortDesc: string;
  instructions: string;
  ageGroup: AgeGroupId;
  category: GameCategory;
  difficulty: DifficultyLevel;
  estimatedMinutes: number;
  hasTimer: boolean;
  xpReward: number;
  coinReward: number;
  accentHex: string;
  visualTag: string;
}

export interface GameStats {
  gameId: string;
  plays: number;
  completions: number;
  bestScore: number;
  lastScore: number;
  bestAccuracy: number;
  fastestSeconds: number | null;
  lastPlayedAt: number;
}

export interface GameSessionResult {
  gameId: string;
  score: number;
  correctCount: number;
  incorrectCount: number;
  durationSeconds: number;
  accuracy: number;
  levelReached: number;
}

export interface CompletedResultSummary extends GameSessionResult {
  isNewRecord: boolean;
  xpEarned: number;
  coinsEarned: number;
  newlyUnlockedAchievements: AchievementDef[];
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  badgeColor: string;
  requirementText: string;
}

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  rewardXp: number;
  rewardCoins: number;
  completed: boolean;
}

export interface AudioSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  voiceEnabled: boolean;
  volume: number; // 0 to 1
}

export interface UserProfile {
  name: string;
  ageGroup: AgeGroupId;
  createdAt: number;
  xp: number;
  coins: number;
  streakDays: number;
  lastActiveDate: string;
  totalPlayTimeSeconds: number;
  favoriteGameIds: string[];
  unlockedAchievementIds: string[];
  gameStats: Record<string, GameStats>;
  recentGameIds: string[];
  history: Array<{
    gameId: string;
    score: number;
    accuracy: number;
    durationSeconds: number;
    playedAt: number;
  }>;
  audio: AudioSettings;
}

export interface AiRecommendation {
  headline: string;
  advice: string;
  recommendedGameIds: string[];
  suggestedDifficulty: DifficultyLevel;
  strongestCategory: GameCategory | null;
  focusCategory: GameCategory | null;
}

export interface GameEngineProps {
  game: GameDefinition;
  difficulty: DifficultyLevel;
  isPaused: boolean;
  onPauseToggle: () => void;
  onScorePulse?: (isPositive: boolean) => void;
  onComplete: (result: GameSessionResult) => void;
  onSpeak?: (text: string) => void;
}
