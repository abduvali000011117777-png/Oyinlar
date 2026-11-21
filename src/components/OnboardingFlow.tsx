import { FormEvent, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { AGE_GROUPS } from '../data/gamesCatalog';
import { audioService } from '../services/audioService';
import ArenaScene3D from '../three/ArenaScene3D';
import { AgeGroupId } from '../types/platform';

interface OnboardingFlowProps {
  onComplete: (name: string, ageGroup: AgeGroupId) => void;
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<'age' | 'name' | 'welcome'>('age');
  const [selectedAge, setSelectedAge] = useState<AgeGroupId | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSelectAge = (id: AgeGroupId) => {
    audioService.playClick();
    setSelectedAge(id);
  };

  const handleContinueToName = () => {
    if (!selectedAge) return;
    audioService.playClick();
    setStep('name');
  };

  const handleSubmitName = (e: FormEvent) => {
    e.preventDefault();
    const cleaned = name.trim();
    if (cleaned.length < 2) {
      audioService.playWrong();
      setError('Iltimos, kamida 2 ta harfdan iborat ismingizni kiriting.');
      return;
    }
    if (!selectedAge) return;
    setError('');
    audioService.playVictory();
    setStep('welcome');
    window.setTimeout(() => {
      onComplete(cleaned, selectedAge);
    }, 1800);
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#080D1A] text-slate-100 flex flex-col justify-center">
      {/* 3D Interactive World Background */}
      <div className="fixed inset-0 z-0 opacity-55">
        <ArenaScene3D ageGroup={selectedAge ?? '10-15'} className="w-full h-full" />
      </div>

      {/* Subtle radial readability scrim */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 35%, rgba(8, 13, 26, 0.35) 0%, rgba(8, 13, 26, 0.88) 78%)',
        }}
      />

      <main className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-8 py-10">
        <AnimatePresence mode="wait">
          {step === 'age' && (
            <motion.section
              key="step-age"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="max-w-3xl mx-auto text-center space-y-3">
                <p className="text-sm font-semibold tracking-wide text-amber-400">
                  AQL ARENA · 3D Ta’limiy Platforma
                </p>
                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white [text-wrap:balance]">
                  Xush kelibsiz, AQL ARENA ga!
                </h1>
                <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                  Bilimingizni sinang, aqlingizni charxlang va yangi rekordlar o‘rnating!
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between max-w-5xl mx-auto">
                  <h2 className="text-lg font-bold text-white">
                    1-qadam: Yosh toifangizni tanlang
                  </h2>
                  <span className="text-xs text-slate-400">40 ta original o‘yin · 4 dunyo</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
                  {AGE_GROUPS.map((group) => {
                    const active = selectedAge === group.id;
                    return (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => handleSelectAge(group.id)}
                        className={`group text-left rounded-2xl overflow-hidden border transition-all duration-200 cursor-pointer flex flex-col bg-[#0E1629]/95 ${
                          active
                            ? 'border-amber-400 -translate-y-1.5 shadow-xl shadow-amber-500/15'
                            : 'border-slate-700/80 hover:border-slate-500 hover:-translate-y-1'
                        }`}
                      >
                        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-900">
                          <img
                            src={group.imageUrl}
                            alt={`${group.label} — ${group.title}`}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0E1629] via-transparent to-transparent" />
                          {active && (
                            <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
                              <Check className="w-4 h-4 stroke-[3]" />
                            </div>
                          )}
                        </div>

                        <div className="p-4 flex-1 flex flex-col justify-between gap-2">
                          <div>
                            <p
                              className="text-xs font-bold tracking-wide"
                              style={{ color: group.accentHex }}
                            >
                              {group.label}
                            </p>
                            <h3 className="text-lg font-bold text-white mt-0.5">{group.title}</h3>
                            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                              {group.subtitle}
                            </p>
                          </div>
                          <p className="text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                            10 ta maxsus o‘yin
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  disabled={!selectedAge}
                  onClick={handleContinueToName}
                  className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-base hover:bg-amber-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>Davom etish</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.section>
          )}

          {step === 'name' && (
            <motion.section
              key="step-name"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
              className="max-w-md mx-auto bg-[#0E1629]/95 border border-slate-700/80 rounded-3xl p-7 sm:p-9 space-y-6 shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setStep('age')}
                className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Yosh toifasini o‘zgartirish</span>
              </button>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-amber-400">
                  2-qadam · Tanlangan toifa: {selectedAge} yosh
                </p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Ismingiz nima?</h2>
                <p className="text-sm text-slate-300">
                  Natijalaringiz va shaxsiy tavsiyalarni saqlash uchun ismingizni kiriting.
                </p>
              </div>

              <form onSubmit={handleSubmitName} className="space-y-4">
                <div>
                  <label htmlFor="username-input" className="sr-only">
                    Ismingiz
                  </label>
                  <input
                    id="username-input"
                    type="text"
                    autoFocus
                    maxLength={24}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Ismingizni kiriting..."
                    className="w-full px-4 py-3.5 rounded-xl bg-slate-900 border border-slate-600 focus:border-amber-400 focus:outline-none text-white placeholder:text-slate-500 text-base"
                  />
                  {error && <p className="text-xs text-rose-400 mt-2">{error}</p>}
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-xl bg-amber-400 text-slate-950 font-bold text-base hover:bg-amber-300 transition-colors cursor-pointer"
                >
                  Boshlash
                </button>
              </form>
            </motion.section>
          )}

          {step === 'welcome' && (
            <motion.section
              key="step-welcome"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
              className="max-w-xl mx-auto text-center bg-[#0E1629]/95 border border-amber-400/50 rounded-3xl p-10 space-y-4 shadow-2xl"
            >
              <p className="text-sm font-semibold text-amber-400">Tayyorlanmoqda...</p>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white [text-wrap:balance]">
                Salom, {name.trim()}! AQL ARENA ga xush kelibsiz!
              </h2>
              <p className="text-sm text-slate-300">
                Sizning shaxsiy 3D o‘yin maydonchangiz ochilmoqda...
              </p>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
