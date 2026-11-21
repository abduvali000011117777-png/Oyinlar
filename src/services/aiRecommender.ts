import { CATEGORY_LABELS, getGamesByAgeGroup } from '../data/gamesCatalog';
import {
  AiRecommendation,
  DifficultyLevel,
  GameCategory,
  UserProfile,
} from '../types/platform';

const ALL_CATEGORIES: GameCategory[] = [
  'mantiq',
  'xotira',
  'matematika',
  'diqqat',
  'strategiya',
];

export function generateAiRecommendation(profile: UserProfile): AiRecommendation {
  const ageGames = getGamesByAgeGroup(profile.ageGroup);

  if (profile.history.length === 0) {
    return {
      headline: `${profile.name}, ilk sarguzashtga tayyormisiz?`,
      advice:
        'Sizning yosh toifangizga mos eng qiziqarli boshlang‘ich o‘yinlarni tanladik. Avval bir necha o‘yin o‘ynang — shunda tizim kuchli tomonlaringizni aniqlaydi.',
      recommendedGameIds: ageGames.slice(0, 3).map((g) => g.id),
      suggestedDifficulty: 'oson',
      strongestCategory: null,
      focusCategory: null,
    };
  }

  const categoryScores: Record<GameCategory, { totalAcc: number; count: number }> = {
    mantiq: { totalAcc: 0, count: 0 },
    xotira: { totalAcc: 0, count: 0 },
    matematika: { totalAcc: 0, count: 0 },
    diqqat: { totalAcc: 0, count: 0 },
    strategiya: { totalAcc: 0, count: 0 },
  };

  for (const entry of profile.history) {
    const game = ageGames.find((g) => g.id === entry.gameId);
    if (!game) continue;
    categoryScores[game.category].totalAcc += entry.accuracy;
    categoryScores[game.category].count += 1;
  }

  let strongest: GameCategory = 'mantiq';
  let bestAvg = -1;
  let focus: GameCategory = 'xotira';
  let lowestScore = Infinity;

  for (const cat of ALL_CATEGORIES) {
    const stat = categoryScores[cat];
    const avg = stat.count > 0 ? stat.totalAcc / stat.count : 0;
    if (stat.count > 0 && avg > bestAvg) {
      bestAvg = avg;
      strongest = cat;
    }
    const priority = stat.count === 0 ? -10 : avg;
    if (priority < lowestScore) {
      lowestScore = priority;
      focus = cat;
    }
  }

  const recentAvgAcc =
    profile.history.slice(0, 5).reduce((sum, h) => sum + h.accuracy, 0) /
    Math.min(5, profile.history.length);

  let suggestedDifficulty: DifficultyLevel = 'orta';
  if (recentAvgAcc >= 85) suggestedDifficulty = 'qiyin';
  else if (recentAvgAcc < 58) suggestedDifficulty = 'oson';

  const unplayedInFocus = ageGames.filter(
    (g) => g.category === focus && !profile.gameStats[g.id]
  );
  const focusGames = ageGames.filter((g) => g.category === focus);
  const unplayedAny = ageGames.filter((g) => !profile.gameStats[g.id]);

  const picks = [
    ...unplayedInFocus,
    ...focusGames,
    ...unplayedAny,
    ...ageGames,
  ];
  const uniqueIds = Array.from(new Set(picks.map((g) => g.id))).slice(0, 3);

  const strongestLabel = CATEGORY_LABELS[strongest].toLowerCase();
  const focusLabel = CATEGORY_LABELS[focus].toLowerCase();

  const headline =
    bestAvg >= 78
      ? `${profile.name}, siz ${strongestLabel} yo‘nalishida juda yaxshi natija ko‘rsatyapsiz!`
      : `${profile.name}, mashqlar orqali natijalaringiz barqaror o‘sib bormoqda!`;

  const advice =
    bestAvg >= 78
      ? `Endi muvozanat uchun ${focusLabel} bo‘yicha o‘yinlarni ham sinab ko‘ring. Tavsiya etilgan qiyinlik darajasi: ${
          suggestedDifficulty === 'qiyin'
            ? 'Qiyin'
            : suggestedDifficulty === 'orta'
              ? 'O‘rta'
              : 'Oson'
        }.`
      : `Hozircha ${focusLabel} mashqlarini osonroq bosqichdan boshlab aniqlikni oshirish tavsiya etiladi.`;

  return {
    headline,
    advice,
    recommendedGameIds: uniqueIds,
    suggestedDifficulty,
    strongestCategory: strongest,
    focusCategory: focus,
  };
}
