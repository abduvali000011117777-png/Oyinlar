import { useState } from 'react';
import {
  Award,
  HelpCircle,
  Home,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { CATEGORY_LABELS } from '../data/gamesCatalog';
import { GAME_COMPONENTS } from '../games/GameRegistry';
import { audioService } from '../services/audioService';
import ArenaScene3D from '../three/ArenaScene3D';
import {
  CompletedResultSummary,
  DifficultyLevel,
  GameDefinition,
  GameSessionResult,
} from '../types/platform';

interface GamePlayModalProps {
  game: GameDefinition;
  initialDifficulty: DifficultyLevel;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onGameFinished: (session: GameSessionResult) => CompletedResultSummary;
  onNextGame: () => void;
  onClose: () => void;
}

export default function GamePlayModal({
  game,
  initialDifficulty,
  soundEnabled,
  onToggleSound,
  onGameFinished,
  onNextGame,
  onClose,
}: GamePlayModalProps) {
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(initialDifficulty);
  const [isPaused, setIsPaused] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);
  const [pulseSignal, setPulseSignal] = useState(0);
  const [summary, setSummary] = useState<CompletedResultSummary | null>(null);

  const GameComponent = GAME_COMPONENTS[game.id];

  const handleRestart = () => {
    audioService.playClick();
    setSummary(null);
    setIsPaused(false);
    setShowHint(false);
    setSessionKey((k) => k + 1);
  };

  const handleComplete = (session: GameSessionResult) => {
    audioService.playVictory();
    setPulseSignal((s) => s + 1);
    const resultSummary = onGameFinished(session);
    setSummary(resultSummary);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#060A14]/95 flex flex-col overflow-y-auto">
      {/* Subtle 3D reactive background */}
      <div className="fixed inset-0 z-0 opacity-25 pointer-events-none">
        <ArenaScene3D ageGroup={game.ageGroup} pulseSignal={pulseSignal} className="w-full h-full" />
      </div>

      {/* Top Game HUD Bar */}
      <header className="relative z-10 flex flex-wrap items-center justify-between gap-4 px-4 sm:px-8 py-4 border-b border-slate-800 bg-[#0B1221]/95">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>{CATEGORY_LABELS[game.category]}</span>
            <span aria-hidden="true">·</span>
            <span>{game.ageGroup} yosh</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white truncate">{game.title}</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!summary && (
            <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-900 border border-slate-800">
              {(['oson', 'orta', 'qiyin'] as DifficultyLevel[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    audioService.playClick();
                    setDifficulty(d);
                    setSessionKey((k) => k + 1);
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    difficulty === d
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {d === 'oson' ? 'Oson' : d === 'orta' ? 'O‘rta' : 'Qiyin'}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              audioService.playClick();
              setShowHint((h) => !h);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 cursor-pointer whitespace-nowrap shrink-0"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>Maslahat</span>
          </button>

          {!summary && (
            <button
              type="button"
              onClick={() => {
                audioService.playClick();
                setIsPaused((p) => !p);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 cursor-pointer whitespace-nowrap shrink-0"
            >
              {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
              <span>{isPaused ? 'Davom etish' : 'Pauza'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleRestart}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 cursor-pointer whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Qayta</span>
          </button>

          <button
            type="button"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Ovozni o‘chirish' : 'Ovozni yoqish'}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-sky-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          <button
            type="button"
            onClick={() => {
              audioService.playClick();
              onClose();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-xs font-semibold text-rose-200 cursor-pointer whitespace-nowrap shrink-0"
          >
            <X className="w-4 h-4" />
            <span>Chiqish</span>
          </button>
        </div>
      </header>

      {/* Main Play Stage */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-6">
        {showHint && !summary && (
          <div className="mb-4 max-w-xl w-full p-4 rounded-xl bg-[#0F172A] border border-amber-400/40 text-sm text-amber-200">
            <span className="font-bold text-amber-400">Yo‘riqnoma: </span>
            {game.instructions}
          </div>
        )}

        <div className="w-full max-w-3xl rounded-3xl bg-[#0C1426]/95 border border-slate-800 p-5 sm:p-8 shadow-2xl relative">
          {isPaused && !summary && (
            <div className="absolute inset-0 z-20 rounded-3xl bg-[#080D1A]/95 flex flex-col items-center justify-center gap-4 p-6 text-center">
              <h3 className="text-2xl font-bold text-white">O‘yin to‘xtatildi</h3>
              <p className="text-sm text-slate-400">Tayyor bo‘lganingizda davom ettirishingiz mumkin.</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsPaused(false)}
                  className="px-6 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-sm cursor-pointer"
                >
                  Davom etish
                </button>
                <button
                  type="button"
                  onClick={handleRestart}
                  className="px-6 py-2.5 rounded-xl bg-slate-800 text-white font-semibold text-sm cursor-pointer"
                >
                  Qayta boshlash
                </button>
              </div>
            </div>
          )}

          {summary ? (
            <div className="flex flex-col items-center text-center gap-6 py-4">
              <div className="space-y-2">
                {summary.isNewRecord && (
                  <p className="text-sm font-bold text-amber-400">Yangi shaxsiy rekord!</p>
                )}
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Ajoyib! Siz muvaffaqiyatli yakunladingiz!
                </h3>
                <p className="text-sm text-slate-400">
                  +{summary.xpEarned} XP va +{summary.coinsEarned} tanga hisobingizga qo‘shildi
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 w-full">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <p className="text-xs text-slate-400">To‘plangan ball</p>
                  <p className="text-2xl font-extrabold font-mono text-amber-400 tabular-nums mt-1">
                    {summary.score}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <p className="text-xs text-slate-400">To‘g‘ri javoblar</p>
                  <p className="text-2xl font-extrabold font-mono text-emerald-400 tabular-nums mt-1">
                    {summary.correctCount}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <p className="text-xs text-slate-400">Xato javoblar</p>
                  <p className="text-2xl font-extrabold font-mono text-rose-400 tabular-nums mt-1">
                    {summary.incorrectCount}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <p className="text-xs text-slate-400">Sarflangan vaqt</p>
                  <p className="text-2xl font-extrabold font-mono text-sky-400 tabular-nums mt-1">
                    {summary.durationSeconds}s
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 col-span-2 sm:col-span-1">
                  <p className="text-xs text-slate-400">Aniqlik</p>
                  <p className="text-2xl font-extrabold font-mono text-white tabular-nums mt-1">
                    {summary.accuracy}%
                  </p>
                </div>
              </div>

              {summary.newlyUnlockedAchievements.length > 0 && (
                <div className="w-full p-4 rounded-2xl bg-amber-500/10 border border-amber-400/40 text-left space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                    <Award className="w-4 h-4" />
                    <span>Yangi yutuq ochildi!</span>
                  </div>
                  {summary.newlyUnlockedAchievements.map((ach) => (
                    <p key={ach.id} className="text-xs text-slate-200">
                      {ach.title} — {ach.description}
                    </p>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleRestart}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-500 text-sm font-bold text-white cursor-pointer whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Qayta o‘ynash</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    audioService.playClick();
                    onNextGame();
                  }}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-sm font-bold text-slate-950 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <SkipForward className="w-4 h-4" />
                  <span>Keyingi o‘yin</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    audioService.playClick();
                    onClose();
                  }}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-slate-200 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Home className="w-4 h-4" />
                  <span>Bosh sahifaga qaytish</span>
                </button>
              </div>
            </div>
          ) : GameComponent ? (
            <GameComponent
              key={`${game.id}-${sessionKey}-${difficulty}`}
              game={game}
              difficulty={difficulty}
              isPaused={isPaused}
              onPauseToggle={() => setIsPaused((p) => !p)}
              onScorePulse={(pos) => {
                if (pos) setPulseSignal((s) => s + 1);
              }}
              onComplete={handleComplete}
              onSpeak={(txt) => audioService.speakUzbek(txt)}
            />
          ) : (
            <p className="text-center text-slate-400">O‘yin yuklanmoqda...</p>
          )}
        </div>
      </main>
    </div>
  );
}
