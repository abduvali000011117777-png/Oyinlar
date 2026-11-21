import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Play, RotateCcw, Sparkles } from 'lucide-react';
import { audioService } from '../services/audioService';
import { GameEngineProps } from '../types/platform';

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ======================================================
// 11. MATEMATIK SARGUZASHT
// ======================================================
export function MathAdventureGame({ game, difficulty, onComplete, onScorePulse, isPaused }: GameEngineProps) {
  const totalBridges = 6;
  const [step, setStep] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [startTime] = useState(() => Date.now());

  const problem = useMemo(() => {
    const mult = difficulty === 'qiyin' ? 2 : 1;
    const ops = ['+', '-', '×', '÷'];
    const op = ops[step % ops.length];
    let a = 6 + step * 2 * mult;
    let b = 3 + (step % 4);
    let ans = a + b;
    if (op === '-') {
      a = 12 + step * 3 * mult;
      b = 4 + step;
      ans = a - b;
    } else if (op === '×') {
      a = 2 + (step % 5) + mult;
      b = 3 + (step % 4);
      ans = a * b;
    } else if (op === '÷') {
      b = 2 + (step % 4);
      ans = 3 + step;
      a = b * ans;
    }
    const choices = new Set<number>([ans]);
    while (choices.size < 4) {
      choices.add(Math.max(1, ans + Math.floor(Math.random() * 9) - 4));
    }
    return { text: `${a} ${op} ${b} = ?`, ans, options: shuffle(Array.from(choices)) };
  }, [step, difficulty]);

  const handleAnswer = (val: number) => {
    if (isPaused) return;
    if (val === problem.ans) {
      audioService.playCorrect();
      onScorePulse?.(true);
      const nextCorrect = correct + 1;
      setCorrect(nextCorrect);
      setTimeout(() => {
        if (step + 1 >= totalBridges) {
          const duration = Math.max(5, Math.round((Date.now() - startTime) / 1000));
          onComplete({
            gameId: game.id,
            score: nextCorrect * 35 - wrong * 8,
            correctCount: nextCorrect,
            incorrectCount: wrong,
            durationSeconds: duration,
            accuracy: Math.round((nextCorrect / (nextCorrect + wrong)) * 100),
            levelReached: totalBridges,
          });
        } else {
          setStep((s) => s + 1);
        }
      }, 350);
    } else {
      audioService.playWrong();
      onScorePulse?.(false);
      setWrong((w) => w + 1);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="w-full max-w-lg">
        <div className="flex justify-between text-xs text-slate-400 mb-2">
          <span>Kristall ko‘prik qurilishi</span>
          <span className="tabular-nums">{step} / {totalBridges} bo‘lak</span>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: totalBridges }).map((_, i) => (
            <div
              key={i}
              className={`h-3 rounded-full transition-colors ${
                i < step ? 'bg-cyan-400' : i === step ? 'bg-amber-400' : 'bg-slate-800'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="px-10 py-8 rounded-3xl bg-slate-900 border border-cyan-500/30 text-center">
        <p className="text-xs text-cyan-300 mb-2">Ko‘prik {step + 1}-bo‘lagi uchun misol:</p>
        <p className="text-4xl font-extrabold font-mono text-white tabular-nums">{problem.text}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-lg">
        {problem.options.map((opt) => (
          <button
            key={opt}
            onClick={() => handleAnswer(opt)}
            className="py-4 rounded-2xl bg-slate-800 border border-slate-700 hover:border-cyan-400 text-2xl font-bold text-white tabular-nums cursor-pointer transition-all"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ======================================================
// 12. MANTIQIY LABIRINT
// ======================================================
const MAZE_MAPS = [
  [
    [0, 1, 0, 0, 0, 2],
    [0, 1, 0, 1, 1, 0],
    [0, 0, 0, 1, 0, 0],
    [1, 1, 0, 0, 0, 1],
    [0, 0, 0, 1, 0, 0],
    [0, 1, 0, 0, 0, 3],
  ],
  [
    [0, 0, 1, 0, 0, 2],
    [1, 0, 1, 0, 1, 0],
    [0, 0, 0, 0, 1, 0],
    [0, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0],
    [1, 1, 0, 1, 0, 3],
  ],
]; // 0=open, 1=wall, 2=key, 3=portal

export function LogicMazeGame({ game, onComplete, onScorePulse, isPaused }: GameEngineProps) {
  const [level, setLevel] = useState(0);
  const grid = MAZE_MAPS[level];
  const [pos, setPos] = useState({ r: 0, c: 0 });
  const [hasKey, setHasKey] = useState(false);
  const [moves, setMoves] = useState(0);
  const [wrongMoves, setWrongMoves] = useState(0);
  const [startTime] = useState(() => Date.now());

  const move = (dr: number, dc: number) => {
    if (isPaused) return;
    const nr = pos.r + dr;
    const nc = pos.c + dc;
    if (nr < 0 || nr >= 6 || nc < 0 || nc >= 6 || grid[nr][nc] === 1) {
      audioService.playWrong();
      setWrongMoves((w) => w + 1);
      return;
    }
    audioService.playClick();
    setPos({ r: nr, c: nc });
    setMoves((m) => m + 1);

    let keyNow = hasKey;
    if (grid[nr][nc] === 2 && !hasKey) {
      keyNow = true;
      setHasKey(true);
      audioService.playCorrect();
      onScorePulse?.(true);
    }

    if (grid[nr][nc] === 3 && keyNow) {
      audioService.playCorrect();
      onScorePulse?.(true);
      setTimeout(() => {
        if (level + 1 >= MAZE_MAPS.length) {
          const duration = Math.max(5, Math.round((Date.now() - startTime) / 1000));
          onComplete({
            gameId: game.id,
            score: Math.max(90, 240 - moves * 2 - wrongMoves * 8),
            correctCount: level + 1,
            incorrectCount: wrongMoves,
            durationSeconds: duration,
            accuracy: Math.max(50, Math.round((moves / Math.max(1, moves + wrongMoves)) * 100)),
            levelReached: MAZE_MAPS.length,
          });
        } else {
          setLevel((l) => l + 1);
          setPos({ r: 0, c: 0 });
          setHasKey(false);
        }
      }, 450);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') { e.preventDefault(); move(-1, 0); }
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1, 0); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); move(0, -1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); move(0, 1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="flex flex-col items-center gap-5 py-2">
      <div className="text-center">
        <p className="text-sm text-slate-400">
          Labirint {level + 1} / {MAZE_MAPS.length} · Kalit: {hasKey ? 'Olingan 🔑' : 'Topilmadi'}
        </p>
        <h3 className="text-xl font-bold text-white mt-1">
          Avval 🔑 kalitni oling, so‘ng 🌀 portalga yeting!
        </h3>
      </div>

      <div className="grid grid-cols-6 gap-1.5 p-3 rounded-2xl bg-slate-900 border border-slate-700">
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const isBot = pos.r === r && pos.c === c;
            return (
              <div
                key={`${r}-${c}`}
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl ${
                  cell === 1
                    ? 'bg-slate-700 border border-slate-600'
                    : isBot
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-slate-800/80'
                }`}
              >
                {isBot
                  ? '🤖'
                  : cell === 2 && !hasKey
                    ? '🔑'
                    : cell === 3
                      ? hasKey
                        ? '🌀'
                        : '🔒'
                      : ''}
              </div>
            );
          })
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 w-40">
        <div />
        <button onClick={() => move(-1, 0)} className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 flex justify-center cursor-pointer"><ArrowUp className="w-5 h-5" /></button>
        <div />
        <button onClick={() => move(0, -1)} className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 flex justify-center cursor-pointer"><ArrowLeft className="w-5 h-5" /></button>
        <button onClick={() => move(1, 0)} className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 flex justify-center cursor-pointer"><ArrowDown className="w-5 h-5" /></button>
        <button onClick={() => move(0, 1)} className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 flex justify-center cursor-pointer"><ArrowRight className="w-5 h-5" /></button>
      </div>
    </div>
  );
}

// ======================================================
// 13. XOTIRA CHEMPIONI (SIMON CRYSTALS)
// ======================================================
const CRYSTALS = [
  { id: 0, label: 'Zumrad', color: '#10B981' },
  { id: 1, label: 'Sapfir', color: '#38BDF8' },
  { id: 2, label: 'Yoqut', color: '#F43F5E' },
  { id: 3, label: 'Qahrabo', color: '#F59E0B' },
];

export function SimonChampionGame({ game, onComplete, onScorePulse, isPaused }: GameEngineProps) {
  const [round, setRound] = useState(1);
  const maxRounds = 4;
  const [sequence, setSequence] = useState<number[]>([0, 2, 1]);
  const [activeCrystal, setActiveCrystal] = useState<number | null>(null);
  const [isShowing, setIsShowing] = useState(true);
  const [userIdx, setUserIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [startTime] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    setIsShowing(true);
    setUserIdx(0);

    const runShow = async () => {
      await new Promise((r) => setTimeout(r, 450));
      for (let i = 0; i < sequence.length; i++) {
        if (cancelled) return;
        const cId = sequence[i];
        setActiveCrystal(cId);
        audioService.playCrystal(cId);
        await new Promise((r) => setTimeout(r, 460));
        if (cancelled) return;
        setActiveCrystal(null);
        await new Promise((r) => setTimeout(r, 180));
      }
      if (!cancelled) setIsShowing(false);
    };
    void runShow();
    return () => {
      cancelled = true;
    };
  }, [sequence]);

  const handleTap = (id: number) => {
    if (isPaused || isShowing) return;
    setActiveCrystal(id);
    audioService.playCrystal(id);
    setTimeout(() => setActiveCrystal(null), 220);

    if (id === sequence[userIdx]) {
      if (userIdx + 1 >= sequence.length) {
        audioService.playCorrect();
        onScorePulse?.(true);
        const nextCorrect = correct + 1;
        setCorrect(nextCorrect);
        if (round >= maxRounds) {
          setTimeout(() => {
            const duration = Math.max(5, Math.round((Date.now() - startTime) / 1000));
            onComplete({
              gameId: game.id,
              score: nextCorrect * 50 - wrong * 10,
              correctCount: nextCorrect,
              incorrectCount: wrong,
              durationSeconds: duration,
              accuracy: Math.round((nextCorrect / (nextCorrect + wrong)) * 100),
              levelReached: maxRounds,
            });
          }, 500);
        } else {
          setTimeout(() => {
            setRound((r) => r + 1);
            setSequence((prev) => [...prev, Math.floor(Math.random() * 4)]);
          }, 500);
        }
      } else {
        setUserIdx((u) => u + 1);
      }
    } else {
      audioService.playWrong();
      onScorePulse?.(false);
      setWrong((w) => w + 1);
      setUserIdx(0);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="text-center">
        <p className="text-sm text-slate-400">Bosqich {round} / {maxRounds} · Uzunlik: {sequence.length}</p>
        <h3 className="text-2xl font-bold text-white mt-1">
          {isShowing ? 'Diqqat bilan kuzating...' : 'Endi kristallarni xuddi shu tartibda bosing!'}
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        {CRYSTALS.map((c) => {
          const lit = activeCrystal === c.id;
          return (
            <button
              key={c.id}
              onClick={() => handleTap(c.id)}
              disabled={isShowing}
              className="h-32 rounded-3xl border-2 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer"
              style={{
                backgroundColor: lit ? c.color : 'rgba(30, 41, 59, 0.85)',
                borderColor: c.color,
                transform: lit ? 'scale(1.04)' : 'scale(1)',
                color: lit ? '#0f172a' : '#f8fafc',
              }}
            >
              <span className="text-lg font-bold">{c.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ======================================================
// 14. SO'Z USTASI
// ======================================================
const UZBEK_WORDS = [
  { word: 'KITOB', clue: 'Bilim manbai, varaqlaridan hikoyalar o‘qiladi.' },
  { word: 'QUYOSH', clue: 'Kunduzi osmonni yoritib, issiqlik beruvchi yulduz.' },
  { word: 'MAKTAB', clue: 'Bolalar bilim olish uchun boradigan maskan.' },
  { word: 'DARYO', clue: 'Tog‘lardan boshlanib, vodiylar bo‘ylab oqadigan katta suv.' },
  { word: 'BAHOR', clue: 'Gullar ochilib, tabiat uyg‘onadigan go‘zal fasl.' },
];

export function WordMasterGame({ game, onComplete, onScorePulse, isPaused }: GameEngineProps) {
  const [idx, setIdx] = useState(0);
  const item = UZBEK_WORDS[idx];
  const [bank, setBank] = useState<Array<{ id: number; ch: string; used: boolean }>>(() =>
    shuffle(item.word.split('')).map((ch, i) => ({ id: i, ch, used: false }))
  );
  const [built, setBuilt] = useState<Array<{ id: number; ch: string }>>([]);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [startTime] = useState(() => Date.now());

  const resetWord = (nextIdx: number) => {
    const nextItem = UZBEK_WORDS[nextIdx];
    setBank(shuffle(nextItem.word.split('')).map((ch, i) => ({ id: i, ch, used: false })));
    setBuilt([]);
  };

  const handleLetter = (tile: { id: number; ch: string; used: boolean }) => {
    if (isPaused || tile.used) return;
    audioService.playClick();
    const nextBuilt = [...built, { id: tile.id, ch: tile.ch }];
    setBuilt(nextBuilt);
    setBank((prev) => prev.map((t) => (t.id === tile.id ? { ...t, used: true } : t)));

    if (nextBuilt.length === item.word.length) {
      const formed = nextBuilt.map((b) => b.ch).join('');
      if (formed === item.word) {
        audioService.playCorrect();
        onScorePulse?.(true);
        const nextCorrect = correct + 1;
        setCorrect(nextCorrect);
        setTimeout(() => {
          if (idx + 1 >= UZBEK_WORDS.length) {
            const duration = Math.max(5, Math.round((Date.now() - startTime) / 1000));
            onComplete({
              gameId: game.id,
              score: nextCorrect * 45 - wrong * 5,
              correctCount: nextCorrect,
              incorrectCount: wrong,
              durationSeconds: duration,
              accuracy: Math.round((nextCorrect / (nextCorrect + wrong)) * 100),
              levelReached: UZBEK_WORDS.length,
            });
          } else {
            const nextIdx = idx + 1;
            setIdx(nextIdx);
            resetWord(nextIdx);
          }
        }, 600);
      } else {
        audioService.playWrong();
        onScorePulse?.(false);
        setWrong((w) => w + 1);
        setTimeout(() => resetWord(idx), 550);
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="text-center max-w-md">
        <p className="text-sm text-slate-400">So‘z {idx + 1} / {UZBEK_WORDS.length}</p>
        <h3 className="text-xl font-bold text-white mt-2">{item.clue}</h3>
      </div>

      <div className="flex items-center gap-2 min-h-[64px]">
        {Array.from({ length: item.word.length }).map((_, i) => (
          <div
            key={i}
            className="w-12 h-14 rounded-xl bg-slate-900 border-2 border-emerald-500/40 flex items-center justify-center text-2xl font-extrabold text-emerald-300"
          >
            {built[i]?.ch ?? ''}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {bank.map((tile) => (
          <button
            key={tile.id}
            onClick={() => handleLetter(tile)}
            disabled={tile.used}
            className={`w-14 h-14 rounded-2xl text-2xl font-bold border transition-all cursor-pointer ${
              tile.used
                ? 'bg-slate-900 border-slate-800 text-slate-600'
                : 'bg-slate-800 border-slate-600 text-white hover:border-emerald-400'
            }`}
          >
            {tile.ch}
          </button>
        ))}
      </div>

      <button
        onClick={() => resetWord(idx)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm hover:text-white cursor-pointer"
      >
        <RotateCcw className="w-4 h-4" />
        <span>Tozalash</span>
      </button>
    </div>
  );
}

// ======================================================
// 15. TEZKOR HISOBCHI (TIMED SPRINT)
// ======================================================
export function SpeedMathGame({ game, onComplete, onScorePulse, isPaused }: GameEngineProps) {
  const [timeLeft, setTimeLeft] = useState(30);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [combo, setCombo] = useState(0);
  const [seed, setSeed] = useState(0);
  const completedRef = useRef(false);

  const challenge = useMemo(() => {
    const a = 5 + ((seed * 7) % 18);
    const b = 4 + ((seed * 5) % 16);
    const left = a + b;
    const right = 8 + ((seed * 11) % 24);
    const ans = left > right ? '>' : left < right ? '<' : '=';
    return { leftExpr: `${a} + ${b}`, rightExpr: `${right}`, ans };
  }, [seed]);

  useEffect(() => {
    if (isPaused || completedRef.current) return;
    if (timeLeft <= 0) {
      completedRef.current = true;
      onComplete({
        gameId: game.id,
        score: Math.max(20, correct * 25 - wrong * 5),
        correctCount: correct,
        incorrectCount: wrong,
        durationSeconds: 30,
        accuracy: correct + wrong > 0 ? Math.round((correct / (correct + wrong)) * 100) : 100,
        levelReached: Math.max(1, Math.floor(correct / 3) + 1),
      });
      return;
    }
    const t = window.setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [timeLeft, isPaused, correct, wrong, game.id, onComplete]);

  const handlePick = (sym: string) => {
    if (isPaused || completedRef.current) return;
    if (sym === challenge.ans) {
      audioService.playCorrect();
      onScorePulse?.(true);
      setCorrect((c) => c + 1);
      setCombo((k) => k + 1);
    } else {
      audioService.playWrong();
      onScorePulse?.(false);
      setWrong((w) => w + 1);
      setCombo(0);
    }
    setSeed((s) => s + 1);
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="flex items-center gap-6 text-sm font-mono tabular-nums">
        <span className="text-rose-400 font-bold">Vaqt: {timeLeft}s</span>
        <span className="text-emerald-400">To‘g‘ri: {correct}</span>
        <span className="text-amber-300">Kombo: {combo}x</span>
      </div>

      <div className="flex items-center gap-5 px-8 py-7 rounded-3xl bg-slate-900 border border-slate-700">
        <span className="text-3xl sm:text-4xl font-extrabold font-mono text-white tabular-nums">
          {challenge.leftExpr}
        </span>
        <span className="w-12 h-12 rounded-xl bg-slate-800 border border-amber-400/50 flex items-center justify-center text-2xl font-bold text-amber-300">
          ?
        </span>
        <span className="text-3xl sm:text-4xl font-extrabold font-mono text-white tabular-nums">
          {challenge.rightExpr}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
        {['<', '=', '>'].map((sym) => (
          <button
            key={sym}
            onClick={() => handlePick(sym)}
            className="py-5 rounded-2xl bg-slate-800 border border-slate-600 hover:border-amber-400 text-3xl font-extrabold text-white cursor-pointer transition-all"
          >
            {sym}
          </button>
        ))}
      </div>
    </div>
  );
}

// ======================================================
// 16. FARQNI TOP (INTERACTIVE DUAL SVG SCENE)
// ======================================================
export function SpotDifferenceGame({ game, onComplete, onScorePulse, isPaused }: GameEngineProps) {
  const spots = [
    { id: 'sun', x: 240, y: 46, label: 'Quyosh' },
    { id: 'flag', x: 145, y: 82, label: 'Bayroq rangi' },
    { id: 'window', x: 145, y: 142, label: 'Deraza' },
    { id: 'flower', x: 64, y: 175, label: 'Gul' },
  ];
  const [found, setFound] = useState<string[]>([]);
  const [wrong, setWrong] = useState(0);
  const [startTime] = useState(() => Date.now());

  const handleClickSpot = (id: string) => {
    if (isPaused || found.includes(id)) return;
    audioService.playCorrect();
    onScorePulse?.(true);
    const next = [...found, id];
    setFound(next);
    if (next.length >= spots.length) {
      setTimeout(() => {
        const duration = Math.max(5, Math.round((Date.now() - startTime) / 1000));
        onComplete({
          gameId: game.id,
          score: next.length * 45 - wrong * 5,
          correctCount: next.length,
          incorrectCount: wrong,
          durationSeconds: duration,
          accuracy: Math.round((next.length / (next.length + wrong)) * 100),
          levelReached: 1,
        });
      }, 600);
    }
  };

  return (
    <div className="flex flex-col items-center gap-5 py-2">
      <div className="text-center">
        <p className="text-sm text-slate-400">Topilgan farqlar: {found.length} / {spots.length}</p>
        <h3 className="text-xl font-bold text-white mt-1">
          O‘ng rasmda chapdagidan farq qiluvchi 4 ta joyni bosing!
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
        {/* Left Reference */}
        <div className="rounded-2xl bg-slate-900 border border-slate-700 p-3">
          <p className="text-xs text-slate-400 mb-2">Asl rasm</p>
          <svg viewBox="0 0 300 210" className="w-full rounded-xl bg-sky-950">
            <rect x="0" y="155" width="300" height="55" fill="#15803D" />
            <circle cx="240" cy="46" r="22" fill="#FACC15" />
            <rect x="100" y="105" width="90" height="60" fill="#EA580C" rx="4" />
            <polygon points="90,105 145,62 200,105" fill="#DC2626" />
            <line x1="145" y1="62" x2="145" y2="38" stroke="#E2E8F0" strokeWidth="3" />
            <polygon points="145,38 172,46 145,54" fill="#38BDF8" />
            <circle cx="145" cy="135" r="13" fill="#BAE6FD" />
            <circle cx="64" cy="175" r="10" fill="#FB7185" />
          </svg>
        </div>

        {/* Right Interactive */}
        <div className="rounded-2xl bg-slate-900 border border-sky-500/40 p-3">
          <p className="text-xs text-sky-300 mb-2">Farqlarni shu yerdan toping</p>
          <svg
            viewBox="0 0 300 210"
            className="w-full rounded-xl bg-sky-950 cursor-pointer"
            onClick={(e) => {
              const target = e.target as SVGElement;
              if (!target.dataset.spot) {
                audioService.playWrong();
                setWrong((w) => w + 1);
              }
            }}
          >
            <rect x="0" y="155" width="300" height="55" fill="#15803D" />
            {/* Diff 1: Moon/Blue Sun instead of yellow sun */}
            <circle
              data-spot="sun"
              onClick={(e) => { e.stopPropagation(); handleClickSpot('sun'); }}
              cx="240"
              cy="46"
              r="22"
              fill="#38BDF8"
            />
            <rect x="100" y="105" width="90" height="60" fill="#EA580C" rx="4" />
            <polygon points="90,105 145,62 200,105" fill="#DC2626" />
            <line x1="145" y1="62" x2="145" y2="38" stroke="#E2E8F0" strokeWidth="3" />
            {/* Diff 2: Yellow Flag */}
            <polygon
              data-spot="flag"
              onClick={(e) => { e.stopPropagation(); handleClickSpot('flag'); }}
              points="145,38 172,46 145,54"
              fill="#FACC15"
            />
            {/* Diff 3: Square Window */}
            <rect
              data-spot="window"
              onClick={(e) => { e.stopPropagation(); handleClickSpot('window'); }}
              x="132"
              y="122"
              width="26"
              height="26"
              fill="#BAE6FD"
            />
            {/* Diff 4: Purple Flower */}
            <circle
              data-spot="flower"
              onClick={(e) => { e.stopPropagation(); handleClickSpot('flower'); }}
              cx="64"
              cy="175"
              r="14"
              fill="#A855F7"
            />

            {spots.map(
              (s) =>
                found.includes(s.id) && (
                  <circle
                    key={s.id}
                    cx={s.x}
                    cy={s.y - 10}
                    r="24"
                    fill="none"
                    stroke="#34D399"
                    strokeWidth="3"
                  />
                )
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}

// ======================================================
// 17. SHAKLLAR KONSTRUKTOR (TANGRAM BUILDER)
// ======================================================
export function ShapeConstructorGame({ game, onComplete, onScorePulse, isPaused }: GameEngineProps) {
  const slots = [
    { id: 'nose', label: 'Uchburchak tumshuq', shape: 'triangle', color: '#F43F5E' },
    { id: 'body', label: 'Kvadrat korpus', shape: 'square', color: '#38BDF8' },
    { id: 'window', label: 'Doira illuminator', shape: 'circle', color: '#FACC15' },
    { id: 'engine', label: 'Trapetsiya dvigatel', shape: 'trapezoid', color: '#10B981' },
  ];
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [placed, setPlaced] = useState<string[]>([]);
  const [wrong, setWrong] = useState(0);
  const [startTime] = useState(() => Date.now());

  const pieces = useMemo(() => shuffle(slots), []);

  const handleSlotClick = (slotId: string) => {
    if (isPaused || !selectedPiece || placed.includes(slotId)) return;
    if (selectedPiece === slotId) {
      audioService.playCorrect();
      onScorePulse?.(true);
      const nextPlaced = [...placed, slotId];
      setPlaced(nextPlaced);
      setSelectedPiece(null);
      if (nextPlaced.length >= slots.length) {
        setTimeout(() => {
          const duration = Math.max(5, Math.round((Date.now() - startTime) / 1000));
          onComplete({
            gameId: game.id,
            score: Math.max(80, 180 - wrong * 10),
            correctCount: slots.length,
            incorrectCount: wrong,
            durationSeconds: duration,
            accuracy: Math.round((slots.length / (slots.length + wrong)) * 100),
            levelReached: 1,
          });
        }, 550);
      }
    } else {
      audioService.playWrong();
      onScorePulse?.(false);
      setWrong((w) => w + 1);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white">Kosmik raketani qismlardan yig‘ing!</h3>
        <p className="text-sm text-slate-400 mt-1">Avval pastdagi bo‘lakni tanlang, so‘ng chizmadagi mos joyga bosing.</p>
      </div>

      <div className="flex flex-col items-center gap-2 p-6 rounded-3xl bg-slate-900 border border-slate-700 w-64">
        {slots.map((slot) => {
          const isDone = placed.includes(slot.id);
          return (
            <button
              key={slot.id}
              onClick={() => handleSlotClick(slot.id)}
              className={`w-full py-3 px-4 rounded-xl border-2 border-dashed text-sm font-semibold transition-all cursor-pointer ${
                isDone
                  ? 'border-solid text-slate-950 font-bold'
                  : 'border-slate-600 text-slate-400 hover:border-amber-400'
              }`}
              style={isDone ? { backgroundColor: slot.color, borderColor: slot.color } : undefined}
            >
              {isDone ? `✓ ${slot.label}` : slot.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-xl">
        {pieces.map((p) => {
          const isPlaced = placed.includes(p.id);
          const isSel = selectedPiece === p.id;
          return (
            <button
              key={p.id}
              disabled={isPlaced}
              onClick={() => {
                audioService.playClick();
                setSelectedPiece(p.id);
              }}
              className={`p-4 rounded-2xl border-2 text-sm font-bold transition-all cursor-pointer ${
                isPlaced
                  ? 'opacity-30 bg-slate-900 border-slate-800'
                  : isSel
                    ? 'border-amber-400 bg-slate-700 scale-105'
                    : 'border-slate-700 bg-slate-800 hover:border-slate-500'
              }`}
            >
              <div className="w-6 h-6 rounded-md mx-auto mb-2" style={{ backgroundColor: p.color }} />
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ======================================================
// 18. KODLASH SARGUZASHTI (ROBOT BLOCK PROGRAMMING)
// ======================================================
type Cmd = 'F' | 'L' | 'R'; // Forward, Turn Left, Turn Right
const DIRS = [
  { dr: -1, dc: 0, arrow: '⬆️' },
  { dr: 0, dc: 1, arrow: '➡️' },
  { dr: 1, dc: 0, arrow: '⬇️' },
  { dr: 0, dc: -1, arrow: '⬅️' },
];

export function CodingAdventureGame({ game, onComplete, onScorePulse, isPaused }: GameEngineProps) {
  const [queue, setQueue] = useState<Cmd[]>([]);
  const [bot, setBot] = useState({ r: 3, c: 0, dir: 1 });
  const [running, setRunning] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [status, setStatus] = useState('Robotni 💎 xazinaga olib boruvchi dasturni tuzing.');
  const [startTime] = useState(() => Date.now());

  const walls = new Set(['1-1', '2-1', '2-3', '0-3']);
  const goal = { r: 1, c: 3 };

  const runProgram = async () => {
    if (isPaused || running || queue.length === 0) return;
    setRunning(true);
    setAttempts((a) => a + 1);
    let cur = { r: 3, c: 0, dir: 1 };
    setBot(cur);

    for (const cmd of queue) {
      await new Promise((res) => setTimeout(res, 380));
      if (cmd === 'L') {
        cur = { ...cur, dir: (cur.dir + 3) % 4 };
      } else if (cmd === 'R') {
        cur = { ...cur, dir: (cur.dir + 1) % 4 };
      } else {
        const d = DIRS[cur.dir];
        const nr = cur.r + d.dr;
        const nc = cur.c + d.dc;
        if (nr < 0 || nr >= 4 || nc < 0 || nc >= 4 || walls.has(`${nr}-${nc}`)) {
          audioService.playWrong();
          onScorePulse?.(false);
          setStatus('To‘siqqa urildi! Kodni tahrirlab qayta urinib ko‘ring.');
          setRunning(false);
          return;
        }
        cur = { ...cur, r: nr, c: nc };
      }
      audioService.playClick();
      setBot(cur);
    }

    if (cur.r === goal.r && cur.c === goal.c) {
      audioService.playCorrect();
      onScorePulse?.(true);
      setStatus('Ajoyib algoritm! Robot xazinaga yetib keldi!');
      setTimeout(() => {
        const duration = Math.max(5, Math.round((Date.now() - startTime) / 1000));
        onComplete({
          gameId: game.id,
          score: Math.max(100, 220 - attempts * 20),
          correctCount: 1,
          incorrectCount: Math.max(0, attempts),
          durationSeconds: duration,
          accuracy: Math.max(60, Math.round((1 / Math.max(1, attempts + 1)) * 100)),
          levelReached: 1,
        });
      }, 700);
    } else {
      audioService.playWrong();
      setStatus('Robot xazinaga yetib bormadi. Buyruqlarni tekshiring.');
      setRunning(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-5 py-2">
      <p className="text-sm text-teal-300 text-center">{status}</p>

      <div className="grid grid-cols-4 gap-2 p-3 rounded-2xl bg-slate-900 border border-slate-700">
        {Array.from({ length: 16 }).map((_, idx) => {
          const r = Math.floor(idx / 4);
          const c = idx % 4;
          const isBot = bot.r === r && bot.c === c;
          const isWall = walls.has(`${r}-${c}`);
          const isGoal = goal.r === r && goal.c === c;
          return (
            <div
              key={idx}
              className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
                isWall
                  ? 'bg-slate-700'
                  : isBot
                    ? 'bg-teal-500 text-slate-950 font-bold'
                    : isGoal
                      ? 'bg-amber-500/20 border border-amber-400'
                      : 'bg-slate-800'
              }`}
            >
              {isBot ? `🤖${DIRS[bot.dir].arrow}` : isWall ? '🧱' : isGoal ? '💎' : ''}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <button
          disabled={running}
          onClick={() => setQueue((q) => [...q, 'F'])}
          className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-600 hover:border-teal-400 text-sm font-semibold cursor-pointer"
        >
          + Oldinga
        </button>
        <button
          disabled={running}
          onClick={() => setQueue((q) => [...q, 'L'])}
          className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-600 hover:border-teal-400 text-sm font-semibold cursor-pointer"
        >
          + Chapga buril
        </button>
        <button
          disabled={running}
          onClick={() => setQueue((q) => [...q, 'R'])}
          className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-600 hover:border-teal-400 text-sm font-semibold cursor-pointer"
        >
          + O‘ngga buril
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 min-h-[38px] p-2 rounded-xl bg-slate-900 border border-slate-800 w-full max-w-md justify-center">
        {queue.length === 0 ? (
          <span className="text-xs text-slate-500">Buyruqlar navbati bo‘sh...</span>
        ) : (
          queue.map((c, i) => (
            <span key={i} className="px-2.5 py-1 rounded-lg bg-teal-500/20 text-teal-200 text-xs font-mono">
              {c === 'F' ? 'Oldinga' : c === 'L' ? 'Chap' : 'O‘ng'}
            </span>
          ))
        )}
      </div>

      <div className="flex gap-3">
        <button
          disabled={running}
          onClick={() => {
            setQueue([]);
            setBot({ r: 3, c: 0, dir: 1 });
          }}
          className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm hover:text-white cursor-pointer"
        >
          Qayta yozish
        </button>
        <button
          disabled={running || queue.length === 0}
          onClick={runProgram}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 text-slate-950 font-bold text-sm hover:bg-teal-400 cursor-pointer disabled:opacity-50"
        >
          <Play className="w-4 h-4" />
          <span>Ishga tushir</span>
        </button>
      </div>
    </div>
  );
}

// ======================================================
// 19. KETMA-KETLIKNI TOP
// ======================================================
const SEQUENCES = [
  { seq: ['2', '4', '6', '8', '?'], ans: '10', options: ['9', '10', '12', '11'], hint: 'Har safar +2 qo‘shilmoqda' },
  { seq: ['5', '10', '15', '20', '?'], ans: '25', options: ['22', '24', '25', '30'], hint: 'Har qadamda +5 oshadi' },
  { seq: ['🔵', '🟡', '🔵', '🟡', '?'], ans: '🔵', options: ['🔵', '🟡', '🟢', '🔴'], hint: 'Navbatma-navbat almashadi' },
  { seq: ['1', '2', '4', '8', '?'], ans: '16', options: ['10', '12', '14', '16'], hint: 'Har bir son 2 ga ko‘paymoqda' },
  { seq: ['30', '27', '24', '21', '?'], ans: '18', options: ['17', '18', '19', '20'], hint: 'Har qadamda 3 ayriladi' },
];

export function SequenceFinderGame({ game, onComplete, onScorePulse, isPaused }: GameEngineProps) {
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [startTime] = useState(() => Date.now());
  const item = SEQUENCES[idx];

  const handlePick = (opt: string) => {
    if (isPaused) return;
    if (opt === item.ans) {
      audioService.playCorrect();
      onScorePulse?.(true);
      const nextCorrect = correct + 1;
      setCorrect(nextCorrect);
      setShowHint(false);
      setTimeout(() => {
        if (idx + 1 >= SEQUENCES.length) {
          const duration = Math.max(5, Math.round((Date.now() - startTime) / 1000));
          onComplete({
            gameId: game.id,
            score: nextCorrect * 40 - wrong * 8,
            correctCount: nextCorrect,
            incorrectCount: wrong,
            durationSeconds: duration,
            accuracy: Math.round((nextCorrect / (nextCorrect + wrong)) * 100),
            levelReached: SEQUENCES.length,
          });
        } else {
          setIdx((i) => i + 1);
        }
      }, 450);
    } else {
      audioService.playWrong();
      onScorePulse?.(false);
      setWrong((w) => w + 1);
      setShowHint(true);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="text-center">
        <p className="text-sm text-slate-400">Ketma-ketlik {idx + 1} / {SEQUENCES.length}</p>
        <h3 className="text-2xl font-bold text-white mt-1">So‘roq (?) o‘rniga mos elementni toping</h3>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {item.seq.map((s, i) => (
          <div
            key={i}
            className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold tabular-nums border ${
              s === '?' ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300' : 'bg-slate-800 border-slate-700 text-white'
            }`}
          >
            {s}
          </div>
        ))}
      </div>

      {showHint && <p className="text-sm text-amber-300">Maslahat: {item.hint}</p>}

      <div className="grid grid-cols-4 gap-3 w-full max-w-md">
        {item.options.map((opt) => (
          <button
            key={opt}
            onClick={() => handlePick(opt)}
            className="py-4 rounded-2xl bg-slate-800 border border-slate-700 hover:border-indigo-400 text-2xl font-bold text-white cursor-pointer"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ======================================================
// 20. KOSMIK MISSIYA
// ======================================================
const SPACE_STAGES = [
  {
    planet: 'Oy bazasi',
    question: 'Raketada 45 litr yoqilg‘i bor. Parvoz uchun 60 litr kerak. Yana necha litr quyish kerak?',
    ans: '15',
    options: ['10', '15', '20', '25'],
  },
  {
    planet: 'Mars orbitasi',
    question: 'Quyoshdan 4-sayyora qaysi?',
    ans: 'Mars',
    options: ['Venera', 'Yer', 'Mars', 'Yupiter'],
  },
  {
    planet: 'Asteroid kamari',
    question: 'Har bir qalqon 12 energiya oladi. 3 ta qalqon uchun jami necha energiya kerak?',
    ans: '36',
    options: ['24', '32', '36', '48'],
  },
  {
    planet: 'Yupiter bekati',
    question: 'Quyosh tizimidagi eng katta sayyora qaysi?',
    ans: 'Yupiter',
    options: ['Saturn', 'Yupiter', 'Uran', 'Neptun'],
  },
];

export function SpaceMissionGame({ game, onComplete, onScorePulse, isPaused }: GameEngineProps) {
  const [stage, setStage] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [startTime] = useState(() => Date.now());
  const item = SPACE_STAGES[stage];

  const handleAnswer = (opt: string) => {
    if (isPaused) return;
    if (opt === item.ans) {
      audioService.playCorrect();
      onScorePulse?.(true);
      const nextCorrect = correct + 1;
      setCorrect(nextCorrect);
      setTimeout(() => {
        if (stage + 1 >= SPACE_STAGES.length) {
          const duration = Math.max(5, Math.round((Date.now() - startTime) / 1000));
          onComplete({
            gameId: game.id,
            score: nextCorrect * 45 - wrong * 10,
            correctCount: nextCorrect,
            incorrectCount: wrong,
            durationSeconds: duration,
            accuracy: Math.round((nextCorrect / (nextCorrect + wrong)) * 100),
            levelReached: SPACE_STAGES.length,
          });
        } else {
          setStage((s) => s + 1);
        }
      }, 450);
    } else {
      audioService.playWrong();
      onScorePulse?.(false);
      setWrong((w) => w + 1);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="flex items-center gap-2 text-sky-300 text-sm font-medium">
        <Sparkles className="w-4 h-4" />
        <span>Missiya nuqtasi: {item.planet} ({stage + 1}/{SPACE_STAGES.length})</span>
      </div>

      <div className="p-6 rounded-3xl bg-slate-900 border border-sky-500/30 max-w-lg text-center">
        <p className="text-lg sm:text-xl font-bold text-white leading-relaxed">{item.question}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 w-full max-w-md">
        {item.options.map((opt) => (
          <button
            key={opt}
            onClick={() => handleAnswer(opt)}
            className="py-4 px-5 rounded-2xl bg-slate-800 border border-slate-700 hover:border-sky-400 text-lg font-bold text-white cursor-pointer transition-all"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
