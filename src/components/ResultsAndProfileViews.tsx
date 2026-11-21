import { Award, CheckCircle2, Heart, Play, RotateCcw, Trophy, User } from 'lucide-react';
import {
  ACHIEVEMENTS,
  AGE_GROUPS,
  CATEGORY_LABELS,
  GAMES_CATALOG,
  getAgeGroupConfig,
  getGamesByAgeGroup,
} from '../data/gamesCatalog';
import { audioService } from '../services/audioService';
import {
  getDailyMissions,
  getLeaderboard,
  getLevelFromXp,
} from '../services/storageService';
import { AgeGroupId, GameCategory, GameDefinition, UserProfile } from '../types/platform';

interface ResultsViewProps {
  profile: UserProfile;
  onPlayGame: (game: GameDefinition) => void;
}

export function ResultsView({ profile, onPlayGame }: ResultsViewProps) {
  const ageGames = getGamesByAgeGroup(profile.ageGroup);
  const missions = getDailyMissions(profile);
  const leaderboard = getLeaderboard(profile);
  const levelInfo = getLevelFromXp(profile.xp);

  const categoryStats = (Object.keys(CATEGORY_LABELS) as GameCategory[]).map((cat) => {
    const entries = profile.history.filter((h) => {
      const g = GAMES_CATALOG.find((item) => item.id === h.gameId);
      return g?.category === cat;
    });
    const avgAccuracy =
      entries.length > 0
        ? Math.round(entries.reduce((s, e) => s + e.accuracy, 0) / entries.length)
        : 0;
    return {
      category: cat,
      label: CATEGORY_LABELS[cat],
      plays: entries.length,
      avgAccuracy,
    };
  });

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Natijalarim va Yutuqlar</h1>
        <p className="text-sm text-slate-400">
          O‘yinlardagi aniqlik, rivojlanish grafigi va kunlik vazifalar holati. Ushbu ko‘rsatkichlar ta’limiy mashq taraqqiyotini aks ettiradi va tibbiy IQ o‘lchovi hisoblanmaydi.
        </p>
      </div>

      {/* Category Progress Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-[#0E1629] border border-slate-800 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Yo‘nalishlar bo‘yicha aniqlik</h2>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              Daraja {levelInfo.level} · {profile.xp} XP
            </span>
          </div>

          <div className="space-y-4">
            {categoryStats.map((stat) => (
              <div key={stat.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-200 font-medium">{stat.label}</span>
                  <span className="font-mono text-xs text-slate-400 tabular-nums">
                    {stat.plays} o‘yin · {stat.avgAccuracy}% aniqlik
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-sky-400 transition-all duration-300"
                    style={{ width: `${Math.max(4, stat.avgAccuracy)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily & Weekly Missions */}
        <div className="p-6 rounded-2xl bg-[#0E1629] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Kunlik vazifalar</h2>
            <span className="text-xs text-amber-400 font-medium">
              Ketma-ketlik: {profile.streakDays} kun
            </span>
          </div>

          <div className="space-y-3">
            {missions.map((m) => (
              <div
                key={m.id}
                className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 ${
                        m.completed ? 'text-emerald-400' : 'text-slate-600'
                      }`}
                    />
                    <p className="text-sm font-bold text-white">{m.title}</p>
                  </div>
                  <p className="text-xs text-slate-400">{m.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono text-sm font-bold text-amber-300 tabular-nums">
                    {m.progress}/{m.target}
                  </p>
                  <p className="text-xs text-slate-400">+{m.rewardXp} XP</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">Yutuqlar va Nishonlar</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ACHIEVEMENTS.map((ach) => {
            const unlocked = profile.unlockedAchievementIds.includes(ach.id);
            return (
              <div
                key={ach.id}
                className={`p-5 rounded-2xl border transition-colors ${
                  unlocked
                    ? 'bg-[#101B33] border-amber-400/50'
                    : 'bg-[#0C1222] border-slate-800/80 opacity-65'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold" style={{ color: unlocked ? ach.badgeColor : '#64748B' }}>
                      {unlocked ? 'Ochilgan' : 'Qulflangan'}
                    </p>
                    <h3 className="text-base font-bold text-white">{ach.title}</h3>
                  </div>
                  <Award
                    className="w-6 h-6 shrink-0"
                    style={{ color: unlocked ? ach.badgeColor : '#475569' }}
                  />
                </div>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">{ach.description}</p>
                <p className="text-xs text-slate-500 mt-3 pt-2 border-t border-slate-800">
                  Shart: {ach.requirementText}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Leaderboard & History */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-[#0E1629] border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Peshqadamlar jadvali ({profile.ageGroup} yosh)</h2>
          </div>

          <div className="divide-y divide-slate-800">
            {leaderboard.map((row) => (
              <div
                key={`${row.rank}-${row.name}`}
                className={`py-3 px-3 flex items-center justify-between text-sm rounded-lg ${
                  row.isCurrentUser ? 'bg-amber-400/10 text-amber-200 font-bold' : 'text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 font-mono text-slate-400 tabular-nums">#{row.rank}</span>
                  <span>{row.name} {row.isCurrentUser ? '(Siz)' : ''}</span>
                </div>
                <span className="font-mono tabular-nums text-amber-300">{row.xp} XP</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#0E1629] border border-slate-800 space-y-4">
          <h2 className="text-lg font-bold text-white">So‘nggi o‘yinlar tarixi</h2>
          {profile.history.length === 0 ? (
            <div className="py-8 text-center space-y-3">
              <p className="text-sm text-slate-400">Hali birorta o‘yin yakunlanmagan.</p>
              {ageGames[0] && (
                <button
                  type="button"
                  onClick={() => onPlayGame(ageGames[0])}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Birinchi o‘yinni boshlash</span>
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-800 max-h-72 overflow-y-auto">
              {profile.history.slice(0, 12).map((h, i) => {
                const g = GAMES_CATALOG.find((item) => item.id === h.gameId);
                return (
                  <div key={i} className="py-2.5 flex items-center justify-between text-sm gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">{g?.title ?? h.gameId}</p>
                      <p className="text-xs text-slate-400">
                        {h.accuracy}% aniqlik · {h.durationSeconds}s
                      </p>
                    </div>
                    <span className="font-mono font-bold text-emerald-400 tabular-nums shrink-0">
                      {h.score} ball
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

interface ProfileViewProps {
  profile: UserProfile;
  onUpdateProfile: (next: UserProfile) => void;
  onPlayGame: (game: GameDefinition) => void;
  onResetAll: () => void;
}

export function ProfileView({
  profile,
  onUpdateProfile,
  onPlayGame,
  onResetAll,
}: ProfileViewProps) {
  const ageCfg = getAgeGroupConfig(profile.ageGroup);
  const levelInfo = getLevelFromXp(profile.xp);
  const favorites = GAMES_CATALOG.filter(
    (g) => g.ageGroup === profile.ageGroup && profile.favoriteGameIds.includes(g.id)
  );
  const completedDistinct = Object.keys(profile.gameStats).filter((id) =>
    GAMES_CATALOG.some((g) => g.id === id && g.ageGroup === profile.ageGroup)
  ).length;

  const handleAgeSwitch = (ageId: AgeGroupId) => {
    audioService.playClick();
    onUpdateProfile({ ...profile, ageGroup: ageId });
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0E1629] border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-400/15 border border-amber-400/40 flex items-center justify-center text-amber-400">
            <User className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-400">
              {ageCfg.label} · {ageCfg.title}
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5">{profile.name}</h1>
            <p className="text-xs text-slate-400 mt-1 font-mono tabular-nums">
              Daraja {levelInfo.level} · {profile.xp} XP · {profile.coins} tanga
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full sm:w-auto">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <p className="text-xs text-slate-400">Yakunlangan</p>
            <p className="text-xl font-bold font-mono text-white tabular-nums">{completedDistinct} / 10</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <p className="text-xs text-slate-400">O‘ynalgan vaqt</p>
            <p className="text-xl font-bold font-mono text-sky-400 tabular-nums">
              {Math.max(1, Math.round(profile.totalPlayTimeSeconds / 60))} daq
            </p>
          </div>
        </div>
      </div>

      {/* Age Group Switcher */}
      <section className="p-6 rounded-2xl bg-[#0E1629] border border-slate-800 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white">Yosh toifasini o‘zgartirish</h2>
          <p className="text-xs text-slate-400 mt-1">
            Har bir yosh toifasida 10 tadan maxsus moslashtirilgan o‘yinlar mavjud.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {AGE_GROUPS.map((g) => {
            const active = profile.ageGroup === g.id;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => handleAgeSwitch(g.id)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  active
                    ? 'bg-amber-400/15 border-amber-400 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600'
                }`}
              >
                <p className="text-sm font-bold">{g.label}</p>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{g.title}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Audio Settings */}
      <section className="p-6 rounded-2xl bg-[#0E1629] border border-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-white">Ovoz va musiqa sozlamalari</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() =>
              onUpdateProfile({
                ...profile,
                audio: { ...profile.audio, soundEnabled: !profile.audio.soundEnabled },
              })
            }
            className={`p-4 rounded-xl border text-left cursor-pointer ${
              profile.audio.soundEnabled
                ? 'bg-sky-500/15 border-sky-400/50 text-white'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <p className="text-sm font-bold">O‘yin tovushlari</p>
            <p className="text-xs mt-1">{profile.audio.soundEnabled ? 'Yoqilgan' : 'O‘chirilgan'}</p>
          </button>

          <button
            type="button"
            onClick={() =>
              onUpdateProfile({
                ...profile,
                audio: { ...profile.audio, musicEnabled: !profile.audio.musicEnabled },
              })
            }
            className={`p-4 rounded-xl border text-left cursor-pointer ${
              profile.audio.musicEnabled
                ? 'bg-emerald-500/15 border-emerald-400/50 text-white'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <p className="text-sm font-bold">Fon musiqasi</p>
            <p className="text-xs mt-1">{profile.audio.musicEnabled ? 'Yoqilgan' : 'O‘chirilgan'}</p>
          </button>

          <button
            type="button"
            onClick={() =>
              onUpdateProfile({
                ...profile,
                audio: { ...profile.audio, voiceEnabled: !profile.audio.voiceEnabled },
              })
            }
            className={`p-4 rounded-xl border text-left cursor-pointer ${
              profile.audio.voiceEnabled
                ? 'bg-amber-500/15 border-amber-400/50 text-white'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <p className="text-sm font-bold">Ovozli ko‘rsatmalar</p>
            <p className="text-xs mt-1">{profile.audio.voiceEnabled ? 'Yoqilgan' : 'O‘chirilgan'}</p>
          </button>
        </div>

        <label className="block pt-2">
          <div className="flex justify-between text-xs text-slate-300 mb-1.5">
            <span>Ovoz balandligi</span>
            <span className="font-mono tabular-nums">{Math.round(profile.audio.volume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={profile.audio.volume}
            onChange={(e) =>
              onUpdateProfile({
                ...profile,
                audio: { ...profile.audio, volume: Number(e.target.value) },
              })
            }
            className="w-full accent-amber-400"
          />
        </label>
      </section>

      {/* Favorites */}
      <section className="p-6 rounded-2xl bg-[#0E1629] border border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-rose-400" />
          <h2 className="text-lg font-bold text-white">Sevimli o‘yinlar</h2>
        </div>

        {favorites.length === 0 ? (
          <p className="text-sm text-slate-400">
            Hali sevimli o‘yin qo‘shilmagan. O‘yin kartochkasidagi yurakcha belgisini bosing.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {favorites.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => onPlayGame(g)}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-400 flex items-center justify-between text-left cursor-pointer"
              >
                <div>
                  <p className="font-bold text-white text-sm">{g.title}</p>
                  <p className="text-xs text-slate-400">{CATEGORY_LABELS[g.category]}</p>
                </div>
                <Play className="w-4 h-4 text-amber-400 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </section>

      <div className="pt-2">
        <button
          type="button"
          onClick={onResetAll}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25 text-xs font-semibold cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Profilni yangidan boshlash</span>
        </button>
      </div>
    </div>
  );
}
