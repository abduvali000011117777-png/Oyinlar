import { useEffect, useMemo, useState } from 'react';
import { audioService } from '../services/audioService';
import { GameEngineProps } from '../types/platform';

// ======================================================
// 31. GRANDMASTER LOGIC
// ======================================================
const GRANDMASTER_PUZZLES = [
  {
    premise:
      'Olimpiadada 3 nafar ishtirokchi bor: Ritsarlar (faqat rost gapiradi) va Yolg‘onchilar (faqat yolg‘on gapiradi). A: "Bimiz uchalamiz ham yolg‘onchimiz." B: "Faqat bittamiz ritsarmiz."',
    question: 'B kim?',
    ans: 'Ritsar',
    options: ['Ritsar', 'Yolg‘onchi', 'Aniqlab bo‘lmaydi'],
  },
  {
    premise:
      'Barcha A lar B dir. Ba’zi B lar C dir. Hech bir C D emas. Bundan qaysi xulosa ALBATTA kelib chiqadi?',
    question: 'To‘g‘ri mantiqiy xulosani tanlang:',
    ans: 'Hech bir D C emas',
    options: ['Barcha A lar C dir', 'Hech bir D C emas', 'Hech bir A D emas'],
  },
  {
    premise:
      'To‘rt nafar dasturchi (Sardor, Dilshod, Kamola, Nargiza) bir qatorda o‘tiribdi. Sardor chekkada emas. Kamola Dilshoddan o‘ngda. Nargiza eng chapda.',
    question: 'Eng o‘ngda kim o‘tiribdi?',
    ans: 'Kamola',
    options: ['Sardor', 'Dilshod', 'Kamola', 'Nargiza'],
  },
];

export function GrandmasterLogicGame({ game, onComplete, onScorePulse, isPaused }: GameEngineProps) {
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [startTime] = useState(() => Date.now());
  const p = GRANDMASTER_PUZZLES[idx];

  const handleSelect = (opt: string) => {
    if (isPaused) return;
    if (opt === p.ans) {
      audioService.playCorrect();
      onScorePulse?.(true);
      const nextCorrect = correct + 1;
      setCorrect(nextCorrect);
      setTimeout(() => {
        if (idx + 1 >= GRANDMASTER_PUZZLES.length) {
          const duration = Math.max(5, Math.round((Date.now() - startTime) / 1000));
          onComplete({
            gameId: game.id,
            score: nextCorrect * 70 - wrong * 15,
            correctCount: nextCorrect,
            incorrectCount: wrong,
            durationSeconds: duration,
            accuracy: Math.round((nextCorrect / (nextCorrect + wrong)) * 100),
            levelReached: GRANDMASTER_PUZZLES.length,
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
    <div className="flex flex-col items-center gap-5 py-3 max-w-xl mx-auto">
      <p className="text-xs text-amber-300 font-mono">Bosqich {idx + 1} / {GRANDMASTER_PUZZLES.length}</p>
      <div className="w-full p-6 rounded-2xl bg-slate-900 border border-amber-500/30 space-y-3">
        <p className="text-sm sm:text-base text-slate-200 leading-relaxed">{p.premise}</p>
        <p className="text-lg font-bold text-white">{p.question}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
        {p.options.map((opt) => (
          <button
            key={opt}
            onClick={() => handleSelect(opt)}
            className="p-4 rounded-xl bg-slate-800 border border-slate-700 hover:border-amber-400 text-sm font-bold text-white cursor-pointer"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ======================================================
// 32. IQ CHALLENGE PRO (XOR & BIT-PATTERN MATRIX)
// ======================================================
function BitGrid({ bits }: { bits: number[] }) {
  return (
    <div className="grid grid-cols-3 gap-1 p-2 rounded-xl bg-slate-950 border border-slate-700 w-20 h-20">
      {bits.map((b, i) => (
        <div key={i} className={`rounded-sm ${b ? 'bg-sky-400' : 'bg-slate-800'}`} />
      ))}
    </div>
  );
}

export function IqChallengeProGame({ game, onComplete, onScorePulse, isPaused }: GameEngineProps) {
  const levels = [
    {
      title: 'XOR qoidasi: 1-ustun va 2-ustun bir xil bo‘lsa 0, har xil bo‘lsa 1 (3-ustun)',
      rows: [
        [
          [1, 0, 1, 0, 1, 0, 1, 0, 0],
          [1, 1, 0, 0, 1, 1, 0, 0, 0],
          [0, 1, 1, 0, 0, 1, 1, 0, 0],
        ],
        [
          [0, 1, 0, 1, 0, 1, 0, 1, 0],
          [0, 1, 1, 0, 0, 1, 1, 1, 0],
          [0, 0, 1, 1, 0, 0, 1, 0, 0],
        ],
        [
          [1, 1, 0, 1, 0, 0, 0, 1, 1],
          [1, 0, 1, 1, 1, 0, 0, 0, 1],
          null,
        ],
      ],
      ansIdx: 1,
      options: [
        [0, 1, 1, 0, 0, 0, 0, 1, 0],
        [0, 1, 1, 0, 1, 0, 0, 1, 0],
        [1, 1, 1, 0, 1, 0, 0, 1, 1],
        [0, 0, 1, 1, 1, 0, 0, 1, 0],
      ],
    },
    {
      title: 'AND qoidasi: Ikkala katakda ham yongan nuqtalar 3-katakda qoladi',
      rows: [
        [
          [1, 1, 1, 0, 1, 0, 0, 0, 0],
          [1, 0, 1, 1, 1, 0, 0, 1, 0],
          [1, 0, 1, 0, 1, 0, 0, 0, 0],
        ],
        [
          [0, 1, 0, 1, 1, 1, 0, 1, 0],
          [1, 1, 0, 0, 1, 0, 1, 1, 0],
          [0, 1, 0, 0, 1, 0, 0, 1, 0],
        ],
        [
          [1, 0, 1, 1, 0, 1, 1, 1, 0],
          [1, 1, 0, 1, 0, 1, 0, 1, 1],
          null,
        ],
      ],
      ansIdx: 2,
      options: [
        [1, 1, 1, 1, 0, 1, 1, 1, 1],
        [1, 0, 0, 1, 0, 0, 0, 1, 0],
        [1, 0, 0, 1, 0, 1, 0, 1, 0],
        [0, 0, 1, 1, 0, 1, 0, 1, 0],
      ],
    },
  ];

  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [startTime] = useState(() => Date.now());
  const lvl = levels[idx];

  const handlePick = (optIdx: number) => {
    if (isPaused) return;
    if (optIdx === lvl.ansIdx) {
      audioService.playCorrect();
      onScorePulse?.(true);
      const nextCorrect = correct + 1;
      setCorrect(nextCorrect);
      setTimeout(() => {
        if (idx + 1 >= levels.length) {
          const duration = Math.max(5, Math.round((Date.now() - startTime) / 1000));
          onComplete({
            gameId: game.id,
            score: nextCorrect * 85 - wrong * 15,
            correctCount: nextCorrect,
            incorrectCount: wrong,
            durationSeconds: duration,
            accuracy: Math.round((nextCorrect / (nextCorrect + wrong)) * 100),
            levelReached: levels.length,
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
        <p className="text-xs text-sky-300">Matritsa {idx + 1} / {levels.length}</p>
        <h3 className="text-base sm:text-lg font-bold text-white mt-1">{lvl.title}</h3>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {lvl.rows.flat().map((cell, i) =>
          cell ? (
            <BitGrid key={i} bits={cell} />
          ) : (
            <div key={i} className="w-20 h-20 rounded-xl border-2 border-dashed border-sky-400 flex items-center justify-center text-2xl font-bold text-sky-300">
              ?
            </div>
          )
        )}
      </div>

      <div className="grid grid-cols-4 gap-3">
        {lvl.options.map((opt, i) => (
          <button key={i} onClick={() => handlePick(i)} className="cursor-pointer hover:scale-105 transition-transform">
            <BitGrid bits={opt} />
          </button>
        ))}
      </div>
    </div>
  );
}

// ======================================================
// 33. STRATEGIK IMPERIYA (RESOURCE & CRISIS ENGINE)
// ======================================================
export function StrategicEmpireGame({ game, onComplete, onScorePulse, isPaused }: GameEngineProps) {
  const [turn, setTurn] = useState(1);
  const maxTurns = 5;
  const [stats, setStats] = useState({ budget: 60, energy: 55, science: 45, stability: 65 });
  const [decisionsMade, setDecisionsMade] = useState(0);
  const [startTime] = useState(() => Date.now());

  const events = [
    {
      title: 'Energiya tarmog‘ini modernizatsiya qilish',
      desc: 'Shaharlarda elektr iste’moli oshdi. Qaysi strategiyani tanlaysiz?',
      choices: [
        { label: 'Quyosh stansiyasi qurish (-15 Budjet, +22 Energiya, +5 Ilm)', delta: { budget: -15, energy: 22, science: 5, stability: 5 } },
        { label: 'Soliqlarni oshirish (+18 Budjet, -10 Barqarorlik)', delta: { budget: 18, energy: -5, science: 0, stability: -10 } },
      ],
    },
    {
      title: 'Xalqaro ilmiy grant dasturi',
      desc: 'Yosh tadqiqotchilar sun’iy intellekt markazi ochishni taklif qilmoqda.',
      choices: [
        { label: 'Markazni moliyalashtirish (-12 Budjet, +25 Ilm, +10 Barqarorlik)', delta: { budget: -12, energy: -5, science: 25, stability: 10 } },
        { label: 'Zaxirani saqlab qolish (+10 Budjet, -5 Ilm)', delta: { budget: 10, energy: 0, science: -5, stability: 0 } },
      ],
    },
    {
      title: 'Savdo yo‘lagi kelishuvi',
      desc: 'Qo‘shni davlatlar bilan logistika hamkorligi taklif etildi.',
      choices: [
        { label: 'Erkin savdo shartnomasi (+22 Budjet, +10 Barqarorlik, -8 Energiya)', delta: { budget: 22, energy: -8, science: 5, stability: 10 } },
        { label: 'Ichki bozorni himoyalash (+8 Barqarorlik, -6 Budjet)', delta: { budget: -6, energy: 5, science: 0, stability: 8 } },
      ],
    },
    {
      title: 'Kiberxavfsizlik yangilanishi',
      desc: 'Raqamli infratuzilmani himoyalash darajasini oshirish zarur.',
      choices: [
        { label: 'Yangi protokol joriy etish (-10 Budjet, +15 Ilm, +12 Barqarorlik)', delta: { budget: -10, energy: 0, science: 15, stability: 12 } },
        { label: 'Minimal tuzatish (-2 Budjet, -5 Barqarorlik)', delta: { budget: -2, energy: 0, science: 0, stability: -5 } },
      ],
    },
    {
      title: 'Yakuniy strategik sarmoya',
      desc: 'Imperiya ravnaqi uchun so‘nggi chorak ustuvor yo‘nalishini tanlang.',
      choices: [
        { label: 'Yashil innovatsiya paketi (+15 Energiya, +15 Ilm, +10 Barqarorlik)', delta: { budget: -10, energy: 15, science: 15, stability: 10 } },
        { label: 'Moliya zaxirasini kengaytirish (+25 Budjet, +5 Barqarorlik)', delta: { budget: 25, energy: 0, science: 0, stability: 5 } },
      ],
    },
  ];

  const ev = events[turn - 1];

  const applyChoice = (delta: { budget: number; energy: number; science: number; stability: number }) => {
    if (isPaused) return;
    audioService.playCorrect();
    onScorePulse?.(true);
    const next = {
      budget: Math.max(0, Math.min(100, stats.budget + delta.budget)),
      energy: Math.max(0, Math.min(100, stats.energy + delta.energy)),
      science: Math.max(0, Math.min(100, stats.science + delta.science)),
      stability: Math.max(0, Math.min(100, stats.stability + delta.stability)),
    };
    setStats(next);
    setDecisionsMade((d) => d + 1);

    if (turn >= maxTurns) {
      const avg = Math.round((next.budget + next.energy + next.science + next.stability) / 4);
      setTimeout(() => {
        const duration = Math.max(5, Math.round((Date.now() - startTime) / 1000));
        onComplete({
          gameId: game.id,
          score: avg * 3,
          correctCount: decisionsMade + 1,
          incorrectCount: 0,
          durationSeconds: duration,
          accuracy: Math.min(100, Math.max(65, avg)),
          levelReached: maxTurns,
        });
      }, 500);
    } else {
      setTurn((t) => t + 1);
    }
  };

  return (
    <div className="flex flex-col items-center gap-5 py-2 max-w-xl mx-auto">
      <div className="grid grid-cols-4 gap-3 w-full">
        {[
          { label: 'Budjet', val: stats.budget, color: 'bg-amber-400' },
          { label: 'Energiya', val: stats.energy, color: 'bg-sky-400' },
          { label: 'Ilm-fan', val: stats.science, color: 'bg-violet-400' },
          { label: 'Barqarorlik', val: stats.stability, color: 'bg-emerald-400' },
        ].map((m) => (
          <div key={m.label} className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>{m.label}</span>
              <span className="font-mono text-white font-bold tabular-nums">{m.val}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <div className={`h-full ${m.color}`} style={{ width: `${m.val}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="w-full p-6 rounded-2xl bg-slate-900 border border-emerald-500/30 space-y-2">
        <p className="text-xs text-emerald-300 font-mono">Chorak {turn} / {maxTurns}</p>
        <h3 className="text-xl font-bold text-white">{ev.title}</h3>
        <p className="text-sm text-slate-300">{ev.desc}</p>
      </div>

      <div className="flex flex-col gap-3 w-full">
        {ev.choices.map((c, i) => (
          <button
            key={i}
            onClick={() => applyChoice(c.delta)}
            className="p-4 rounded-xl bg-slate-800 border border-slate-700 hover:border-emerald-400 text-left text-sm font-semibold text-white cursor-pointer"
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ======================================================
// 34. KRIPTOGRAFIYA USTASI (BINARY XOR & VIGENERE)
// ======================================================
const CRYPTO_TASKS = [
  {
    title: 'Ikkilik XOR operatsiyasi',
    prompt: '1011 XOR 0110 natijasini toping (bir xil bitlar → 0, har xil → 1):',
    ans: '1101',
    options: ['1101', '0010', '1111', '1001'],
  },
  {
    title: 'Vijener shifri (Kalit: +1, +2)',
    prompt: 'So‘zning 1-harfini +1, 2-harfini +2, 3-harfini +1, 4-harfini +2 siljiting. "DATA" → ?',
    ans: 'ECVC',
    options: ['ECVC', 'EBUB', 'FCWD', 'EBUC'],
  },
  {
    title: 'Hexadecimal konvertatsiya',
    prompt: '16 lik sanoq sistemasidagi 0x2F soni 10 lik sistemada nechaga teng?',
    ans: '47',
    options: ['35', '42', '47', '51'],
  },
];

export function CryptoMasterGame({ game, onComplete, onScorePulse, isPaused }: GameEngineProps) {
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [startTime] = useState(() => Date.now());
  const task = CRYPTO_TASKS[idx];

  const handlePick = (opt: string) => {
    if (isPaused) return;
    if (opt === task.ans) {
      audioService.playCorrect();
      onScorePulse?.(true);
      const nextCorrect = correct + 1;
      setCorrect(nextCorrect);
      setTimeout(() => {
        if (idx + 1 >= CRYPTO_TASKS.length) {
          const duration = Math.max(5, Math.round((Date.now() - startTime) / 1000));
          onComplete({
            gameId: game.id,
            score: nextCorrect * 70 - wrong * 15,
            correctCount: nextCorrect,
            incorrectCount: wrong,
            durationSeconds: duration,
            accuracy: Math.round((nextCorrect / (nextCorrect + wrong)) * 100),
            levelReached: CRYPTO_TASKS.length,
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
    <div className="flex flex-col items-center gap-5 py-3 max-w-lg mx-auto">
      <p className="text-xs text-teal-300 font-mono">Kripto-missiya {idx + 1} / {CRYPTO_TASKS.length}</p>
      <div className="w-full p-6 rounded-2xl bg-slate-900 border border-teal-500/30 space-y-2">
        <h3 className="text-lg font-bold text-white">{task.title}</h3>
        <p className="text-sm text-slate-300 font-mono">{task.prompt}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 w-full">
        {task.options.map((opt) => (
          <button
            key={opt}
            onClick={() => handlePick(opt)}
            className="py-4 rounded-xl bg-slate-800 border border-slate-700 hover:border-teal-400 font-mono font-bold text-xl text-white cursor-pointer"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ======================================================
// 35. MATEMATIK GENIUS
// ======================================================
const GENIUS_MATH = [
  { q: 'log₂(64) + log₃(27) = ?', ans: '9', options: ['7', '8', '9', '11'] },
  { q: 'f(x) = 3x² − 4x bo‘lsa, f′(2) hosila qiymati nechaga teng?', ans: '8', options: ['4', '6', '8', '12'] },
  { q: '5 ta turli kitobdan 2 tasini necha xil usulda tanlash mumkin? C(5,2)', ans: '10', options: ['10', '15', '20', '25'] },
  { q: '2¹⁰ mod 7 (2 ning 10-darajasini 7 ga bo‘lgandagi qoldiq)?', ans: '2', options: ['1', '2', '4', '6'] },
];

export function MathGeniusGame({ game, onComplete, onScorePulse, isPaused }: GameEngineProps) {
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [startTime] = useState(() => Date.now());
  const item = GENIUS_MATH[idx];

  const handlePick = (opt: string) => {
    if (isPaused) return;
    if (opt === item.ans) {
      audioService.playCorrect();
      onScorePulse?.(true);
      const nextCorrect = correct + 1;
      setCorrect(nextCorrect);
      setTimeout(() => {
        if (idx + 1 >= GENIUS_MATH.length) {
          const duration = Math.max(5, Math.round((Date.now() - startTime) / 1000));
          onComplete({
            gameId: game.id,
            score: nextCorrect * 65 - wrong * 15,
            correctCount: nextCorrect,
            incorrectCount: wrong,
            durationSeconds: duration,
            accuracy: Math.round((nextCorrect / (nextCorrect + wrong)) * 100),
            levelReached: GENIUS_MATH.length,
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
    <div className="flex flex-col items-center gap-6 py-4 max-w-lg mx-auto">
      <p className="text-xs text-indigo-300 font-mono">Olimpiada masalasi {idx + 1} / {GENIUS_MATH.length}</p>
      <div className="w-full p-7 rounded-2xl bg-slate-900 border border-indigo-500/30 text-center">
        <p className="text-xl sm:text-2xl font-bold font-mono text-white">{item.q}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 w-full">
        {item.options.map((opt) => (
          <button
            key={opt}
            onClick={() => handlePick(opt)}
            className="py-4 rounded-xl bg-slate-800 border border-slate-700 hover:border-indigo-400 font-mono font-bold text-xl text-white cursor-pointer"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ======================================================
// 36. QUANTUM LAB (QUANTUM GATE CIRCUIT BUILDER)
// ======================================================
type QState = '|0⟩' | '|1⟩' | '|+⟩' | '|−⟩';

function applyGate(state: QState, gate: 'X' | 'H' | 'Z'): QState {
  if (gate === 'X') {
    if (state === '|0⟩') return '|1⟩';
    if (state === '|1⟩') return '|0⟩';
    return state;
  }
  if (gate === 'H') {
    if (state === '|0⟩') return '|+⟩';
    if (state === '|1⟩') return '|−⟩';
    if (state === '|+⟩') return '|0⟩';
    return '|1⟩';
  }
  // Z gate
  if (state === '|+⟩') return '|−⟩';
  if (state === '|−⟩') return '|+⟩';
  return state;
}

export function QuantumLabGame({ game, onComplete, onScorePulse, isPaused }: GameEngineProps) {
  const levels: Array<{ initial: QState; target: QState; desc: string }> = [
    { initial: '|0⟩', target: '|+⟩', desc: 'Kubitni 50/50 superpozitsiya holatiga (|+⟩) o‘tkazing.' },
    { initial: '|0⟩', target: '|−⟩', desc: 'Kubitni |0⟩ dan fazasi teskari superpozitsiya |−⟩ holatiga o‘tkazing.' },
    { initial: '|+⟩', target: '|1⟩', desc: 'Superpozitsiya |+⟩ holatini sof |1⟩ holatiga aylantiring.' },
  ];

  const [lvlIdx, setLvlIdx] = useState(0);
  const [gates, setGates] = useState<Array<'X' | 'H' | 'Z'>>([]);
  const [attempts, setAttempts] = useState(0);
  const [startTime] = useState(() => Date.now());

  const lvl = levels[lvlIdx];
  const currentState = useMemo(
    () => gates.reduce<QState>((acc, g) => applyGate(acc, g), lvl.initial),
    [gates, lvl.initial]
  );

  const probOne =
    currentState === '|0⟩' ? 0 : currentState === '|1⟩' ? 100 : 50;

  const verify = () => {
    if (isPaused) return;
    setAttempts((a) => a + 1);
    if (currentState === lvl.target) {
      audioService.playCorrect();
      onScorePulse?.(true);
      setTimeout(() => {
        if (lvlIdx + 1 >= levels.length) {
          const duration = Math.max(5, Math.round((Date.now() - startTime) / 1000));
          onComplete({
            gameId: game.id,
            score: Math.max(120, 260 - attempts * 15),
            correctCount: levels.length,
            incorrectCount: Math.max(0, attempts + 1 - levels.length),
            durationSeconds: duration,
            accuracy: Math.min(100, Math.round((levels.length / Math.max(levels.length, attempts + 1)) * 100)),
            levelReached: levels.length,
          });
        } else {
          setLvlIdx((i) => i + 1);
          setGates([]);
        }
      }, 500);
    } else {
      audioService.playWrong();
      onScorePulse?.(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-5 py-2 max-w-lg mx-auto">
      <div className="text-center">
        <p className="text-xs text-cyan-300 font-mono">Kvant zanjiri {lvlIdx + 1} / {levels.length}</p>
        <h3 className="text-lg font-bold text-white mt-1">{lvl.desc}</h3>
      </div>

      <div className="w-full p-5 rounded-2xl bg-slate-900 border border-cyan-500/30 flex items-center justify-between font-mono">
        <div>
          <span className="text-xs text-slate-400">Kirish:</span>
          <p className="text-2xl font-bold text-white">{lvl.initial}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-center px-3">
          {gates.length === 0 ? (
            <span className="text-xs text-slate-500">Ventillar qo‘shing →</span>
          ) : (
            gates.map((g, i) => (
              <span key={i} className="px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400 text-cyan-200 font-bold">
                {g}
              </span>
            ))
          )}
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400">Joriy / Maqsad:</span>
          <p className="text-2xl font-bold text-amber-300">
            {currentState} → {lvl.target}
          </p>
        </div>
      </div>

      <p className="text-xs text-slate-400 font-mono">|1⟩ o‘lchov ehtimolligi: {probOne}%</p>

      <div className="flex gap-3">
        {(['X', 'H', 'Z'] as const).map((g) => (
          <button
            key={g}
            onClick={() => {
              audioService.playClick();
              setGates((prev) => [...prev.slice(-4), g]);
            }}
            className="px-5 py-3 rounded-xl bg-slate-800 border border-slate-600 hover:border-cyan-400 font-mono font-bold text-white cursor-pointer"
          >
            + {g} ({g === 'X' ? 'Inversiya' : g === 'H' ? 'Hadamard' : 'Faza Z'})
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setGates([])}
          className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm cursor-pointer"
        >
          Tozalash
        </button>
        <button
          onClick={verify}
          className="px-6 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-sm hover:bg-cyan-400 cursor-pointer"
        >
          Holatni tekshirish
        </button>
      </div>
    </div>
  );
}

// ======================================================
// 37. CYBER DETECTIVE (SERVER FORENSICS)
// ======================================================
const CYBER_LOGS = [
  {
    title: 'Ruxsatsiz admin kirishi',
    hint: 'Tungi soat 03:14 da tashqi IP dan admin paneliga muvaffaqiyatli kirish qayd etilgan.',
    logs: [
      { id: '1', text: '10:02:11 | IP 192.168.1.14 | GET /dashboard | 200 OK', malicious: false },
      { id: '2', text: '03:14:52 | IP 45.221.89.11 | POST /api/admin/dump | 200 OK', malicious: true },
      { id: '3', text: '14:22:09 | IP 192.168.1.22 | GET /assets/logo.svg | 200 OK', malicious: false },
    ],
  },
  {
    title: 'SQL Inyeksiya urinishi',
    hint: 'Parametr ichida shubhali mantiqiy operator (`OR 1=1`) mavjud so‘rovni toping.',
    logs: [
      { id: '1', text: 'GET /search?q=matematika | 200 OK | 18ms', malicious: false },
      { id: '2', text: 'POST /login | user=aziz@uz | 200 OK | 44ms', malicious: false },
      { id: '3', text: "GET /users?id=1' OR '1'='1 | 500 ERR | 210ms", malicious: true },
    ],
  },
];

export function CyberDetectiveGame({ game, onComplete, onScorePulse, isPaused }: GameEngineProps) {
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [startTime] = useState(() => Date.now());
  const item = CYBER_LOGS[idx];

  const handleLog = (isBad: boolean) => {
    if (isPaused) return;
    if (isBad) {
      audioService.playCorrect();
      onScorePulse?.(true);
      const nextCorrect = correct + 1;
      setCorrect(nextCorrect);
      setTimeout(() => {
        if (idx + 1 >= CYBER_LOGS.length) {
          const duration = Math.max(5, Math.round((Date.now() - startTime) / 1000));
          onComplete({
            gameId: game.id,
            score: nextCorrect * 80 - wrong * 15,
            correctCount: nextCorrect,
            incorrectCount: wrong,
            durationSeconds: duration,
            accuracy: Math.round((nextCorrect / (nextCorrect + wrong)) * 100),
            levelReached: CYBER_LOGS.length,
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
    <div className="flex flex-col items-center gap-5 py-2 max-w-xl mx-auto">
      <div className="text-center">
        <p className="text-xs text-rose-300 font-mono">Kiber-ekspertiza {idx + 1} / {CYBER_LOGS.length}</p>
        <h3 className="text-xl font-bold text-white mt-1">{item.title}</h3>
        <p className="text-xs text-slate-400 mt-1">{item.hint}</p>
      </div>
      <div className="w-full space-y-3">
        {item.logs.map((l) => (
          <button
            key={l.id}
            onClick={() => handleLog(l.malicious)}
            className="w-full p-4 rounded-xl bg-slate-950 border border-slate-700 hover:border-rose-400 text-left font-mono text-xs sm:text-sm text-slate-200 cursor-pointer transition-colors"
          >
            {l.text}
          </button>
        ))}
      </div>
    </div>
  );
}

// ======================================================
// 38. NEURAL MEMORY (CHIMP TEST)
// ======================================================
export function NeuralMemoryGame({ game, onComplete, onScorePulse, isPaused }: GameEngineProps) {
  const [round, setRound] = useState(1);
  const maxRounds = 3;
  const count = 4 + round; // 5, 6, 7 numbers
  const [positions, setPositions] = useState<Array<{ cell: number; num: number }>>([]);
  const [hidden, setHidden] = useState(false);
  const [nextNum, setNextNum] = useState(1);
  const [wrong, setWrong] = useState(0);
  const [startTime] = useState(() => Date.now());

  useEffect(() => {
    const cells = new Set<number>();
    while (cells.size < count) cells.add(Math.floor(Math.random() * 20));
    const arr = Array.from(cells).map((cell, i) => ({ cell, num: i + 1 }));
    setPositions(arr);
    setHidden(false);
    setNextNum(1);
    const t = window.setTimeout(() => setHidden(true), 1700);
    return () => window.clearTimeout(t);
  }, [round, count]);

  const handleCell = (cellIdx: number) => {
    if (isPaused) return;
    const item = positions.find((p) => p.cell === cellIdx);
    if (!item || item.num < nextNum) return;

    if (!hidden && item.num === 1) {
      setHidden(true);
    }

    if (item.num === nextNum) {
      audioService.playCorrect();
      onScorePulse?.(true);
      if (nextNum === count) {
        setTimeout(() => {
          if (round >= maxRounds) {
            const duration = Math.max(5, Math.round((Date.now() - startTime) / 1000));
            onComplete({
              gameId: game.id,
              score: Math.max(100, round * 65 - wrong * 15),
              correctCount: maxRounds,
              incorrectCount: wrong,
              durationSeconds: duration,
              accuracy: Math.round((maxRounds / (maxRounds + wrong)) * 100),
              levelReached: maxRounds,
            });
          } else {
            setRound((r) => r + 1);
          }
        }, 450);
      } else {
        setNextNum((n) => n + 1);
      }
    } else {
      audioService.playWrong();
      onScorePulse?.(false);
      setWrong((w) => w + 1);
      setHidden(false);
      setNextNum(1);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div className="text-center">
        <p className="text-xs text-violet-300 font-mono">Bosqich {round} / {maxRounds} · Navbatdagi son: {nextNum}</p>
        <h3 className="text-lg font-bold text-white mt-1">
          Sonlar o‘rnini eslab, 1 dan {count} gacha tartibda bosing!
        </h3>
      </div>

      <div className="grid grid-cols-5 gap-2 p-3 rounded-2xl bg-slate-900 border border-slate-700">
        {Array.from({ length: 20 }).map((_, idx) => {
          const item = positions.find((p) => p.cell === idx);
          const solved = item && item.num < nextNum;
          return (
            <button
              key={idx}
              onClick={() => handleCell(idx)}
              disabled={!item || Boolean(solved)}
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl font-mono font-extrabold text-xl flex items-center justify-center transition-all ${
                !item || solved
                  ? 'bg-slate-950/40 border border-slate-800/40 text-transparent'
                  : hidden
                    ? 'bg-violet-500/30 border border-violet-400 text-transparent cursor-pointer'
                    : 'bg-slate-800 border border-violet-400 text-white cursor-pointer'
              }`}
            >
              {item && !solved ? (hidden ? '•' : item.num) : ''}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ======================================================
// 39. BUSINESS SIMULATOR
// ======================================================
export function BusinessSimulatorGame({ game, onComplete, onScorePulse, isPaused }: GameEngineProps) {
  const [quarter, setQuarter] = useState(1);
  const maxQuarters = 4;
  const [cash, setCash] = useState(100);
  const [brand, setBrand] = useState(20);
  const [price, setPrice] = useState(30);
  const [marketing, setMarketing] = useState(20);
  const [rnd, setRnd] = useState(15);
  const [report, setReport] = useState('Narx, marketing va R&D xarajatlarini muvozanatlab chorakni yakunlang.');
  const [startTime] = useState(() => Date.now());

  const runQuarter = () => {
    if (isPaused) return;
    const demand = Math.max(5, Math.round(65 - price * 0.9 + marketing * 0.8 + brand * 0.4));
    const revenue = Math.round((demand * price) / 18);
    const expenses = marketing + rnd + 12;
    const profit = revenue - expenses;
    const nextCash = cash + profit;
    const nextBrand = Math.min(100, brand + Math.round(rnd * 0.35 + marketing * 0.2));

    setCash(nextCash);
    setBrand(nextBrand);
    if (profit >= 0) {
      audioService.playCorrect();
      onScorePulse?.(true);
    } else {
      audioService.playWrong();
      onScorePulse?.(false);
    }
    setReport(`${quarter}-chorak natijasi: Daromad $${revenue}K · Xarajat $${expenses}K · Sof foyda: ${profit >= 0 ? '+' : ''}$${profit}K`);

    if (quarter >= maxQuarters) {
      setTimeout(() => {
        const valuation = Math.max(50, nextCash + nextBrand * 2);
        const duration = Math.max(5, Math.round((Date.now() - startTime) / 1000));
        onComplete({
          gameId: game.id,
          score: valuation,
          correctCount: maxQuarters,
          incorrectCount: profit < 0 ? 1 : 0,
          durationSeconds: duration,
          accuracy: Math.min(100, Math.max(60, Math.round((valuation / 300) * 100))),
          levelReached: maxQuarters,
        });
      }, 800);
    } else {
      setQuarter((q) => q + 1);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 py-2 max-w-lg mx-auto">
      <div className="grid grid-cols-3 gap-3 w-full text-center">
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400">Chorak</span>
          <p className="text-lg font-bold font-mono text-white">{quarter} / {maxQuarters}</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400">Kapital</span>
          <p className="text-lg font-bold font-mono text-emerald-400">${cash}K</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400">Brend kuchi</span>
          <p className="text-lg font-bold font-mono text-amber-400">{brand}%</p>
        </div>
      </div>

      <div className="w-full space-y-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
        <label className="block">
          <div className="flex justify-between mb-1"><span>Mahsulot narxi</span><span className="font-mono text-white">${price}</span></div>
          <input type="range" min="15" max="60" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="w-full accent-amber-400" />
        </label>
        <label className="block">
          <div className="flex justify-between mb-1"><span>Marketing budjeti</span><span className="font-mono text-white">${marketing}K</span></div>
          <input type="range" min="5" max="45" value={marketing} onChange={(e) => setMarketing(Number(e.target.value))} className="w-full accent-amber-400" />
        </label>
        <label className="block">
          <div className="flex justify-between mb-1"><span>R&D (Innovatsiya)</span><span className="font-mono text-white">${rnd}K</span></div>
          <input type="range" min="5" max="40" value={rnd} onChange={(e) => setRnd(Number(e.target.value))} className="w-full accent-amber-400" />
        </label>
      </div>

      <p className="text-xs text-amber-200 text-center">{report}</p>
      <button onClick={runQuarter} className="px-6 py-3 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm hover:bg-amber-400 cursor-pointer">
        {quarter}-chorak hisobotini yopish
      </button>
    </div>
  );
}

// ======================================================
// 40. MIND HACKER (MASTERMIND CODEBREAKER)
// ======================================================
export function MindHackerGame({ game, onComplete, onScorePulse, isPaused }: GameEngineProps) {
  const secret = useMemo(() => {
    const digits = ['1', '2', '3', '4', '5', '6'];
    const picked: string[] = [];
    while (picked.length < 4) {
      const d = digits[Math.floor(Math.random() * digits.length)];
      if (!picked.includes(d)) picked.push(d);
    }
    return picked;
  }, []);

  const [guess, setGuess] = useState<string[]>([]);
  const [history, setHistory] = useState<Array<{ code: string[]; exact: number; partial: number }>>([]);
  const [startTime] = useState(() => Date.now());

  const submitGuess = () => {
    if (isPaused || guess.length !== 4) return;
    let exact = 0;
    let partial = 0;
    guess.forEach((d, i) => {
      if (secret[i] === d) exact++;
      else if (secret.includes(d)) partial++;
    });

    const nextHistory = [{ code: guess, exact, partial }, ...history];
    setHistory(nextHistory);
    setGuess([]);

    if (exact === 4) {
      audioService.playCorrect();
      onScorePulse?.(true);
      setTimeout(() => {
        const duration = Math.max(5, Math.round((Date.now() - startTime) / 1000));
        onComplete({
          gameId: game.id,
          score: Math.max(110, 260 - nextHistory.length * 20),
          correctCount: 4,
          incorrectCount: Math.max(0, nextHistory.length - 1),
          durationSeconds: duration,
          accuracy: Math.max(55, Math.round((1 / nextHistory.length) * 100)),
          levelReached: 1,
        });
      }, 600);
    } else {
      audioService.playClick();
      onScorePulse?.(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 py-2 max-w-md mx-auto">
      <div className="text-center">
        <h3 className="text-xl font-bold text-white">4 xonali maxfiy kodni buzib kiring</h3>
        <p className="text-xs text-slate-400 mt-1">1–6 raqamlari takrorlanmaydi. Yashil = o‘rni to‘g‘ri, Sariq = o‘rni boshqa.</p>
      </div>

      <div className="flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-14 h-14 rounded-xl bg-slate-900 border-2 border-pink-500/40 flex items-center justify-center font-mono text-2xl font-bold text-white"
          >
            {guess[i] ?? '•'}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-6 gap-2 w-full">
        {['1', '2', '3', '4', '5', '6'].map((d) => (
          <button
            key={d}
            disabled={guess.includes(d) || guess.length >= 4}
            onClick={() => {
              audioService.playClick();
              setGuess((g) => [...g, d]);
            }}
            className="py-3 rounded-xl bg-slate-800 border border-slate-700 hover:border-pink-400 font-mono font-bold text-lg text-white disabled:opacity-35 cursor-pointer"
          >
            {d}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <button onClick={() => setGuess([])} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm cursor-pointer">
          Tozalash
        </button>
        <button
          disabled={guess.length !== 4}
          onClick={submitGuess}
          className="px-6 py-2 rounded-xl bg-pink-500 text-white font-bold text-sm hover:bg-pink-400 disabled:opacity-40 cursor-pointer"
        >
          Tekshirish
        </button>
      </div>

      <div className="w-full space-y-2 max-h-40 overflow-y-auto">
        {history.map((h, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 font-mono text-sm">
            <span className="text-white font-bold tracking-widest">{h.code.join(' ')}</span>
            <div className="flex gap-3 text-xs">
              <span className="text-emerald-400">Yashil: {h.exact}</span>
              <span className="text-amber-400">Sariq: {h.partial}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
