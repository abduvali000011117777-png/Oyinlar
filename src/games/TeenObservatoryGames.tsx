import { useEffect, useMemo, useRef, useState } from 'react';
import { audioService } from '../services/audioService';
import Interactive3DGeometry, { VoxelBlock } from '../three/Interactive3DGeometry';
import { GameEngineProps } from '../types/platform';

// ======================================================
// 21. IQ BATTLE (3x3 RAVEN MATRIX)
// ======================================================
function MatrixCell({ shape, count, color, rot = 0 }: { shape: 'circle' | 'square' | 'triangle'; count: number; color: string; rot?: number }) {
  return (
    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center gap-1 p-1">
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} width="20" height="20" viewBox="0 0 24 24" style={{ transform: `rotate(${rot}deg)` }}>
          {shape === 'circle' && <circle cx="12" cy="12" r="9" fill={color} />}
          {shape === 'square' && <rect x="3" y="3" width="18" height="18" rx="3" fill={color} />}
          {shape === 'triangle' && <polygon points="12,3 21,21 3,21" fill={color} />}
        </svg>
      ))}
    </div>
  );
}

export function IqBattleGame({ game, onComplete, onScorePulse, isPaused }: GameEngineProps) {
  const puzzles = [
    {
      rows: [
        [
          { shape: 'circle' as const, count: 1, color: '#38BDF8', rot: 0 },
          { shape: 'circle' as const, count: 2, color: '#38BDF8', rot: 0 },
          { shape: 'circle' as const, count: 3, color: '#38BDF8', rot: 0 },
        ],
        [
          { shape: 'square' as const, count: 1, color: '#F59E0B', rot: 0 },
          { shape: 'square' as const, count: 2, color: '#F59E0B', rot: 0 },
          { shape: 'square' as const, count: 3, color: '#F59E0B', rot: 0 },
        ],
        [
          { shape: 'triangle' as const, count: 1, color: '#10B981', rot: 0 },
          { shape: 'triangle' as const, count: 2, color: '#10B981', rot: 0 },
          null,
        ],
      ],
      ansIdx: 1,
      options: [
        { shape: 'triangle' as const, count: 2, color: '#10B981', rot: 0 },
        { shape: 'triangle' as const, count: 3, color: '#10B981', rot: 0 },
        { shape: 'square' as const, count: 3, color: '#10B981', rot: 0 },
        { shape: 'triangle' as const, count: 3, color: '#F59E0B', rot: 0 },
      ],
    },
    {
      rows: [
        [
          { shape: 'triangle' as const, count: 1, color: '#38BDF8', rot: 0 },
          { shape: 'triangle' as const, count: 1, color: '#38BDF8', rot: 90 },
          { shape: 'triangle' as const, count: 1, color: '#38BDF8', rot: 180 },
        ],
        [
          { shape: 'square' as const, count: 1, color: '#F59E0B', rot: 0 },
          { shape: 'square' as const, count: 1, color: '#F59E0B', rot: 45 },
          { shape: 'square' as const, count: 1, color: '#F59E0B', rot: 90 },
        ],
        [
          { shape: 'triangle' as const, count: 2, color: '#FB7185', rot: 0 },
          { shape: 'triangle' as const, count: 2, color: '#FB7185', rot: 90 },
          null,
        ],
      ],
      ansIdx: 2,
      options: [
        { shape: 'triangle' as const, count: 2, color: '#FB7185', rot: 0 },
        { shape: 'triangle' as const, count: 1, color: '#FB7185', rot: 180 },
        { shape: 'triangle' as const, count: 2, color: '#FB7185', rot: 180 },
        { shape: 'circle' as const, count: 2, color: '#FB7185', rot: 180 },
      ],
    },
    {
      rows: [
        [
          { shape: 'circle' as const, count: 3, color: '#A78BFA', rot: 0 },
          { shape: 'circle' as const, count: 2, color: '#A78BFA', rot: 0 },
          { shape: 'circle' as const, count: 1, color: '#A78BFA', rot: 0 },
        ],
        [
          { shape: 'square' as const, count: 3, color: '#34D399', rot: 0 },
          { shape: 'square' as const, count: 2, color: '#34D399', rot: 0 },
          { shape: 'square' as const, count: 1, color: '#34D399', rot: 0 },
        ],
        [
          { shape: 'triangle' as const, count: 3, color: '#FBBF24', rot: 0 },
          { shape: 'triangle' as const, count: 2, color: '#FBBF24', rot: 0 },
          null,
        ],
      ],
      ansIdx: 0,
      options: [
        { shape: 'triangle' as const, count: 1, color: '#FBBF24', rot: 0 },
        { shape: 'triangle' as const, count: 2, color: '#FBBF24', rot: 0 },
        { shape: 'circle' as const, count: 1, color: '#FBBF24', rot: 0 },
        { shape: 'triangle' as const, count: 1, color: '#34D399', rot: 0 },
      ],
    },
  ];

  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [startTime] = useState(() => Date.now());
  const p = puzzles[idx];

  const handleSelect = (optIdx: number) => {
    if (isPaused) return;
    if (optIdx === p.ansIdx) {
      audioService.playCorrect();
      onScorePulse?.(true);
      const nextCorrect = correct + 1;
      setCorrect(nextCorrect);
      setTimeout(() => {
        if (idx + 1 >= puzzles.length) {
          const duration = Math.max(5, Math.round((Date.now() - startTime) / 1000));
          onComplete({
            gameId: game.id,
            score: nextCorrect * 60 - wrong * 12,
            correctCount: nextCorrect,
            incorrectCount: wrong,
            durationSeconds: duration,
            accuracy: Math.round((nextCorrect / (nextCorrect + wrong)) * 100),
            levelReached: puzzles.length,
          });
        } else {
          setIdx((i) => i + 1);
        }
      }, 450);
    } else {
      audioService.playWrong();
      onScorePulse?.(false);
      setWrong((w) => w + 1);
    }
  };

  return (
    <div className="flex flex-col items-center gap-5 py-2">
      <div className="text-center">
        <p className="text-sm text-slate-400">Matritsa {idx + 1} / {puzzles.length}</p>
        <h3 className="text-xl font-bold text-white mt-1">Bo‘sh katakka mos keluvchi shaklni tanlang</h3>
      </div>

      <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-950 border border-slate-800">
        {p.rows.flat().map((cell, i) =>
          cell ? (
            <MatrixCell key={i} {...cell} />
          ) : (
            <div
              key={i}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-sky-500/15 border-2 border-dashed border-sky-400 flex items-center justify-center text-2xl font-bold text-sky-300"
            >
              ?
            </div>
          )
        )}
      </div>

      <div className="grid grid-cols-4 gap-3">
        {p.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            className="p-1.5 rounded-2xl border-2 border-slate-700 hover:border-sky-400 bg-slate-800 cursor-pointer transition-all"
          >
            <MatrixCell {...opt} />
          </button>
        ))}
      </div>
    </div>
  );
}

// ======================================================
// 22. MATEMATIK ARENA
// ======================================================
const ARENA_QUESTIONS = [
  { q: '120 ning 25% i nechaga teng?', ans: '30', options: ['25', '30', '35', '40'] },
  { q: '3² + 4² = ?', ans: '25', options: ['14', '21', '25', '49'] },
  { q: 'Agar 5x − 7 = 28 bo‘lsa, x = ?', ans: '7', options: ['5', '6', '7', '8'] },
  { q: '6 ? 4 + 5 = 29 tenglikda "?" qaysi amal?', ans: '×', options: ['+', '−', '×', '÷'] },
  { q: '1/2 + 1/4 = ?', ans: '3/4', options: ['2/6', '3/4', '2/4', '4/6'] },
];

export function MathArenaGame({ game, onComplete, onScorePulse, isPaused }: GameEngineProps) {
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [startTime] = useState(() => Date.now());
  const item = ARENA_QUESTIONS[idx];

  const handlePick = (opt: string) => {
    if (isPaused) return;
    if (opt === item.ans) {
      audioService.playCorrect();
      onScorePulse?.(true);
      const nextCorrect = correct + 1;
      setCorrect(nextCorrect);
      setTimeout(() => {
        if (idx + 1 >= ARENA_QUESTIONS.length) {
          const duration = Math.max(5, Math.round((Date.now() - startTime) / 1000));
          onComplete({
            gameId: game.id,
            score: nextCorrect * 45 - wrong * 10,
            correctCount: nextCorrect,
            incorrectCount: wrong,
            durationSeconds: duration,
            accuracy: Math.round((nextCorrect / (nextCorrect + wrong)) * 100),
            levelReached: ARENA_QUESTIONS.length,
          });
        } else {
          setIdx((i) => i + 1);
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
      <p className="text-sm text-slate-400">Masala {idx + 1} / {ARENA_QUESTIONS.length}</p>
      <div className="p-7 rounded-3xl bg-slate-900 border border-emerald-500/30 max-w-lg text-center">
        <p className="text-2xl font-bold font-mono text-white">{item.q}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 w-full max-w-md">
        {item.options.map((opt) => (
          <button
            key={opt}
            onClick={() => handlePick(opt)}
            className="py-4 rounded-2xl bg-slate-800 border border-slate-700 hover:border-emerald-400 text-xl font-bold font-mono text-white cursor-pointer"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ======================================================
// 23. DETEKTIV SIRLAR
// ======================================================
const DETECTIVE_CASES = [
  {
    title: 'Laboratoriya kaliti ishi',
    story: 'Laboratoriyadan maxfiy kalit yo‘qoldi. Uch nafar shubhali shaxsdan faqat bittasi rost gapiryapti:',
    clues: [
      'Ali: "Kalitni men olmadim."',
      'Vali: "Kalitni Ali oldi."',
      'Soli: "Kalitni men olmadim."',
    ],
    question: 'Kalitni kim olgan?',
    ans: 'Soli',
    options: ['Ali', 'Vali', 'Soli'],
  },
  {
    title: 'Kuzatuv kamerasi',
    story: 'Kutubxonaga 3 kishi turli vaqtda kirdi: Dilnoza, Bobur va Temur.',
    clues: [
      'Temur Boburdan oldin keldi.',
      'Dilnoza eng birinchi bo‘lib kelmagan, lekin Boburdan oldin kelgan.',
    ],
    question: 'Eng birinchi kim kelgan?',
    ans: 'Temur',
    options: ['Dilnoza', 'Bobur', 'Temur'],
  },
  {
    title: 'Uchta quti siri',
    story: 'Oltin medal uchta qutidan birida (A, B yoki C). Har bir qutidagi yozuvlardan faqat bittasi rost:',
    clues: [
      'A qutisi: "Medal shu qutida."',
      'B qutisi: "Medal B qutisida emas."',
      'C qutisi: "Medal A qutisida emas."',
    ],
    question: 'Medal qaysi qutida?',
    ans: 'A',
    options: ['A', 'B', 'C'],
  },
];

export function DetectiveSecretsGame({ game, onComplete, onScorePulse, isPaused }: GameEngineProps) {
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [startTime] = useState(() => Date.now());
  const c = DETECTIVE_CASES[idx];

  const handleSelect = (opt: string) => {
    if (isPaused) return;
    if (opt === c.ans) {
      audioService.playCorrect();
      onScorePulse?.(true);
      const nextCorrect = correct + 1;
      setCorrect(nextCorrect);
      setTimeout(() => {
        if (idx + 1 >= DETECTIVE_CASES.length) {
          const duration = Math.max(5, Math.round((Date.now() - startTime) / 1000));
          onComplete({
            gameId: game.id,
            score: nextCorrect * 60 - wrong * 15,
            correctCount: nextCorrect,
            incorrectCount: wrong,
            durationSeconds: duration,
            accuracy: Math.round((nextCorrect / (nextCorrect + wrong)) * 100),
            levelReached: DETECTIVE_CASES.length,
          });
        } else {
          setIdx((i) => i + 1);
        }
      }, 500);
    } else {
      audioService.playWrong();
      onScorePulse?.(false);
      setWrong((w) => w + 1);
    }
  };

  return (
    <div className="flex flex-col items-center gap-5 py-2 max-w-xl mx-auto">
      <div className="text-center">
        <p className="text-xs text-amber-300">Tergov #{idx + 1} / {DETECTIVE_CASES.length}</p>
        <h3 className="text-2xl font-bold text-white mt-1">{c.title}</h3>
      </div>

      <div className="w-full p-5 rounded-2xl bg-slate-900 border border-slate-700 space-y-3">
        <p className="text-sm text-slate-300">{c.story}</p>
        <ul className="space-y-2 text-sm text-amber-200 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
          {c.clues.map((clue, i) => (
            <li key={i}>• {clue}</li>
          ))}
        </ul>
        <p className="text-base font-bold text-white pt-1">{c.question}</p>
      </div>

      <div className="grid grid-cols-3 gap-3 w-full">
        {c.options.map((opt) => (
          <button
            key={opt}
            onClick={() => handleSelect(opt)}
            className="py-3.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-amber-400 font-bold text-white cursor-pointer"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ======================================================
// 24. KOD USTASI
// ======================================================
const CODE_PUZZLES = [
  {
    code: `let s = 0;\nfor (let i = 1; i <= 4; i++) {\n  s += i;\n}\n// s ning yakuniy qiymati?`,
    ans: '10',
    options: ['6', '8', '10', '14'],
  },
  {
    code: `let x = 12;\nif (x % 2 === 0 && x > 10) {\n  x = x / 2;\n} else {\n  x = x + 5;\n}`,
    ans: '6',
    options: ['6', '12', '17', '24'],
  },
  {
    code: `const arr = [3, 7, 2, 9];\nlet m = arr[0];\nfor (const n of arr) {\n  if (n > m) m = n;\n}`,
    ans: '9',
    options: ['2', '3', '7', '9'],
  },
  {
    code: `function f(n) {\n  return n <= 1 ? 1 : n * f(n - 1);\n}\n// f(4) = ?`,
    ans: '24',
    options: ['12', '16', '24', '32'],
  },
];

export function CodeMasterGame({ game, onComplete, onScorePulse, isPaused }: GameEngineProps) {
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [startTime] = useState(() => Date.now());
  const item = CODE_PUZZLES[idx];

  const handleSelect = (opt: string) => {
    if (isPaused) return;
    if (opt === item.ans) {
      audioService.playCorrect();
      onScorePulse?.(true);
      const nextCorrect = correct + 1;
      setCorrect(nextCorrect);
      setTimeout(() => {
        if (idx + 1 >= CODE_PUZZLES.length) {
          const duration = Math.max(5, Math.round((Date.now() - startTime) / 1000));
          onComplete({
            gameId: game.id,
            score: nextCorrect * 50 - wrong * 10,
            correctCount: nextCorrect,
            incorrectCount: wrong,
            durationSeconds: duration,
            accuracy: Math.round((nextCorrect / (nextCorrect + wrong)) * 100),
            levelReached: CODE_PUZZLES.length,
          });
        } else {
          setIdx((i) => i + 1);
        }
      }, 450);
    } else {
      audioService.playWrong();
      onScorePulse?.(false);
      setWrong((w) => w + 1);
    }
  };

  return (
    <div className="flex flex-col items-center gap-5 py-2 max-w-lg mx-auto">
      <p className="text-sm text-slate-400">Algoritm {idx + 1} / {CODE_PUZZLES.length}</p>
      <pre className="w-full p-5 rounded-2xl bg-slate-950 border border-cyan-500/30 font-mono text-sm text-cyan-200 overflow-x-auto leading-relaxed">
        {item.code}
      </pre>
      <div className="grid grid-cols-4 gap-3 w-full">
        {item.options.map((opt) => (
          <button
            key={opt}
            onClick={() => handleSelect(opt)}
            className="py-3.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-cyan-400 font-mono font-bold text-xl text-white cursor-pointer"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ======================================================
// 25. FIZIKA LABORATORIYASI (INTERACTIVE BALLISTICS)
// ======================================================
export function PhysicsLabGame({ game, onComplete, onScorePulse, isPaused }: GameEngineProps) {
  const targets = [
    { dist: 160, label: '1-tajriba: Qisqa masofa (160m)' },
    { dist: 230, label: '2-tajriba: O‘rta masofa (230m)' },
    { dist: 290, label: '3-tajriba: Uzoq masofa (290m)' },
  ];
  const [stage, setStage] = useState(0);
  const [angle, setAngle] = useState(45);
  const [velocity, setVelocity] = useState(40);
  const [shots, setShots] = useState(0);
  const [lastLanding, setLastLanding] = useState<number | null>(null);
  const [status, setStatus] = useState('Burchak va boshlang‘ich tezlikni sozlab, nishonga tekkizing!');
  const [startTime] = useState(() => Date.now());

  const targetDist = targets[stage].dist;
  const g = 9.8;
  const rad = (angle * Math.PI) / 180;
  const predictedRange = Math.round(((velocity * velocity) * Math.sin(2 * rad)) / g);

  const trajectoryPoints = useMemo(() => {
    const pts: string[] = [];
    for (let t = 0; t <= 10; t += 0.3) {
      const x = velocity * Math.cos(rad) * t;
      const y = velocity * Math.sin(rad) * t - 0.5 * g * t * t;
      if (y < 0 && t > 0) break;
      const sx = 20 + x * 0.9;
      const sy = 175 - y * 0.9;
      if (sx <= 340) pts.push(`${sx.toFixed(1)},${sy.toFixed(1)}`);
    }
    return pts.join(' ');
  }, [angle, velocity, rad]);

  const fire = () => {
    if (isPaused) return;
    setShots((s) => s + 1);
    setLastLanding(predictedRange);
    if (Math.abs(predictedRange - targetDist) <= 18) {
      audioService.playCorrect();
      onScorePulse?.(true);
      setStatus(`Aniq zarba! Masofa: ${predictedRange}m`);
      setTimeout(() => {
        if (stage + 1 >= targets.length) {
          const duration = Math.max(5, Math.round((Date.now() - startTime) / 1000));
          onComplete({
            gameId: game.id,
            score: Math.max(90, 220 - shots * 12),
            correctCount: targets.length,
            incorrectCount: Math.max(0, shots + 1 - targets.length),
            durationSeconds: duration,
            accuracy: Math.min(100, Math.round((targets.length / Math.max(targets.length, shots + 1)) * 100)),
            levelReached: targets.length,
          });
        } else {
          setStage((s) => s + 1);
          setLastLanding(null);
          setStatus('Keyingi nishon uchun parametrlarni moslang!');
        }
      }, 750);
    } else {
      audioService.playWrong();
      onScorePulse?.(false);
      setStatus(
        predictedRange < targetDist
          ? `Qisqa tushdi (${predictedRange}m). Tezlikni oshiring yoki burchakni 45° ga yaqinlashtiring.`
          : `Oshib ketdi (${predictedRange}m). Tezlikni biroz kamaytiring.`
      );
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 py-2 max-w-xl mx-auto">
      <p className="text-sm font-semibold text-orange-300">{targets[stage].label}</p>
      <svg viewBox="0 0 360 195" className="w-full rounded-2xl bg-slate-950 border border-slate-800">
        <line x1="10" y1="175" x2="350" y2="175" stroke="#334155" strokeWidth="2" />
        {/* Predicted dotted curve */}
        <polyline
          points={trajectoryPoints}
          fill="none"
          stroke="#F97316"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
        {/* Launcher */}
        <circle cx="20" cy="175" r="7" fill="#38BDF8" />
        {/* Target */}
        <rect x={20 + targetDist * 0.9 - 14} y="165" width="28" height="10" rx="3" fill="#10B981" />
        {lastLanding !== null && (
          <circle cx={Math.min(345, 20 + lastLanding * 0.9)} cy="175" r="5" fill="#F43F5E" />
        )}
      </svg>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        <label className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <div className="flex justify-between mb-1">
            <span>Otish burchagi</span>
            <span className="font-mono text-white font-bold">{angle}°</span>
          </div>
          <input
            type="range"
            min="15"
            max="75"
            value={angle}
            onChange={(e) => setAngle(Number(e.target.value))}
            className="w-full accent-orange-400"
          />
        </label>
        <label className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <div className="flex justify-between mb-1">
            <span>Boshlang‘ich tezlik</span>
            <span className="font-mono text-white font-bold">{velocity} m/s</span>
          </div>
          <input
            type="range"
            min="25"
            max="65"
            value={velocity}
            onChange={(e) => setVelocity(Number(e.target.value))}
            className="w-full accent-orange-400"
          />
        </label>
      </div>

      <p className="text-xs text-slate-300 text-center">{status}</p>
      <button
        onClick={fire}
        className="px-6 py-3 rounded-xl bg-orange-500 text-slate-950 font-bold text-sm hover:bg-orange-400 cursor-pointer"
      >
        Sinab ko‘rish (Uchish: ~{predictedRange}m)
      </button>
    </div>
  );
}

// ======================================================
// 26. STRATEGIYA QIROLLIGI (TACTICAL TERRITORY BATTLE)
// ======================================================
type Owner = 'player' | 'bot' | 'neutral';
interface Cell {
  owner: Owner;
  power: number;
}

export function StrategyKingdomGame({ game, onComplete, onScorePulse, isPaused }: GameEngineProps) {
  const [board, setBoard] = useState<Cell[]>([
    { owner: 'player', power: 8 }, { owner: 'neutral', power: 3 }, { owner: 'neutral', power: 4 },
    { owner: 'neutral', power: 3 }, { owner: 'neutral', power: 5 }, { owner: 'neutral', power: 3 },
    { owner: 'neutral', power: 4 }, { owner: 'neutral', power: 3 }, { owner: 'bot', power: 8 },
  ]);
  const [selected, setSelected] = useState<number | null>(null);
  const [turns, setTurns] = useState(0);
  const [info, setInfo] = useState('O‘z qal’angizni (ko‘k) tanlang va qo‘shni hududga hujum qiling.');
  const [startTime] = useState(() => Date.now());

  const neighbors = (idx: number) => {
    const r = Math.floor(idx / 3);
    const c = idx % 3;
    return [
      r > 0 ? (r - 1) * 3 + c : -1,
      r < 2 ? (r + 1) * 3 + c : -1,
      c > 0 ? r * 3 + (c - 1) : -1,
      c < 2 ? r * 3 + (c + 1) : -1,
    ].filter((x) => x >= 0);
  };

  const handleCell = (idx: number) => {
    if (isPaused) return;
    const cell = board[idx];
    if (selected === null) {
      if (cell.owner === 'player' && cell.power > 1) {
        audioService.playClick();
        setSelected(idx);
      }
      return;
    }
    if (selected === idx) {
      setSelected(null);
      return;
    }
    if (!neighbors(selected).includes(idx)) {
      setInfo('Faqat qo‘shni katakka yurish mumkin!');
      setSelected(null);
      return;
    }

    const next = board.map((c) => ({ ...c }));
    const sendPower = next[selected].power - 1;
    next[selected].power = 1;

    if (next[idx].owner === 'player') {
      next[idx].power += sendPower;
    } else if (sendPower > next[idx].power) {
      next[idx].owner = 'player';
      next[idx].power = sendPower - next[idx].power;
      audioService.playCorrect();
      onScorePulse?.(true);
    } else {
      next[idx].power = Math.max(1, next[idx].power - sendPower);
      audioService.playWrong();
    }

    // Production tick + simple bot move
    next.forEach((c) => {
      if (c.owner !== 'neutral') c.power += 2;
    });

    const botCells = next
      .map((c, i) => ({ c, i }))
      .filter((x) => x.c.owner === 'bot' && x.c.power > 3);
    if (botCells.length > 0) {
      const from = botCells[0];
      const targets = neighbors(from.i).filter((n) => next[n].owner !== 'bot');
      if (targets.length > 0) {
        const tgt = targets[0];
        const atk = from.c.power - 1;
        next[from.i].power = 1;
        if (atk > next[tgt].power) {
          next[tgt].owner = 'bot';
          next[tgt].power = atk - next[tgt].power;
        } else {
          next[tgt].power = Math.max(1, next[tgt].power - atk);
        }
      }
    }

    setBoard(next);
    setSelected(null);
    setTurns((t) => t + 1);

    const botLeft = next.filter((c) => c.owner === 'bot').length;
    const playerCount = next.filter((c) => c.owner === 'player').length;
    if (botLeft === 0 || playerCount >= 7) {
      setTimeout(() => {
        const duration = Math.max(5, Math.round((Date.now() - startTime) / 1000));
        onComplete({
          gameId: game.id,
          score: Math.max(120, 260 - turns * 8),
          correctCount: playerCount,
          incorrectCount: 0,
          durationSeconds: duration,
          accuracy: 92,
          levelReached: 1,
        });
      }, 500);
    }
  };

  return (
    <div className="flex flex-col items-center gap-5 py-2">
      <p className="text-sm text-amber-300 text-center">{info}</p>
      <div className="grid grid-cols-3 gap-3 p-4 rounded-3xl bg-slate-900 border border-slate-700">
        {board.map((cell, idx) => (
          <button
            key={idx}
            onClick={() => handleCell(idx)}
            className={`w-20 h-20 rounded-2xl border-2 flex flex-col items-center justify-center font-mono transition-all cursor-pointer ${
              selected === idx
                ? 'border-amber-400 scale-105'
                : cell.owner === 'player'
                  ? 'bg-sky-500/25 border-sky-400 text-sky-100'
                  : cell.owner === 'bot'
                    ? 'bg-rose-500/25 border-rose-400 text-rose-100'
                    : 'bg-slate-800 border-slate-600 text-slate-300'
            }`}
          >
            <span className="text-xs">
              {cell.owner === 'player' ? 'Siz' : cell.owner === 'bot' ? 'Raqib' : 'Neytral'}
            </span>
            <span className="text-2xl font-bold tabular-nums">{cell.power}</span>
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-400">Har yurishda sizning va raqib qal’alari +2 kuch yig‘adi. 7 ta hududni egallang!</p>
    </div>
  );
}

// ======================================================
// 27. XOTIRA MASTER (4x4 SPATIAL MATRIX)
// ======================================================
export function MemoryMasterGame({ game, onComplete, onScorePulse, isPaused }: GameEngineProps) {
  const [level, setLevel] = useState(1);
  const maxLevels = 4;
  const [targets, setTargets] = useState<number[]>([1, 5, 10, 14]);
  const [phase, setPhase] = useState<'show' | 'guess'>('show');
  const [picked, setPicked] = useState<number[]>([]);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [startTime] = useState(() => Date.now());

  useEffect(() => {
    const count = 3 + level;
    const set = new Set<number>();
    while (set.size < count) set.add(Math.floor(Math.random() * 16));
    setTargets(Array.from(set));
    setPicked([]);
    setPhase('show');
    const t = window.setTimeout(() => setPhase('guess'), 1500);
    return () => window.clearTimeout(t);
  }, [level]);

  const handleCell = (idx: number) => {
    if (isPaused || phase !== 'guess' || picked.includes(idx)) return;
    if (targets.includes(idx)) {
      audioService.playCorrect();
      onScorePulse?.(true);
      const nextPicked = [...picked, idx];
      setPicked(nextPicked);
      if (nextPicked.length >= targets.length) {
        const nextCorrect = correct + 1;
        setCorrect(nextCorrect);
        setTimeout(() => {
          if (level >= maxLevels) {
            const duration = Math.max(5, Math.round((Date.now() - startTime) / 1000));
            onComplete({
              gameId: game.id,
              score: Math.max(100, nextCorrect * 55 - wrong * 10),
              correctCount: nextCorrect,
              incorrectCount: wrong,
              durationSeconds: duration,
              accuracy: Math.round((nextCorrect / (nextCorrect + wrong)) * 100),
              levelReached: maxLevels,
            });
          } else {
            setLevel((l) => l + 1);
          }
        }, 500);
      }
    } else {
      audioService.playWrong();
      onScorePulse?.(false);
      setWrong((w) => w + 1);
    }
  };

  return (
    <div className="flex flex-col items-center gap-5 py-2">
      <div className="text-center">
        <p className="text-sm text-slate-400">Bosqich {level} / {maxLevels} · Kataklar: {targets.length}</p>
        <h3 className="text-xl font-bold text-white mt-1">
          {phase === 'show' ? 'Yongan kataklar o‘rnini eslab qoling!' : 'Endi o‘sha kataklarni belgilang'}
        </h3>
      </div>
      <div className="grid grid-cols-4 gap-2.5 p-3 rounded-2xl bg-slate-900 border border-slate-700">
        {Array.from({ length: 16 }).map((_, idx) => {
          const lit = (phase === 'show' && targets.includes(idx)) || picked.includes(idx);
          return (
            <button
              key={idx}
              onClick={() => handleCell(idx)}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl border transition-all cursor-pointer ${
                lit
                  ? 'bg-violet-500 border-violet-300'
                  : 'bg-slate-800 border-slate-700 hover:border-violet-400'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

// ======================================================
// 28. GEOMETRIK DUNYO (LIVE 3D THREE.JS INSPECTION)
// ======================================================
const GEO_3D_LEVELS: Array<{
  title: string;
  question: string;
  polyType: 'cube_stack' | 'octahedron' | 'dodecahedron';
  blocks: VoxelBlock[];
  ans: string;
  options: string[];
}> = [
  {
    title: '3D Kublar konstruksiyasi',
    question: 'Shaklni aylantirib ko‘ring: unda jami nechta kub bor?',
    polyType: 'cube_stack',
    blocks: [
      { x: 0, y: 0, z: 0, color: 0x38bdf8 },
      { x: 1, y: 0, z: 0, color: 0x38bdf8 },
      { x: 0, y: 0, z: 1, color: 0x38bdf8 },
      { x: 0, y: 1, z: 0, color: 0xfbbf24 },
      { x: 1, y: 1, z: 0, color: 0xfbbf24 },
    ],
    ans: '5',
    options: ['4', '5', '6', '7'],
  },
  {
    title: 'Oktaedr fazoviy tahlili',
    question: 'Ushbu 3D Oktaedr shaklida nechta uchburchak yoq (yuz) mavjud?',
    polyType: 'octahedron',
    blocks: [],
    ans: '8',
    options: ['6', '8', '10', '12'],
  },
  {
    title: 'Ikki qavatli minora',
    question: 'Shaklni har tomondan aylantiring: jami nechta kub ishlatilgan?',
    polyType: 'cube_stack',
    blocks: [
      { x: -1, y: 0, z: 0, color: 0x10b981 },
      { x: 0, y: 0, z: 0, color: 0x10b981 },
      { x: 1, y: 0, z: 0, color: 0x10b981 },
      { x: 0, y: 0, z: 1, color: 0x10b981 },
      { x: 0, y: 1, z: 0, color: 0x38bdf8 },
      { x: 0, y: 2, z: 0, color: 0xfbbf24 },
      { x: 1, y: 1, z: 0, color: 0x38bdf8 },
    ],
    ans: '7',
    options: ['6', '7', '8', '9'],
  },
];

export function Geometric3DWorldGame({ game, onComplete, onScorePulse, isPaused }: GameEngineProps) {
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [startTime] = useState(() => Date.now());
  const lvl = GEO_3D_LEVELS[idx];

  const handleSelect = (opt: string) => {
    if (isPaused) return;
    if (opt === lvl.ans) {
      audioService.playCorrect();
      onScorePulse?.(true);
      const nextCorrect = correct + 1;
      setCorrect(nextCorrect);
      setTimeout(() => {
        if (idx + 1 >= GEO_3D_LEVELS.length) {
          const duration = Math.max(5, Math.round((Date.now() - startTime) / 1000));
          onComplete({
            gameId: game.id,
            score: nextCorrect * 60 - wrong * 10,
            correctCount: nextCorrect,
            incorrectCount: wrong,
            durationSeconds: duration,
            accuracy: Math.round((nextCorrect / (nextCorrect + wrong)) * 100),
            levelReached: GEO_3D_LEVELS.length,
          });
        } else {
          setIdx((i) => i + 1);
        }
      }, 450);
    } else {
      audioService.playWrong();
      onScorePulse?.(false);
      setWrong((w) => w + 1);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 py-2 max-w-lg mx-auto">
      <div className="text-center">
        <p className="text-xs text-sky-300">3D Fazoviy masala {idx + 1} / {GEO_3D_LEVELS.length}</p>
        <h3 className="text-xl font-bold text-white mt-1">{lvl.question}</h3>
      </div>

      <Interactive3DGeometry blocks={lvl.blocks} polyhedronType={lvl.polyType} />
      <p className="text-xs text-slate-400">Sichqoncha yoki barmoq bilan 3D modelni aylantirib tekshiring</p>

      <div className="grid grid-cols-4 gap-3 w-full">
        {lvl.options.map((opt) => (
          <button
            key={opt}
            onClick={() => handleSelect(opt)}
            className="py-3.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-sky-400 text-xl font-bold text-white cursor-pointer"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ======================================================
// 29. SHIFRNI BUZ (INTERACTIVE CAESAR CIPHER WHEEL)
// ======================================================
const CIPHER_WORDS = [
  { plain: 'ALGORITM', shift: 3 },
  { plain: 'GALAKTIKA', shift: 5 },
  { plain: 'MANTIQIY', shift: 4 },
];

function shiftText(text: string, shift: number): string {
  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return text
    .split('')
    .map((ch) => {
      const idx = alpha.indexOf(ch);
      if (idx === -1) return ch;
      return alpha[(idx + shift + 26) % 26];
    })
    .join('');
}

export function CipherBreakerGame({ game, onComplete, onScorePulse, isPaused }: GameEngineProps) {
  const [idx, setIdx] = useState(0);
  const [sliderShift, setSliderShift] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [startTime] = useState(() => Date.now());

  const target = CIPHER_WORDS[idx];
  const encrypted = useMemo(() => shiftText(target.plain, target.shift), [target]);
  const decodedPreview = useMemo(() => shiftText(encrypted, -sliderShift), [encrypted, sliderShift]);

  const checkDecode = () => {
    if (isPaused) return;
    setAttempts((a) => a + 1);
    if (decodedPreview === target.plain) {
      audioService.playCorrect();
      onScorePulse?.(true);
      setTimeout(() => {
        if (idx + 1 >= CIPHER_WORDS.length) {
          const duration = Math.max(5, Math.round((Date.now() - startTime) / 1000));
          onComplete({
            gameId: game.id,
            score: Math.max(100, 220 - attempts * 15),
            correctCount: CIPHER_WORDS.length,
            incorrectCount: Math.max(0, attempts + 1 - CIPHER_WORDS.length),
            durationSeconds: duration,
            accuracy: Math.min(100, Math.round((CIPHER_WORDS.length / Math.max(CIPHER_WORDS.length, attempts + 1)) * 100)),
            levelReached: CIPHER_WORDS.length,
          });
        } else {
          setIdx((i) => i + 1);
          setSliderShift(0);
        }
      }, 500);
    } else {
      audioService.playWrong();
      onScorePulse?.(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-5 py-3 max-w-lg mx-auto">
      <p className="text-sm text-slate-400">Shifr {idx + 1} / {CIPHER_WORDS.length}</p>
      <div className="w-full p-5 rounded-2xl bg-slate-900 border border-teal-500/30 text-center space-y-3">
        <p className="text-xs text-slate-400">Shifrlangan matn:</p>
        <p className="text-2xl font-mono tracking-widest text-rose-300 font-bold">{encrypted}</p>
        <p className="text-xs text-slate-400 pt-2">Deshifrlash ko‘rinishi (Siljish: -{sliderShift}):</p>
        <p className="text-3xl font-mono tracking-widest text-teal-300 font-extrabold">{decodedPreview}</p>
      </div>

      <label className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex justify-between text-xs text-slate-300 mb-2">
          <span>Sezar kaliti siljishini tanlang</span>
          <span className="font-mono font-bold text-teal-300">Kalit: {sliderShift}</span>
        </div>
        <input
          type="range"
          min="0"
          max="12"
          value={sliderShift}
          onChange={(e) => setSliderShift(Number(e.target.value))}
          className="w-full accent-teal-400"
        />
      </label>

      <button
        onClick={checkDecode}
        className="px-6 py-3 rounded-xl bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 cursor-pointer"
      >
        So‘zni tasdiqlash
      </button>
    </div>
  );
}

// ======================================================
// 30. TEZKOR TAFAKKUR (STROOP COGNITIVE AGILITY)
// ======================================================
const STROOP_COLORS = [
  { id: 'red', label: 'QIZIL', hex: '#EF4444' },
  { id: 'blue', label: 'KO‘K', hex: '#3B82F6' },
  { id: 'green', label: 'YASHIL', hex: '#10B981' },
  { id: 'yellow', label: 'SARIQ', hex: '#FACC15' },
];

export function RapidThinkingGame({ game, onComplete, onScorePulse, isPaused }: GameEngineProps) {
  const [timeLeft, setTimeLeft] = useState(28);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [seed, setSeed] = useState(0);
  const doneRef = useRef(false);

  const prompt = useMemo(() => {
    const word = STROOP_COLORS[(seed * 3) % STROOP_COLORS.length];
    const ink = STROOP_COLORS[(seed * 5 + 1) % STROOP_COLORS.length];
    return { wordText: word.label, inkColor: ink };
  }, [seed]);

  useEffect(() => {
    if (isPaused || doneRef.current) return;
    if (timeLeft <= 0) {
      doneRef.current = true;
      onComplete({
        gameId: game.id,
        score: Math.max(30, correct * 28 - wrong * 8),
        correctCount: correct,
        incorrectCount: wrong,
        durationSeconds: 28,
        accuracy: correct + wrong > 0 ? Math.round((correct / (correct + wrong)) * 100) : 100,
        levelReached: Math.max(1, Math.floor(correct / 3) + 1),
      });
      return;
    }
    const t = window.setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [timeLeft, isPaused, correct, wrong, game.id, onComplete]);

  const handlePick = (id: string) => {
    if (isPaused || doneRef.current) return;
    if (id === prompt.inkColor.id) {
      audioService.playCorrect();
      onScorePulse?.(true);
      setCorrect((c) => c + 1);
    } else {
      audioService.playWrong();
      onScorePulse?.(false);
      setWrong((w) => w + 1);
    }
    setSeed((s) => s + 1);
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="flex items-center gap-6 text-sm font-mono tabular-nums">
        <span className="text-rose-400 font-bold">Vaqt: {timeLeft}s</span>
        <span className="text-emerald-400">To‘g‘ri: {correct}</span>
      </div>

      <div className="text-center">
        <p className="text-sm text-slate-300">So‘zni o‘qimang — faqat <span className="font-bold text-white">HARF RANGINI</span> tanlang!</p>
        <div className="mt-4 px-12 py-8 rounded-3xl bg-slate-900 border border-slate-700">
          <span className="text-5xl font-extrabold tracking-wider" style={{ color: prompt.inkColor.hex }}>
            {prompt.wordText}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-lg">
        {STROOP_COLORS.map((c) => (
          <button
            key={c.id}
            onClick={() => handlePick(c.id)}
            className="py-4 rounded-2xl bg-slate-800 border border-slate-600 hover:border-white text-base font-bold text-white cursor-pointer"
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}
