import { AudioSettings } from '../types/platform';

class AudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicTimer: number | null = null;
  private musicStep = 0;
  private settings: AudioSettings = {
    soundEnabled: true,
    musicEnabled: false,
    voiceEnabled: true,
    volume: 0.65,
  };

  public configure(settings: AudioSettings) {
    const wasMusic = this.settings.musicEnabled;
    this.settings = { ...settings };
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(settings.volume, this.ctx.currentTime, 0.05);
    }
    if (settings.musicEnabled && !wasMusic) {
      this.startBackgroundMusic();
    } else if (!settings.musicEnabled && wasMusic) {
      this.stopBackgroundMusic();
    }
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.settings.volume;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainLevel = 0.22,
    delay = 0,
    endFreq?: number
  ) {
    if (!this.settings.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainLevel, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playClick() {
    this.playTone(540, 0.06, 'triangle', 0.12, 0, 420);
  }

  public playCorrect() {
    this.playTone(523.25, 0.14, 'triangle', 0.2, 0);
    this.playTone(659.25, 0.18, 'triangle', 0.2, 0.08);
    this.playTone(783.99, 0.22, 'sine', 0.18, 0.16);
  }

  public playWrong() {
    this.playTone(210, 0.18, 'sawtooth', 0.1, 0, 145);
    this.playTone(165, 0.22, 'triangle', 0.12, 0.09, 120);
  }

  public playVictory() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.28, 'triangle', 0.2, idx * 0.1);
    });
  }

  public playCrystal(index: number) {
    const scale = [392.0, 493.88, 587.33, 783.99, 880.0, 987.77];
    const freq = scale[index % scale.length];
    this.playTone(freq, 0.28, 'sine', 0.24, 0);
  }

  public playAnimalCall(animalId: string) {
    if (!this.settings.soundEnabled) return;
    switch (animalId) {
      case 'cat':
        this.playTone(620, 0.22, 'sine', 0.2, 0, 820);
        this.playTone(800, 0.3, 'sine', 0.18, 0.22, 480);
        break;
      case 'dog':
        this.playTone(220, 0.1, 'sawtooth', 0.16, 0, 150);
        this.playTone(240, 0.12, 'sawtooth', 0.16, 0.16, 140);
        break;
      case 'cow':
        this.playTone(145, 0.55, 'sawtooth', 0.14, 0, 118);
        break;
      case 'rooster':
        this.playTone(660, 0.12, 'triangle', 0.2, 0, 740);
        this.playTone(880, 0.14, 'triangle', 0.2, 0.14, 980);
        this.playTone(1040, 0.32, 'triangle', 0.2, 0.3, 720);
        break;
      case 'frog':
        this.playTone(180, 0.1, 'square', 0.1, 0, 260);
        this.playTone(195, 0.12, 'square', 0.1, 0.18, 290);
        break;
      default: // sheep
        this.playTone(320, 0.18, 'triangle', 0.18, 0, 340);
        this.playTone(310, 0.22, 'triangle', 0.18, 0.2, 290);
        break;
    }
  }

  public startBackgroundMusic() {
    if (this.musicTimer !== null || !this.settings.musicEnabled) return;
    const pentatonic = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 392.0, 329.63];
    this.musicTimer = window.setInterval(() => {
      if (!this.settings.musicEnabled || !this.settings.soundEnabled) return;
      const ctx = this.ensureContext();
      if (!ctx || !this.masterGain) return;
      const freq = pentatonic[this.musicStep % pentatonic.length];
      this.musicStep += 1;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.045, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.75);
    }, 850);
  }

  public stopBackgroundMusic() {
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  public speakUzbek(text: string) {
    if (!this.settings.voiceEnabled || !this.settings.soundEnabled) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const uzVoice = voices.find((v) => v.lang.toLowerCase().startsWith('uz'));
      const trVoice = voices.find((v) => v.lang.toLowerCase().startsWith('tr'));
      if (uzVoice) {
        utter.voice = uzVoice;
        utter.lang = uzVoice.lang;
      } else if (trVoice) {
        utter.voice = trVoice;
        utter.lang = trVoice.lang;
      } else {
        utter.lang = 'uz-UZ';
      }
      utter.volume = Math.min(1, this.settings.volume);
      utter.rate = 0.94;
      window.speechSynthesis.speak(utter);
    } catch {
      // Speech synthesis optional fallback
    }
  }
}

export const audioService = new AudioService();
