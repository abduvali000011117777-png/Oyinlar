import { ACHIEVEMENTS, GAMES_CATALOG } from '../data/gamesCatalog';
import {
  AchievementDef,
  AgeGroupId,
  AudioSettings,
  CompletedResultSummary,
  DailyMission,
  GameSessionResult,
  UserProfile,
} from '../types/platform';

const STORAGE_KEY = 'aql_arena_profile_v1';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function createDefaultProfile(name: string, ageGroup: AgeGroupId): UserProfile {
  return {
    name: name.trim(),
    ageGroup,
    createdAt: Date.now(),
    xp: 0,
    coins: 50,
    streakDays: 1,
    lastActiveDate: todayKey(),
    totalPlayTimeSeconds: 0,
    favoriteGameIds: [],
    unlockedAchievementIds: [],
    gameStats: {},
    recentGameIds: [],
    history: [],
    audio: {
      soundEnabled: true,
      musicEnabled: false,
      voiceEnabled: true,
      volume: 0.65,
    },
  };
}

export function loadUserProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserProfile;
    if (!parsed || !parsed.name || !parsed.ageGroup) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export function clearUserProfile(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

export function getLevelFromXp(xp: number): {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPct: number;
} {
  const level = Math.floor(xp / 250) + 1;
  const currentLevelXp = xp % 250;
  const nextLevelXp = 250;
  const progressPct = Math.round((currentLevelXp / nextLevelXp) * 100);
  return { level, currentLevelXp, nextLevelXp, progressPct };
}

export function recordGameCompletion(
  profile: UserProfile,
  session: GameSessionResult
): { updatedProfile: UserProfile; summary: CompletedResultSummary } {
  const game = GAMES_CATALOG.find((g) => g.id === session.gameId);
  const existing = profile.gameStats[session.gameId];
  const isNewRecord = !existing || session.score > existing.bestScore;

  const accuracyBonus = session.accuracy >= 85 ? 1.25 : session.accuracy >= 65 ? 1.0 : 0.75;
  const xpEarned = Math.round((game?.xpReward ?? 50) * accuracyBonus + session.score * 0.15);
  const coinsEarned = Math.round((game?.coinReward ?? 20) * accuracyBonus + (isNewRecord ? 15 : 0));

  const updatedStats = {
    ...profile.gameStats,
    [session.gameId]: {
      gameId: session.gameId,
      plays: (existing?.plays ?? 0) + 1,
      completions: (existing?.completions ?? 0) + 1,
      bestScore: Math.max(existing?.bestScore ?? 0, session.score),
      lastScore: session.score,
      bestAccuracy: Math.max(existing?.bestAccuracy ?? 0, session.accuracy),
      fastestSeconds:
        existing?.fastestSeconds == null
          ? session.durationSeconds
          : Math.min(existing.fastestSeconds, session.durationSeconds),
      lastPlayedAt: Date.now(),
    },
  };

  const today = todayKey();
  const streakDays =
    profile.lastActiveDate === today ? profile.streakDays : profile.streakDays + 1;

  const recentGameIds = [
    session.gameId,
    ...profile.recentGameIds.filter((id) => id !== session.gameId),
  ].slice(0, 8);

  const history = [
    {
      gameId: session.gameId,
      score: session.score,
      accuracy: session.accuracy,
      durationSeconds: session.durationSeconds,
      playedAt: Date.now(),
    },
    ...profile.history,
  ].slice(0, 50);

  const candidateProfile: UserProfile = {
    ...profile,
    xp: profile.xp + xpEarned,
    coins: profile.coins + coinsEarned,
    streakDays,
    lastActiveDate: today,
    totalPlayTimeSeconds: profile.totalPlayTimeSeconds + session.durationSeconds,
    gameStats: updatedStats,
    recentGameIds,
    history,
  };

  const newlyUnlocked = evaluateAchievements(candidateProfile);
  const finalProfile: UserProfile = {
    ...candidateProfile,
    unlockedAchievementIds: [
      ...new Set([
        ...candidateProfile.unlockedAchievementIds,
        ...newlyUnlocked.map((a) => a.id),
      ]),
    ],
  };

  saveUserProfile(finalProfile);

  return {
    updatedProfile: finalProfile,
    summary: {
      ...session,
      isNewRecord,
      xpEarned,
      coinsEarned,
      newlyUnlockedAchievements: newlyUnlocked,
    },
  };
}

function evaluateAchievements(profile: UserProfile): AchievementDef[] {
  const already = new Set(profile.unlockedAchievementIds);
  const unlocked: AchievementDef[] = [];

  const totalCompletions = Object.values(profile.gameStats).reduce(
    (sum, s) => sum + s.completions,
    0
  );
  const distinctCompleted = Object.keys(profile.gameStats).length;

  const memoryHigh = profile.history.filter((h) => {
    const g = GAMES_CATALOG.find((item) => item.id === h.gameId);
    return g?.category === 'xotira' && h.accuracy >= 80;
  }).length;

  const mathScore = Object.values(profile.gameStats).reduce((sum, s) => {
    const g = GAMES_CATALOG.find((item) => item.id === s.gameId);
    return g?.category === 'matematika' ? sum + s.bestScore : sum;
  }, 0);

  const logicHigh = profile.history.filter((h) => {
    const g = GAMES_CATALOG.find((item) => item.id === h.gameId);
    return g?.category === 'mantiq' && h.accuracy >= 90;
  }).length;

  const attentionBest = Object.values(profile.gameStats).reduce((max, s) => {
    const g = GAMES_CATALOG.find((item) => item.id === s.gameId);
    return g?.category === 'diqqat' ? Math.max(max, s.bestScore) : max;
  }, 0);

  const checks: Record<string, boolean> = {
    'first-victory': totalCompletions >= 1,
    'memory-hero': memoryHigh >= 3,
    'math-master': mathScore >= 500,
    'logic-genius': logicHigh >= 3,
    'speed-thinker': attentionBest >= 200,
    'arena-champion': distinctCompleted >= 10,
  };

  for (const ach of ACHIEVEMENTS) {
    if (!already.has(ach.id) && checks[ach.id]) {
      unlocked.push(ach);
    }
  }
  return unlocked;
}

export function getDailyMissions(profile: UserProfile): DailyMission[] {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const ts = todayStart.getTime();

  const todayHistory = profile.history.filter((h) => h.playedAt >= ts);
  const highAccuracyToday = todayHistory.filter((h) => h.accuracy >= 80).length;
  const distinctCatsToday = new Set(
    todayHistory
      .map((h) => GAMES_CATALOG.find((g) => g.id === h.gameId)?.category)
      .filter(Boolean)
  ).size;

  return [
    {
      id: 'daily-play-2',
      title: 'Kunlik faollik',
      description: 'Bugun kamida 2 ta o‘yinni yakunlang',
      target: 2,
      progress: Math.min(2, todayHistory.length),
      rewardXp: 80,
      rewardCoins: 30,
      completed: todayHistory.length >= 2,
    },
    {
      id: 'daily-accuracy',
      title: 'Aniq tafakkur',
      description: 'Bugun 80%+ aniqlik bilan o‘yin yakunlang',
      target: 1,
      progress: Math.min(1, highAccuracyToday),
      rewardXp: 60,
      rewardCoins: 25,
      completed: highAccuracyToday >= 1,
    },
    {
      id: 'daily-variety',
      title: 'Ko‘p qirrali aql',
      description: '2 xil yo‘nalishdagi o‘yinni o‘ynang',
      target: 2,
      progress: Math.min(2, distinctCatsToday),
      rewardXp: 90,
      rewardCoins: 35,
      completed: distinctCatsToday >= 2,
    },
  ];
}

export function getLeaderboard(profile: UserProfile) {
  const peers = [
    { name: 'Azizbek T.', ageGroup: profile.ageGroup, xp: 1420 },
    { name: 'Madina K.', ageGroup: profile.ageGroup, xp: 1180 },
    { name: 'Sardorbek R.', ageGroup: profile.ageGroup, xp: 890 },
    { name: 'Ziyoda M.', ageGroup: profile.ageGroup, xp: 640 },
    { name: 'Jasur N.', ageGroup: profile.ageGroup, xp: 390 },
  ];

  const combined = [
    ...peers.map((p) => ({ ...p, isCurrentUser: false })),
    { name: profile.name, ageGroup: profile.ageGroup, xp: profile.xp, isCurrentUser: true },
  ].sort((a, b) => b.xp - a.xp);

  return combined.map((item, idx) => ({
    rank: idx + 1,
    ...item,
  }));
}

export function updateAudioSettings(
  profile: UserProfile,
  audio: Partial<AudioSettings>
): UserProfile {
  const updated: UserProfile = {
    ...profile,
    audio: {
      ...profile.audio,
      ...audio,
    },
  };
  saveUserProfile(updated);
  return updated;
}
