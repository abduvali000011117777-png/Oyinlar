import { useEffect, useMemo, useState } from 'react';
import { Volume2 } from 'lucide-react';
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
// Shared SVG Shape Renderer for Ages 3-5
// ======================================================
function ShapeSvg({
  shape,
  color,
  size = 72,
  isShadow = false,
}: {
  shape: string;
  color: string;
  size?: number;
  isShadow?: boolean;
}) {
  const fill = isShadow ? '#0f172a' : color;
  const stroke = isShadow ? '#334155' : 'rgba(255,255,255,0.45)';
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="drop-shadow-md">
      {shape === 'circle' && (
        <circle cx="50" cy="50" r="38" fill={fill} stroke={stroke} strokeWidth="4" />
      )}
      {shape === 'square' && (
        <rect x="15" y="15" width="70" height="70" rx="12" fill={fill} stroke={stroke} strokeWidth="4" />
      )}
      {shape === 'triangle' && (
        <polygon points="50,12 88,84 12,84" fill={fill} stroke={stroke} strokeWidth="4" strokeLinejoin="round" />
      )}
      {shape === 'star' && (
        <polygon
          points="50,8 62,36 92,38 69,58 76,88 50,72 24,88 31,58 8,38 38,36"
          fill={fill}
          stroke={stroke}
          strokeWidth="4"
          strokeLinejoin="round"
        />
      )}
      {shape === 'heart' && (
        <path
          d="M50 86 C20 65 10 46 10 31 C10 18 20 10 31 10 C40 10 46 16 50 22 C54 16 60 10 69 10 C80 10 90 18 90 31 C90 46 80 65 50 86 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth="4"
        />
      )}
      {shape === 'hexagon' && (
        <polygon
          points="50,10 85,30 85,70 50,90 15,70 15,30"
          fill={fill}
          stroke={stroke}
          strokeWidth="4"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

// ======================================================
// 1. RANGLARNI TOP
// ======================================================
const COLORS_DATA = [
  { id: 'red', label: 'Qizil', hex: '#EF4444' },
  { id: 'blue', label: 'Ko‘k', hex: '#3B82F6' },
  { id: 'green', label: 'Yashil', hex: '#10B981' },
  { id: 'yellow', label: 'Sariq', hex: '#FACC15' },
  { id: 'purple', label: 'Binafsha', hex: '#A855F7' },
  { id: 'orange', label: 'To‘q sariq', hex: '#F97316' },
];

export function ColorsGame({ game, onComplete, onScorePulse, isPaused }: GameEngineProps) {
  const totalRounds = 6;
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [feedback, setFeedback] = useState<string>('');
  const [startTime] = useState(() => Date.now());

  const roundData = useMemo(() => {
    const target = COLORS_DATA[round % COLORS_DATA.length];
    const distractors = shuffle(COLORS_DATA.filter((c) => c.id !== target.id)).slice(0, 3);
    return { target, options: shuffle([target, ...distractors]) };
  }, [round]);

  useEffect(() => {
    audioService.speakUzbek(`${roundData.target.label} rangni toping`);
  }, [roundData]);

  const handlePick = (id: string) => {
    if (isPaused) return;
    if (id === roundData.target.id) {
      audioService.playCorrect();
      onScorePulse?.(true);
      const nextCorrect = correct + 1;
      setCorrect(nextCorrect);
      setFeedback('Barakalla! To‘g‘ri rang!');
      setTimeout(() => {
        setFeedback('');
        if (round + 1 >= totalRounds) {
          const duration = Math.max(5, Math.round((Date.now() - startTime) / 1000));
          const accuracy = Math.round((nextCorrect / (nextCorrect + wrong)) * 100);
          onComplete({
            gameId: game.id,
            score: nextCorrect * 30 - wrong * 5,
            correctCount: nextCorrect,
            incorrectCount: wrong,
            durationSeconds: duration,
            accuracy,
            levelReached: totalRounds,
          });
        } else {
          setRound((r) => r + 1);
        }
      }, 650);
    } else {
      audioService.playWrong();
      onScorePulse?.(false);
      setWrong((w) => w + 1);
      setFeedback('Yana bir bor urinib ko‘ring!');
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="text-center">
        <p className="text-sm text-slate-400">Bosqich {round + 1} / {totalRounds}</p>
        <h3 className="text-2xl sm:text-3xl font-bold text-white mt-1">
          <span style={{ color: roundData.target.hex }}>{roundData.target.label}</span> rangli sharni bosing!
        </h3>
      </div>

      <div
        className="w-28 h-28 rounded-3xl border-2 border-white/20 flex items-center justify-center shadow-lg"
        style={{ backgroundColor: roundData.target.hex }}
      >
        <span className="text-sm font-bold text-slate-950 bg-white/85 px-3 py-1 rounded-lg">
          {roundData.target.label}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-xl">
        {roundData.options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => handlePick(opt.id)}
            className="group flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-white/40 hover:-translate-y-1 transition-all min-h-[120px] cursor-pointer"
          >
            <div
              className="w-16 h-16 rounded-full shadow-inner border-4 border-white/30 group-hover:scale-110 transition-transform"
              style={{ backgroundColor: opt.hex }}
            />
          </button>
        ))}
      </div>

      {feedback && (
        <p className="text-base font-semibold text-amber-300 min-h-6">{feedback}</p>
      )}
    </div>
  );
}

// ======================================================
// 2. SHAKLLAR OLAMI
// ======================================================
const SHAPES_DATA = [
  { id: 'circle', label: 'Doira', color: '#38BDF8' },
  { id: 'square', label: 'Kvadrat', color: '#F59E0B' },
  { id: 'triangle', label: 'Uchburchak', color: '#10B981' },
  { id: 'star', label: 'Yulduz', color: '#FACC15' },
  { id: 'heart', label: 'Yurak', color: '#FB7185' },
  { id: 'hexagon', label: 'Oltiburchak', color: '#A78BFA' },
];

export function ShapesGame({ game, onComplete, onScorePulse, isPaused }: GameEngineProps) {
  const totalRounds = 6;
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [startTime] = useState(() => Date.now());

  const roundData = useMemo(() => {
    const target = SHAPES_DATA[round % SHAPES_DATA.length];
    const distractors = shuffle(SHAPES_DATA.filter((s) => s.id !== target.id)).slice(0, 3);
    return { target, options: shuffle([target, ...distractors]) };
  }, [round]);

  useEffect(() => {
    audioService.speakUzbek(`${roundData.target.label} shaklini toping`);
  }, [roundData]);

  const handleSelect = (id: string) => {
    if (isPaused) return;
    if (id === roundData.target.id) {
      audioService.playCorrect();
      onScorePulse?.(true);
      const nextCorrect = correct + 1;
      setCorrect(nextCorrect);
      setFeedback(`Zo‘r! Bu ${roundData.target.label}!`);
      setTimeout(() => {
        setFeedback('');
        if (round + 1 >= totalRounds) {
          const duration = Math.max(5, Math.round((Date.now() - startTime) / 1000));
          onComplete({
            gameId: game.id,
            score: nextCorrect * 35 - wrong * 5,
            correctCount: nextCorrect,
            incorrectCount: wrong,
            durationSeconds: duration,
            accuracy: Math.round((nextCorrect / (nextCorrect + wrong)) * 100),
            levelReached: totalRounds,
          });
        } else {
          setRound((r) => r + 1);
        }
      }, 650);
    } else {
      audioService.playWrong();
      onScorePulse?.(false);
      setWrong((w) => w + 1);
      setFeedback('Boshqa shaklni sinab ko‘ring!');
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="text-center">
        <p className="text-sm text-slate-400">Bosqich {round + 1} / {totalRounds}</p>
        <h3 className="text-2xl font-bold text-white mt-1">
          "{roundData.target.label}" shaklini uyasiga joylang
        </h3>
      </div>

      <div className="p-6 rounded-3xl bg-slate-900/90 border border-dashed border-slate-600 flex flex-col items-center gap-2">
        <ShapeSvg shape={roundData.target.id} color={roundData.target.color} size={96} isShadow />
        <span className="text-xs text-slate-400">Mos shaklni tanlang</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-xl">
        {roundData.options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => handleSelect(opt.id)}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-emerald-400 hover:-translate-y-1 transition-all cursor-pointer"
          >
            <ShapeSvg shape={opt.id} color={opt.color} size={68} />
            <span className="text-sm font-semibold text-slate-200">{opt.label}</span>
          </button>
        ))}
      </div>
      {feedback && <p className="text-base font-semibold text-emerald-300 min-h-6">{feedback}</p>}
    </div>
  );
}

// ======================================================
// 3. HAYVONLAR OVOZI
// ======================================================
const ANIMALS_DATA = [
  { id: 'cat', name: 'Mushuk', soundText: 'Miyov-miyov!', emoji: '🐱', color: '#F472B6' },
  { id: 'dog', name: 'Kuchuk', soundText: 'Vov-vov!', emoji: '🐶', color: '#F59E0B' },
  { id: 'cow', name: 'Sigir', soundText: 'Mu-u-u!', emoji: '🐮', color: '#38BDF8' },
  { id: 'sheep', name: 'Qo‘y', soundText: 'Ba-a-a!', emoji: '🐑', color: '#34D399' },
  { id: 'rooster', name: 'Xo‘roz', soundText: 'Qu-qu-ri-qu!', emoji: '🐓', color: '#FB7185' },
  { id: 'frog', name: 'Qurbaqa', soundText: 'Kva-kva!', emoji: '🐸', color: '#22C55E' },
];

export function AnimalsSoundGame({ game, onComplete, onScorePulse, isPaused }: GameEngineProps) {
  const totalRounds = 6;
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [startTime] = useState(() => Date.now());

  const roundData = useMemo(() => {
    const target = ANIMALS_DATA[round % ANIMALS_DATA.length];
    const distractors = shuffle(ANIMALS_DATA.filter((a) => a.id !== target.id)).slice(0, 3);
    return { target, options: shuffle([target, ...distractors]) };
  }, [round]);

  useEffect(() => {
    audioService.playAnimalCall(roundData.target.id);
  }, [roundData]);

  const handleSelect = (id: string) => {
    if (isPaused) return;
    if (id === roundData.target.id) {
      audioService.playCorrect();
      onScorePulse?.(true);
      const nextCorrect = correct + 1;
      setCorrect(nextCorrect);
      setFeedback(`To‘g‘ri! Bu ${roundData.target.name}!`);
      setTimeout(() => {
        setFeedback('');
        if (round + 1 >= totalRounds) {
          const duration = Math.max(5, Math.round((Date.now() - startTime) / 1000));
          onComplete({
            gameId: game.id,
            score: nextCorrect * 35 - wrong * 5,
            correctCount: nextCorrect,
            incorrectCount: wrong,
            durationSeconds: duration,
            accuracy: Math.round((nextCorrect / (nextCorrect + wrong)) * 100),
            levelReached: totalRounds,
          });
        } else {
          setRound((r) => r + 1);
        }
      }, 700);
    } else {
      audioService.playWrong();
      onScorePulse?.(false);
      setWrong((w) => w + 1);
      setFeedback('Qayta tinglab ko‘ring!');
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="text-center">
        <p className="text-sm text-slate-400">Bosqich {round + 1} / {totalRounds}</p>
        <h3 className="text-2xl font-bold text-white mt-1">Bu qaysi hayvonning ovozi?</h3>
      </div>

      <button
        onClick={() => audioService.playAnimalCall(roundData.target.id)}
        className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-amber-500 text-slate-950 font-bold text-lg hover:bg-amber-400 transition-colors cursor-pointer"
      >
        <Volume2 className="w-6 h-6" />
        <span>Ovozni eshitish: "{roundData.target.soundText}"</span>
      </button>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-xl">
        {roundData.options.map((animal) => (
          <button
            key={animal.id}
            onClick={() => handleSelect(animal.id)}
            className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-amber-400 hover:-translate-y-1 transition-all cursor-pointer"
          >
            <span className="text-5xl">{animal.emoji}</span>
            <span className="text-base font-semibold text-white">{animal.name}</span>
          </button>
        ))}
      </div>
      {feedback && <p className="text-base font-semibold text-amber-300 min-h-6">{feedback}</p>}
    </div>
  );
}

// ======================================================
// 4. MEVALARNI AJRAT
// ======================================================
const FRUITS_POOL = [
  { id: 'apple', name: 'Olma', emoji: '🍎', isFruit: true },
  { id: 'banana', name: 'Banan', emoji: '🍌', isFruit: true },
  { id: 'grapes', name: 'Uzum', emoji: '🍇', isFruit: true },
  { id: 'strawberry', name: 'Qulupnay', emoji: '🍓', isFruit: true },
  { id: 'watermelon', name: 'Tarvuz', emoji: '🍉', isFruit: true },
  { id: 'pear', name: 'Nok', emoji: '🍐', isFruit: true },
];
const NON_FRUITS = [
  { id: 'car', name: 'Mashina', emoji: '🚗', isFruit: false },
  { id: 'ball', name: 'Koptok', emoji: '⚽', isFruit: false },
  { id: 'book', name: 'Kitob', emoji: '📘', isFruit: false },
  { id: 'shoe', name: 'Poyabzal', emoji: '👟', isFruit: false },
];

export function FruitsSortGame({ game, onComplete, onScorePulse, isPaused }: GameEngineProps) {
  const [round, setRound] = useState(0);
  const totalRounds = 3;
  const [pickedIds, setPickedIds] = useState<string[]>([]);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [startTime] = useState(() => Date.now());

  const boardItems = useMemo(() => {
    const fruits = shuffle(FRUITS_POOL).slice(0, 3);
    const others = shuffle(NON_FRUITS).slice(0, 3);
    return shuffle([...fruits, ...others]);
  }, [round]);

  const handleTapItem = (item: { id: string; isFruit: boolean }) => {
    if (isPaused || pickedIds.includes(item.id)) return;
    if (item.isFruit) {
      audioService.playCorrect();
      onScorePulse?.(true);
      const nextPicked = [...pickedIds, item.id];
      const nextCorrect = correct + 1;
      setPickedIds(nextPicked);
      setCorrect(nextCorrect);

      if (nextPicked.length >= 3) {
        setTimeout(() => {
          if (round + 1 >= totalRounds) {
            const duration = Math.max(5, Math.round((Date.now() - startTime) / 1000));
            onComplete({
              gameId: game.id,
              score: nextCorrect * 25 - wrong * 5,
              correctCount: nextCorrect,
              incorrectCount: wrong,
              durationSeconds: duration,
              accuracy: Math.round((nextCorrect / (nextCorrect + wrong)) * 100),
              levelReached: totalRounds,
            });
          } else {
            setPickedIds([]);
            setRound((r) => r + 1);
          }
        }, 600);
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
        <p className="text-sm text-slate-400">Savatcha {round + 1} / {totalRounds}</p>
        <h3 className="text-2xl font-bold text-white mt-1">
          Faqat <span className="text-emerald-400">mevalarni</span> tanlab savatchaga soling! ({pickedIds.length}/3)
        </h3>
      </div>

      <div className="grid grid-cols-3 gap-4 w-full max-w-lg">
        {boardItems.map((item) => {
          const picked = pickedIds.includes(item.id);
          return (
            <button
              key={item.id}
              onClick={() => handleTapItem(item)}
              disabled={picked}
              className={`flex flex-col items-center gap-2 p-5 rounded-2xl border transition-all cursor-pointer ${
                picked
                  ? 'bg-emerald-500/20 border-emerald-400 opacity-50 scale-95'
                  : 'bg-slate-800/80 border-slate-700 hover:border-emerald-400 hover:-translate-y-1'
              }`}
            >
              <span className="text-5xl">{item.emoji}</span>
              <span className="text-sm font-semibold text-slate-200">{item.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ======================================================
// 5. KICHKINA MATEMATIK (1-10 SANOQ)
// ======================================================
const COUNT_ITEMS = [
  { emoji: '🍎', name: 'olma' },
  { emoji: '⭐', name: 'yulduz' },
  { emoji: '🦆', name: 'o‘rdakcha' },
  { emoji: '🌸', name: 'gul' },
  { emoji: '🦋', name: 'kapalak' },
];

export function LittleMathCountingGame({ game, onComplete, onScorePulse, isPaused }: GameEngineProps) {
  const totalRounds = 5;
  const [round, setRound] = useState(0);
  const [tapped, setTapped] = useState<number[]>([]);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [startTime] = useState(() => Date.now());

  const roundData = useMemo(() => {
    const targetCount = [2, 4, 5, 7, 9][round] ?? 3;
    const item = COUNT_ITEMS[round % COUNT_ITEMS.length];
    const choices = new Set<number>([targetCount]);
    while (choices.size < 4) {
      choices.add(Math.max(1, Math.min(10, targetCount + Math.floor(Math.random() * 5) - 2)));
    }
    return { targetCount, item, options: shuffle(Array.from(choices)) };
  }, [round]);

  const handleNumberPick = (num: number) => {
    if (isPaused) return;
    if (num === roundData.targetCount) {
      audioService.playCorrect();
      onScorePulse?.(true);
      const nextCorrect = correct + 1;
      setCorrect(nextCorrect);
      setTimeout(() => {
        setTapped([]);
        if (round + 1 >= totalRounds) {
          const duration = Math.max(5, Math.round((Date.now() - startTime) / 1000));
          onComplete({
            gameId: game.id,
            score: nextCorrect * 40 - wrong * 5,
            correctCount: nextCorrect,
            incorrectCount: wrong,
            durationSeconds: duration,
            accuracy: Math.round((nextCorrect / (nextCorrect + wrong)) * 100),
            levelReached: totalRounds,
          });
        } else {
          setRound((r) => r + 1);
        }
      }, 600);
    } else {
      audioService.playWrong();
      onScorePulse?.(false);
      setWrong((w) => w + 1);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="text-center">
        <p className="text-sm text-slate-400">Mashq {round + 1} / {totalRounds}</p>
        <h3 className="text-2xl font-bold text-white mt-1">
          Rasmda nechta {roundData.item.name} bor? Sanab, sonni bosing!
        </h3>
      </div>

      <div className="flex flex-wrap justify-center gap-3 p-6 rounded-3xl bg-slate-900/80 border border-slate-700 max-w-lg">
        {Array.from({ length: roundData.targetCount }).map((_, idx) => {
          const counted = tapped.includes(idx);
          return (
            <button
              key={idx}
              onClick={() => {
                audioService.playClick();
                if (!counted) setTapped((prev) => [...prev, idx]);
              }}
              className={`relative w-16 h-16 rounded-2xl flex items-center justify-center text-4xl transition-all cursor-pointer ${
                counted ? 'bg-sky-500/25 border-2 border-sky-400 scale-105' : 'bg-slate-800 border border-slate-700'
              }`}
            >
              {roundData.item.emoji}
              {counted && (
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-sky-400 text-slate-950 text-xs font-bold flex items-center justify-center">
                  {tapped.indexOf(idx) + 1}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-4 gap-4 w-full max-w-md">
        {roundData.options.map((n) => (
          <button
            key={n}
            onClick={() => handleNumberPick(n)}
            className="py-4 rounded-2xl bg-slate-800 border border-slate-600 hover:border-amber-400 hover:bg-slate-700 text-2xl font-extrabold text-white tabular-nums cursor-pointer transition-all"
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

// ======================================================
// 6. SOYANI TOP
// ======================================================
const SHADOW_ITEMS = [
  { id: 'rocket', label: 'Raketa', emoji: '🚀' },
  { id: 'plane', label: 'Samolyot', emoji: '✈️' },
  { id: 'tree', label: 'Daraxt', emoji: '🌳' },
  { id: 'butterfly', label: 'Kapalak', emoji: '🦋' },
  { id: 'car', label: 'Mashina', emoji: '🚙' },
  { id: 'fish', label: 'Baliq', emoji: '🐠' },
];

export function ShadowMatchGame({ game, onComplete, onScorePulse, isPaused }: GameEngineProps) {
  const totalRounds = 5;
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [startTime] = useState(() => Date.now());

  const roundData = useMemo(() => {
    const target = SHADOW_ITEMS[round % SHADOW_ITEMS.length];
    const distractors = shuffle(SHADOW_ITEMS.filter((i) => i.id !== target.id)).slice(0, 3);
    return { target, options: shuffle([target, ...distractors]) };
  }, [round]);

  const handlePick = (id: string) => {
    if (isPaused) return;
    if (id === roundData.target.id) {
      audioService.playCorrect();
      onScorePulse?.(true);
      const nextCorrect = correct + 1;
      setCorrect(nextCorrect);
      setTimeout(() => {
        if (round + 1 >= totalRounds) {
          const duration = Math.max(5, Math.round((Date.now() - startTime) / 1000));
          onComplete({
            gameId: game.id,
            score: nextCorrect * 35 - wrong * 5,
            correctCount: nextCorrect,
            incorrectCount: wrong,
            durationSeconds: duration,
            accuracy: Math.round((nextCorrect / (nextCorrect + wrong)) * 100),
            levelReached: totalRounds,
          });
        } else {
          setRound((r) => r + 1);
        }
      }, 500);
    } else {
      audioService.playWrong();
      onScorePulse?.(false);
      setWrong((w) => w + 1);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="text-center">
        <p className="text-sm text-slate-400">Bosqich {round + 1} / {totalRounds}</p>
        <h3 className="text-2xl font-bold text-white mt-1">
          "{roundData.target.label}" ning soyasini toping!
        </h3>
      </div>

      <div className="w-32 h-32 rounded-3xl bg-amber-400/15 border border-amber-400/40 flex items-center justify-center text-7xl">
        {roundData.target.emoji}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-xl">
        {roundData.options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => handlePick(opt.id)}
            className="p-6 rounded-2xl bg-slate-200 hover:bg-white border-2 border-slate-400 flex items-center justify-center transition-transform hover:-translate-y-1 cursor-pointer"
          >
            <span
              className="text-6xl select-none"
              style={{ filter: 'brightness(0) contrast(200%)' }}
            >
              {opt.emoji}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ======================================================
// 7. JUFTINI TOP (OCHIQ RASMLARDAN JUFTLASH)
// ======================================================
const PAIR_EMOJIS = ['🌞', '🌙', '🌈', '🎈', '🧸', '🚂'];

export function FindPairsGame({ game, onComplete, onScorePulse, isPaused }: GameEngineProps) {
  const [cards, setCards] = useState(() =>
    shuffle([...PAIR_EMOJIS.slice(0, 4), ...PAIR_EMOJIS.slice(0, 4)]).map((emoji, idx) => ({
      id: idx,
      emoji,
      matched: false,
    }))
  );
  const [selected, setSelected] = useState<number[]>([]);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [startTime] = useState(() => Date.now());

  const handleTap = (idx: number) => {
    if (isPaused || cards[idx].matched || selected.includes(idx)) return;
    audioService.playClick();
    const nextSel = [...selected, idx];
    setSelected(nextSel);

    if (nextSel.length === 2) {
      const [a, b] = nextSel;
      if (cards[a].emoji === cards[b].emoji) {
        audioService.playCorrect();
        onScorePulse?.(true);
        const updated = cards.map((c, i) => (i === a || i === b ? { ...c, matched: true } : c));
        setCards(updated);
        setSelected([]);
        const nextCorrect = correct + 1;
        setCorrect(nextCorrect);

        if (updated.every((c) => c.matched)) {
          setTimeout(() => {
            const duration = Math.max(5, Math.round((Date.now() - startTime) / 1000));
            onComplete({
              gameId: game.id,
              score: nextCorrect * 40 - wrong * 5,
              correctCount: nextCorrect,
              incorrectCount: wrong,
              durationSeconds: duration,
              accuracy: Math.round((nextCorrect / (nextCorrect + wrong)) * 100),
              levelReached: 1,
            });
          }, 500);
        }
      } else {
        audioService.playWrong();
        onScorePulse?.(false);
        setWrong((w) => w + 1);
        setTimeout(() => setSelected([]), 450);
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white">Bir xil ikkita rasmni ketma-ket bosing!</h3>
        <p className="text-sm text-slate-400 mt-1">Topilgan juftliklar: {correct} / 4</p>
      </div>
      <div className="grid grid-cols-4 gap-4 w-full max-w-md">
        {cards.map((card, idx) => {
          const isSel = selected.includes(idx);
          return (
            <button
              key={card.id}
              onClick={() => handleTap(idx)}
              disabled={card.matched}
              className={`h-24 rounded-2xl text-5xl flex items-center justify-center border-2 transition-all cursor-pointer ${
                card.matched
                  ? 'bg-emerald-500/20 border-emerald-400 opacity-45'
                  : isSel
                    ? 'bg-amber-400/25 border-amber-400 scale-105'
                    : 'bg-slate-800 border-slate-700 hover:border-slate-500'
              }`}
            >
              {card.emoji}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ======================================================
// 8. RANGLI PAZL (2x2 -> 3x3 ALMASHTIRISH PAZLI)
// ======================================================
const PUZZLE_THEMES = [
  {
    name: 'Quyoshli uy',
    tiles: [
      { id: 0, label: '☀️', bg: '#0284C7', desc: 'Osmon va quyosh' },
      { id: 1, label: '☁️', bg: '#0EA5E9', desc: 'Oq bulut' },
      { id: 2, label: '🏠', bg: '#16A34A', desc: 'Shinam uy' },
      { id: 3, label: '🌳', bg: '#15803D', desc: 'Yashil daraxt' },
    ],
  },
  {
    name: 'Koinot sayohati',
    tiles: [
      { id: 0, label: '🌙', bg: '#1E1B4B', desc: 'Oy' },
      { id: 1, label: '⭐', bg: '#312E81', desc: 'Yulduz' },
      { id: 2, label: '🚀', bg: '#4338CA', desc: 'Raketa' },
      { id: 3, label: '🪐', bg: '#3730A3', desc: 'Sayyora' },
    ],
  },
];

export function ColorPuzzleGame({ game, onComplete, onScorePulse, isPaused }: GameEngineProps) {
  const [stage, setStage] = useState(0);
  const theme = PUZZLE_THEMES[stage];
  const [order, setOrder] = useState<number[]>([2, 0, 3, 1]);
  const [pickedPos, setPickedPos] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [startTime] = useState(() => Date.now());

  const handleTileTap = (pos: number) => {
    if (isPaused) return;
    audioService.playClick();
    if (pickedPos === null) {
      setPickedPos(pos);
      return;
    }
    if (pickedPos === pos) {
      setPickedPos(null);
      return;
    }
    const next = [...order];
    [next[pickedPos], next[pos]] = [next[pos], next[pickedPos]];
    setOrder(next);
    setPickedPos(null);
    setMoves((m) => m + 1);

    const isSolved = next.every((val, idx) => val === idx);
    if (isSolved) {
      audioService.playCorrect();
      onScorePulse?.(true);
      const nextCorrect = correct + 1;
      setCorrect(nextCorrect);
      setTimeout(() => {
        if (stage + 1 >= PUZZLE_THEMES.length) {
          const duration = Math.max(5, Math.round((Date.now() - startTime) / 1000));
          onComplete({
            gameId: game.id,
            score: Math.max(80, 200 - moves * 6),
            correctCount: nextCorrect,
            incorrectCount: Math.max(0, moves - 4),
            durationSeconds: duration,
            accuracy: Math.min(100, Math.round((4 / Math.max(4, moves)) * 100)),
            levelReached: PUZZLE_THEMES.length,
          });
        } else {
          setStage((s) => s + 1);
          setOrder([3, 2, 0, 1]);
        }
      }, 650);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="text-center">
        <p className="text-sm text-slate-400">Pazl {stage + 1} / {PUZZLE_THEMES.length}</p>
        <h3 className="text-2xl font-bold text-white mt-1">"{theme.name}" pazlini to‘g‘ri tartibda yig‘ing</h3>
        <p className="text-xs text-slate-400 mt-1">Ikkita katakchani bosib o‘rnini almashtiring</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-8">
        <div>
          <p className="text-xs text-slate-400 mb-2 text-center">Namuna</p>
          <div className="grid grid-cols-2 gap-1.5 p-2 rounded-2xl bg-slate-900 border border-slate-700 w-32">
            {theme.tiles.map((t) => (
              <div
                key={t.id}
                className="h-14 rounded-xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: t.bg }}
              >
                {t.label}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 p-3 rounded-3xl bg-slate-900 border border-slate-700 w-64">
          {order.map((tileId, pos) => {
            const tile = theme.tiles[tileId];
            const selected = pickedPos === pos;
            return (
              <button
                key={pos}
                onClick={() => handleTileTap(pos)}
                className={`h-28 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border-2 ${
                  selected ? 'border-amber-400 scale-105' : 'border-white/15 hover:border-white/40'
                }`}
                style={{ backgroundColor: tile.bg }}
              >
                <span className="text-4xl">{tile.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ======================================================
// 9. KATTA YOKI KICHIK
// ======================================================
const SIZE_OBJECTS = [
  { emoji: '🐘', name: 'Fil' },
  { emoji: '🎈', name: 'Shar' },
  { emoji: '🍉', name: 'Tarvuz' },
  { emoji: '🐻', name: 'Ayiqcha' },
  { emoji: '🌻', name: 'Kungaboqar' },
];

export function BigOrSmallGame({ game, onComplete, onScorePulse, isPaused }: GameEngineProps) {
  const totalRounds = 5;
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [startTime] = useState(() => Date.now());

  const roundData = useMemo(() => {
    const askBiggest = round % 2 === 0;
    const obj = SIZE_OBJECTS[round % SIZE_OBJECTS.length];
    const sizes = shuffle([
      { id: 'sm', px: 38, scaleVal: 1 },
      { id: 'md', px: 64, scaleVal: 2 },
      { id: 'lg', px: 96, scaleVal: 3 },
    ]);
    const targetId = askBiggest ? 'lg' : 'sm';
    return { askBiggest, obj, sizes, targetId };
  }, [round]);

  const handleSelect = (id: string) => {
    if (isPaused) return;
    if (id === roundData.targetId) {
      audioService.playCorrect();
      onScorePulse?.(true);
      const nextCorrect = correct + 1;
      setCorrect(nextCorrect);
      setTimeout(() => {
        if (round + 1 >= totalRounds) {
          const duration = Math.max(5, Math.round((Date.now() - startTime) / 1000));
          onComplete({
            gameId: game.id,
            score: nextCorrect * 35 - wrong * 5,
            correctCount: nextCorrect,
            incorrectCount: wrong,
            durationSeconds: duration,
            accuracy: Math.round((nextCorrect / (nextCorrect + wrong)) * 100),
            levelReached: totalRounds,
          });
        } else {
          setRound((r) => r + 1);
        }
      }, 500);
    } else {
      audioService.playWrong();
      onScorePulse?.(false);
      setWrong((w) => w + 1);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="text-center">
        <p className="text-sm text-slate-400">Savol {round + 1} / {totalRounds}</p>
        <h3 className="text-2xl font-bold text-white mt-1">
          Eng <span className="text-amber-400">{roundData.askBiggest ? 'KATTA' : 'KICHIK'}</span> {roundData.obj.name.toLowerCase()}ni toping!
        </h3>
      </div>

      <div className="grid grid-cols-3 gap-4 w-full max-w-xl">
        {roundData.sizes.map((s) => (
          <button
            key={s.id}
            onClick={() => handleSelect(s.id)}
            className="h-44 rounded-3xl bg-slate-800/80 border border-slate-700 hover:border-amber-400 flex items-center justify-center transition-all cursor-pointer"
          >
            <span style={{ fontSize: `${s.px}px`, lineHeight: 1 }}>{roundData.obj.emoji}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ======================================================
// 10. XOTIRA KARTOCHKALARI (FLIP CARDS)
// ======================================================
export function MemoryCardsGame({ game, onComplete, onScorePulse, isPaused }: GameEngineProps) {
  const icons = ['🦁', '🐼', '🦊', '🐸', '🦋', '🐢'];
  const [cards, setCards] = useState(() =>
    shuffle([...icons.slice(0, 4), ...icons.slice(0, 4)]).map((emoji, idx) => ({
      id: idx,
      emoji,
      flipped: false,
      matched: false,
    }))
  );
  const [openIndices, setOpenIndices] = useState<number[]>([]);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [locked, setLocked] = useState(false);
  const [startTime] = useState(() => Date.now());

  const handleFlip = (idx: number) => {
    if (isPaused || locked || cards[idx].flipped || cards[idx].matched) return;
    audioService.playClick();
    const nextCards = cards.map((c, i) => (i === idx ? { ...c, flipped: true } : c));
    setCards(nextCards);
    const nextOpen = [...openIndices, idx];
    setOpenIndices(nextOpen);

    if (nextOpen.length === 2) {
      setLocked(true);
      const [a, b] = nextOpen;
      if (nextCards[a].emoji === nextCards[b].emoji) {
        audioService.playCorrect();
        onScorePulse?.(true);
        const matchedCards = nextCards.map((c, i) =>
          i === a || i === b ? { ...c, matched: true } : c
        );
        const nextCorrect = correct + 1;
        setCards(matchedCards);
        setCorrect(nextCorrect);
        setOpenIndices([]);
        setLocked(false);

        if (matchedCards.every((c) => c.matched)) {
          setTimeout(() => {
            const duration = Math.max(5, Math.round((Date.now() - startTime) / 1000));
            onComplete({
              gameId: game.id,
              score: Math.max(60, nextCorrect * 45 - wrong * 5),
              correctCount: nextCorrect,
              incorrectCount: wrong,
              durationSeconds: duration,
              accuracy: Math.round((nextCorrect / (nextCorrect + wrong)) * 100),
              levelReached: 1,
            });
          }, 550);
        }
      } else {
        audioService.playWrong();
        onScorePulse?.(false);
        setWrong((w) => w + 1);
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c, i) => (i === a || i === b ? { ...c, flipped: false } : c))
          );
          setOpenIndices([]);
          setLocked(false);
        }, 700);
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white">Yashiringan hayvonchalar juftini toping!</h3>
        <p className="text-sm text-slate-400 mt-1">Topilgan juftliklar: {correct} / 4</p>
      </div>
      <div className="grid grid-cols-4 gap-3 sm:gap-4 w-full max-w-md">
        {cards.map((card, idx) => {
          const shown = card.flipped || card.matched;
          return (
            <button
              key={card.id}
              onClick={() => handleFlip(idx)}
              className={`h-24 rounded-2xl text-4xl flex items-center justify-center border-2 transition-all cursor-pointer ${
                card.matched
                  ? 'bg-emerald-500/20 border-emerald-400'
                  : shown
                    ? 'bg-slate-700 border-amber-400'
                    : 'bg-slate-800 border-slate-600 hover:border-amber-300'
              }`}
            >
              {shown ? card.emoji : '?'}
            </button>
          );
        })}
      </div>
    </div>
  );
}
