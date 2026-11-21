import { useMemo, useState } from 'react';
import {
  Brain,
  Compass,
  Heart,
  Music,
  Play,
  Search,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  CATEGORY_LABELS,
  getAgeGroupConfig,
  getGamesByAgeGroup,
} from '../data/gamesCatalog';
import { generateAiRecommendation } from '../services/aiRecommender';
import { audioService } from '../services/audioService';
import { getDailyMissions, getLevelFromXp } from '../services/storageService';
import ArenaScene3D from '../three/ArenaScene3D';
import {
  GameCategory,
  GameDefinition,
  NavSection,
  UserProfile,
} from '../types/platform';
import { ProfileView, ResultsView } from './ResultsAndProfileViews';

interface DashboardPortalProps {
  profile: UserProfile;
  onUpdateProfile: (next: UserProfile) => void;
  onLaunchGame: (game: GameDefinition) => void;
  onResetProfile: () => void;
}

const CATEGORY_TABS: Array<{ id: NavSection; label: string }> = [
  { id: 'barcha_oyinlar', label: 'Barcha o‘yinlar' },
  { id: 'mantiq', label: 'Mantiqiy o‘yinlar' },
  { id: 'xotira', label: 'Xotira mashqlari' },
  { id: 'matematika', label: 'Matematika' },
  { id: 'diqqat', label: 'Diqqat va tezkorlik' },
  { id: 'strategiya', label: 'Strategiya' },
];

export default function DashboardPortal({
  profile,
  onUpdateProfile,
  onLaunchGame,
  onResetProfile,
}: DashboardPortalProps) {
  const [activeNav, setActiveNav] = useState<NavSection>('bosh_sahifa');
  const [searchQuery, setSearchQuery] = useState('');

  const ageConfig = getAgeGroupConfig(profile.ageGroup);
  const ageGames = useMemo(() => getGamesByAgeGroup(profile.ageGroup), [profile.ageGroup]);
  const levelInfo = useMemo(() => getLevelFromXp(profile.xp), [profile.xp]);
  const aiRec = useMemo(() => generateAiRecommendation(profile), [profile]);
  const dailyMissions = useMemo(() => getDailyMissions(profile), [profile]);

  const completedCount = useMemo(
    () =>
      ageGames.filter((g) => (profile.gameStats[g.id]?.completions ?? 0) > 0).length,
    [ageGames, profile.gameStats]
  );

  const bestOverallScore = useMemo(() => {
    const scores = ageGames.map((g) => profile.gameStats[g.id]?.bestScore ?? 0);
    return Math.max(0, ...scores);
  }, [ageGames, profile.gameStats]);

  const recommendedGames = useMemo(
    () =>
      aiRec.recommendedGameIds
        .map((id) => ageGames.find((g) => g.id === id))
        .filter((g): g is GameDefinition => Boolean(g)),
    [aiRec.recommendedGameIds, ageGames]
  );

  const recentGames = useMemo(
    () =>
      profile.recentGameIds
        .map((id) => ageGames.find((g) => g.id === id))
        .filter((g): g is GameDefinition => Boolean(g))
        .slice(0, 4),
    [profile.recentGameIds, ageGames]
  );

  const filteredGames = useMemo(() => {
    const catFilter: GameCategory | null =
      activeNav === 'mantiq' ||
      activeNav === 'xotira' ||
      activeNav === 'matematika' ||
      activeNav === 'diqqat' ||
      activeNav === 'strategiya'
        ? activeNav
        : null;

    return ageGames.filter((g) => {
      if (catFilter && g.category !== catFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          g.title.toLowerCase().includes(q) ||
          g.shortDesc.toLowerCase().includes(q) ||
          CATEGORY_LABELS[g.category].toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [ageGames, activeNav, searchQuery]);

  const toggleFavorite = (gameId: string) => {
    audioService.playClick();
    const exists = profile.favoriteGameIds.includes(gameId);
    const nextFavs = exists
      ? profile.favoriteGameIds.filter((id) => id !== gameId)
      : [...profile.favoriteGameIds, gameId];
    onUpdateProfile({ ...profile, favoriteGameIds: nextFavs });
  };

  const handleDailyChallengeStart = () => {
    const pick = recommendedGames[0] ?? ageGames[0];
    if (pick) onLaunchGame(pick);
  };

  const isGameBrowserView =
    activeNav === 'bosh_sahifa' ||
    activeNav === 'barcha_oyinlar' ||
    activeNav === 'mantiq' ||
    activeNav === 'xotira' ||
    activeNav === 'matematika' ||
    activeNav === 'diqqat' ||
    activeNav === 'strategiya';

  return (
    <div className="min-h-screen bg-[#080D1A] text-slate-100 flex flex-col">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-[#080D1A]/95 border-b border-slate-800/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => setActiveNav('bosh_sahifa')}
            className="text-xl font-extrabold tracking-tight text-white whitespace-nowrap shrink-0 cursor-pointer"
          >
            AQL ARENA
          </button>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {[
              { id: 'bosh_sahifa' as NavSection, label: 'Bosh sahifa' },
              { id: 'barcha_oyinlar' as NavSection, label: 'Barcha o‘yinlar' },
              { id: 'natijalarim' as NavSection, label: 'Natijalarim' },
              { id: 'profil' as NavSection, label: 'Profil' },
            ].map((item) => {
              const active =
                activeNav === item.id ||
                (item.id === 'barcha_oyinlar' &&
                  ['mantiq', 'xotira', 'matematika', 'diqqat', 'strategiya'].includes(activeNav));
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    audioService.playClick();
                    setActiveNav(item.id);
                  }}
                  className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'border-amber-400 text-white font-semibold'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={handleDailyChallengeStart}
            className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Kunlik vazifa
          </button>
        </div>

        {/* Mobile Nav Strip */}
        <div className="md:hidden flex items-center gap-4 px-4 pb-2.5 overflow-x-auto text-xs font-medium border-t border-slate-800/60 pt-2">
          {[
            { id: 'bosh_sahifa' as NavSection, label: 'Bosh sahifa' },
            { id: 'barcha_oyinlar' as NavSection, label: 'Barcha o‘yinlar' },
            { id: 'natijalarim' as NavSection, label: 'Natijalarim' },
            { id: 'profil' as NavSection, label: 'Profil' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveNav(item.id)}
              className={`whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
                activeNav === item.id ? 'border-amber-400 text-white' : 'border-transparent text-slate-400'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-10">
        {activeNav === 'natijalarim' ? (
          <ResultsView profile={profile} onPlayGame={onLaunchGame} />
        ) : activeNav === 'profil' ? (
          <ProfileView
            profile={profile}
            onUpdateProfile={onUpdateProfile}
            onPlayGame={onLaunchGame}
            onResetAll={onResetProfile}
          />
        ) : (
          <>
            {/* Personalized Hero + 3D World Stage */}
            {activeNav === 'bosh_sahifa' && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  <div className="lg:col-span-7 rounded-3xl bg-[#0E1629] border border-slate-800 p-6 sm:p-8 flex flex-col justify-between gap-6">
                    <div className="space-y-3">
                      <p className="text-xs font-semibold tracking-wide text-amber-400">
                        {ageConfig.label} · {ageConfig.title}
                      </p>
                      <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight [text-wrap:balance]">
                        Salom, {profile.name}! Bugun qaysi qobiliyatni charxlaymiz?
                      </h1>
                      <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
                        {ageConfig.worldDescription}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-400 font-mono tabular-nums">
                        <span>Daraja {levelInfo.level}</span>
                        <span>
                          {levelInfo.currentLevelXp} / {levelInfo.nextLevelXp} XP
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-400 transition-all duration-300"
                          style={{ width: `${Math.max(5, levelInfo.progressPct)}%` }}
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={handleDailyChallengeStart}
                          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <Play className="w-4 h-4 fill-current" />
                          <span>Tavsiya etilgan o‘yinni boshlash</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveNav('barcha_oyinlar')}
                          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <Compass className="w-4 h-4 text-sky-400" />
                          <span>Barcha 10 ta o‘yin</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Interactive 3D World Showcase Card */}
                  <div className="lg:col-span-5 relative rounded-3xl overflow-hidden border border-slate-800 bg-[#0A1020] min-h-[260px]">
                    <img
                      src={ageConfig.imageUrl}
                      alt={ageConfig.title}
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover opacity-35"
                    />
                    <div className="relative z-10 w-full h-full min-h-[260px]">
                      <ArenaScene3D ageGroup={profile.ageGroup} className="w-full h-full min-h-[260px]" />
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between text-xs bg-[#080D1A]/90 border border-slate-800 rounded-xl px-4 py-2.5">
                      <span className="font-semibold text-white">3D Interaktiv Dunyo</span>
                      <span className="text-amber-300 font-mono tabular-nums">{profile.coins} tanga</span>
                    </div>
                  </div>
                </div>

                {/* 4-Column KPI Strip Below Hero */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-5 rounded-2xl bg-[#0E1629] border border-slate-800">
                    <p className="text-xs text-slate-400">Mavjud o‘yinlar</p>
                    <p className="text-2xl font-extrabold font-mono text-white tabular-nums mt-1">
                      {ageGames.length} ta
                    </p>
                  </div>
                  <div className="p-5 rounded-2xl bg-[#0E1629] border border-slate-800">
                    <p className="text-xs text-slate-400">Yakunlangan o‘yinlar</p>
                    <p className="text-2xl font-extrabold font-mono text-emerald-400 tabular-nums mt-1">
                      {completedCount} / {ageGames.length}
                    </p>
                  </div>
                  <div className="p-5 rounded-2xl bg-[#0E1629] border border-slate-800">
                    <p className="text-xs text-slate-400">Joriy ball (XP)</p>
                    <p className="text-2xl font-extrabold font-mono text-amber-400 tabular-nums mt-1">
                      {profile.xp} XP
                    </p>
                  </div>
                  <div className="p-5 rounded-2xl bg-[#0E1629] border border-slate-800">
                    <p className="text-xs text-slate-400">Eng yaxshi rekord</p>
                    <p className="text-2xl font-extrabold font-mono text-sky-400 tabular-nums mt-1">
                      {bestOverallScore} ball
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* AI Personalization & Daily Challenge Row */}
            {activeNav === 'bosh_sahifa' && (
              <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 p-6 rounded-2xl bg-[#0E1629] border border-slate-800 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-semibold text-sky-400">
                        <Brain className="w-4 h-4" />
                        <span>Shaxsiy intellektual tavsiya</span>
                      </div>
                      <h2 className="text-lg sm:text-xl font-bold text-white">{aiRec.headline}</h2>
                      <p className="text-sm text-slate-300 leading-relaxed">{aiRec.advice}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    {recommendedGames.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => onLaunchGame(g)}
                        className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-400 text-left transition-all cursor-pointer group"
                      >
                        <p className="text-xs text-slate-400">{CATEGORY_LABELS[g.category]}</p>
                        <p className="text-sm font-bold text-white mt-1 group-hover:text-sky-300">
                          {g.title}
                        </p>
                        <p className="text-xs text-amber-400 mt-2 font-medium">O‘ynash →</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-4 p-6 rounded-2xl bg-[#0E1629] border border-slate-800 flex flex-col justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                      <Trophy className="w-4 h-4" />
                      <span>Kunlik topshiriqlar</span>
                    </div>
                    <div className="space-y-2.5">
                      {dailyMissions.map((m) => (
                        <div key={m.id} className="flex items-center justify-between text-xs gap-2">
                          <span className={m.completed ? 'text-emerald-400 line-through' : 'text-slate-300'}>
                            {m.title}
                          </span>
                          <span className="font-mono text-slate-400 tabular-nums shrink-0">
                            {m.progress}/{m.target}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveNav('natijalarim')}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white cursor-pointer"
                  >
                    Barcha natijalarni ko‘rish
                  </button>
                </div>
              </section>
            )}

            {/* Recently Played Games */}
            {activeNav === 'bosh_sahifa' && recentGames.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-lg font-bold text-white">Oxirgi o‘ynalgan o‘yinlar</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {recentGames.map((g) => {
                    const stat = profile.gameStats[g.id];
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => onLaunchGame(g)}
                        className="p-4 rounded-2xl bg-[#0E1629] border border-slate-800 hover:border-amber-400 text-left transition-all cursor-pointer"
                      >
                        <p className="text-xs text-slate-400">
                          {CATEGORY_LABELS[g.category]} · Rekord: {stat?.bestScore ?? 0}
                        </p>
                        <p className="text-base font-bold text-white mt-1">{g.title}</p>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Workspace Toolbar: Categories + Search + Audio */}
            {isGameBrowserView && (
              <section className="space-y-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {CATEGORY_TABS.map((tab) => {
                      const active =
                        activeNav === tab.id ||
                        (activeNav === 'bosh_sahifa' && tab.id === 'barcha_oyinlar');
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => {
                            audioService.playClick();
                            setActiveNav(tab.id);
                          }}
                          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            active
                              ? 'bg-amber-400 text-slate-950 font-bold'
                              : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="O‘yin qidirish..."
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-700 focus:border-amber-400 focus:outline-none text-sm text-white placeholder:text-slate-500"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onUpdateProfile({
                          ...profile,
                          audio: {
                            ...profile.audio,
                            soundEnabled: !profile.audio.soundEnabled,
                          },
                        })
                      }
                      aria-label="Ovoz effekti"
                      className="p-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 cursor-pointer"
                    >
                      {profile.audio.soundEnabled ? (
                        <Volume2 className="w-4 h-4 text-sky-400" />
                      ) : (
                        <VolumeX className="w-4 h-4 text-slate-500" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onUpdateProfile({
                          ...profile,
                          audio: {
                            ...profile.audio,
                            musicEnabled: !profile.audio.musicEnabled,
                          },
                        })
                      }
                      aria-label="Fon musiqasi"
                      className={`p-2 rounded-lg border cursor-pointer ${
                        profile.audio.musicEnabled
                          ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-300'
                          : 'bg-slate-900 border-slate-700 text-slate-500'
                      }`}
                    >
                      <Music className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Game Catalog Grid */}
                {filteredGames.length === 0 ? (
                  <div className="py-12 text-center rounded-2xl bg-[#0E1629] border border-slate-800 space-y-2">
                    <p className="text-base font-bold text-white">Mos o‘yin topilmadi</p>
                    <p className="text-sm text-slate-400">Qidiruv so‘zini yoki bo‘limni o‘zgartirib ko‘ring.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredGames.map((game, index) => {
                      const stat = profile.gameStats[game.id];
                      const isFav = profile.favoriteGameIds.includes(game.id);
                      const isRecommended = aiRec.recommendedGameIds.includes(game.id);

                      return (
                        <article
                          key={game.id}
                          className="rounded-2xl bg-[#0E1629] border border-slate-800 hover:border-slate-600 transition-all flex flex-col justify-between overflow-hidden"
                        >
                          {/* Stylized 3D Preview Header */}
                          <div
                            className="h-28 p-5 flex items-end justify-between relative overflow-hidden"
                            style={{
                              background: `linear-gradient(135deg, ${game.accentHex}28 0%, #090F1E 85%)`,
                            }}
                          >
                            <div>
                              <p className="text-xs font-medium text-slate-300">
                                {String(index + 1).padStart(2, '0')}. {game.visualTag}
                              </p>
                              <h3 className="text-xl font-extrabold text-white mt-0.5">{game.title}</h3>
                            </div>

                            <button
                              type="button"
                              onClick={() => toggleFavorite(game.id)}
                              aria-label={isFav ? 'Sevimlilardan olib tashlash' : 'Sevimlilarga qo‘shish'}
                              className="p-2 rounded-lg bg-slate-950/60 hover:bg-slate-950 text-slate-300 cursor-pointer"
                            >
                              <Heart
                                className={`w-4 h-4 ${
                                  isFav ? 'fill-rose-500 text-rose-500' : 'text-slate-400'
                                }`}
                              />
                            </button>
                          </div>

                          <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                            <div className="space-y-2.5">
                              <div className="flex items-center gap-2 text-xs text-slate-400">
                                <span>{CATEGORY_LABELS[game.category]}</span>
                                <span aria-hidden="true">·</span>
                                <span>{game.estimatedMinutes} daqiqa</span>
                                {isRecommended && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span className="text-amber-400 font-medium inline-flex items-center gap-1">
                                      <Sparkles className="w-3 h-3" />
                                      Tavsiya
                                    </span>
                                  </>
                                )}
                              </div>

                              <p className="text-sm text-slate-300 leading-relaxed">{game.shortDesc}</p>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                              <div className="text-xs text-slate-400 font-mono tabular-nums">
                                {stat ? `Rekord: ${stat.bestScore} ball` : `+${game.xpReward} XP`}
                              </div>
                              <button
                                type="button"
                                onClick={() => onLaunchGame(game)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>O‘ynash</span>
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>

      <footer className="border-t border-slate-800/80 py-6 px-4 sm:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AQL ARENA · O‘zbek tilidagi 3D ta’limiy va intellektual o‘yinlar platformasi</span>
          <span>4 yosh toifasi · 40 ta original o‘yin</span>
        </div>
      </footer>
    </div>
  );
}
