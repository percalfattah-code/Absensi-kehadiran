// Audio Synthesizer & Indonesian Text-To-Speech (TTS) Service
// Built with Web Audio API for rich acoustic feedback + SpeechSynthesis for spoken Indonesian instructions.

class AudioService {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private lastSpokenText: string = '';
  private lastSpokenTime: number = 0;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    this.initAudioContext();
    this.initVoices();
  }

  // Pre-initialize and attach auto-unlock on user interactions
  private initAudioContext() {
    if (typeof window === 'undefined') return;

    const unlockAudio = () => {
      this.unlock();
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };

    window.addEventListener('click', unlockAudio, { passive: true });
    window.addEventListener('touchstart', unlockAudio, { passive: true });
    window.addEventListener('keydown', unlockAudio, { passive: true });
  }

  private initVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const loadVoices = () => {
      try {
        this.voices = window.speechSynthesis.getVoices();
      } catch (e) {
        console.warn('Voice loading error:', e);
      }
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  // Force unlock Web Audio & SpeechSynthesis on any user tap/button click
  public unlock(): void {
    if (typeof window === 'undefined') return;

    // 1. Unlock Web Audio Context
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }

      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      // Play 1-sample silent buffer to unlock iOS & Android audio pipeline
      if (this.audioCtx) {
        const buffer = this.audioCtx.createBuffer(1, 1, 22050);
        const source = this.audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioCtx.destination);
        source.start(0);
      }
    } catch (e) {
      console.warn('AudioContext unlock warning:', e);
    }

    // 2. Unlock SpeechSynthesis
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.resume();
      }
    } catch (e) {
      console.warn('SpeechSynthesis resume warning:', e);
    }
  }

  private getAudioContext(): AudioContext | null {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted) {
      this.stopSpeaking();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // 1. Play Soft Ping / Ding for task updates
  public playPromptDing(): void {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.12);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.36);
    } catch (e) {
      console.warn('Audio playPromptDing error:', e);
    }
  }

  // 2. Play Harmonic Success Chime (C5 -> E5 -> G5 -> C6)
  public playSuccessChime(): void {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const startTime = ctx.currentTime;

      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime + index * 0.09);

        gain.gain.setValueAtTime(0, startTime + index * 0.09);
        gain.gain.linearRampToValueAtTime(0.28, startTime + index * 0.09 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + index * 0.09 + 0.42);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime + index * 0.09);
        osc.stop(startTime + index * 0.09 + 0.45);
      });
    } catch (e) {
      console.warn('Audio playSuccessChime error:', e);
    }
  }

  // 3. Play Warning / Error Buzzer (Two low alert tones)
  public playErrorBuzzer(): void {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const startTime = ctx.currentTime;
      const tones = [220, 175]; // Low alert buzz

      tones.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, startTime + index * 0.15);

        gain.gain.setValueAtTime(0.25, startTime + index * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + index * 0.15 + 0.13);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime + index * 0.15);
        osc.stop(startTime + index * 0.15 + 0.14);
      });
    } catch (e) {
      console.warn('Audio playErrorBuzzer error:', e);
    }
  }

  // 4. Play Camera Shutter Click Sound
  public playCameraShutter(): void {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const startTime = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(900, startTime);
      osc.frequency.exponentialRampToValueAtTime(120, startTime + 0.05);

      gain.gain.setValueAtTime(0.22, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.07);
    } catch (e) {
      console.warn('Audio playCameraShutter error:', e);
    }
  }

  // 5. Play Notification Ding / Announcement Bell
  public playNotificationBell(): void {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const startTime = ctx.currentTime;
      const freqs = [880, 1320]; // A5, E6 bell chime

      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime + i * 0.08);

        gain.gain.setValueAtTime(0, startTime + i * 0.08);
        gain.gain.linearRampToValueAtTime(0.25, startTime + i * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + i * 0.08 + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime + i * 0.08);
        osc.stop(startTime + i * 0.08 + 0.65);
      });
    } catch (e) {
      console.warn('Audio playNotificationBell error:', e);
    }
  }

  // Spoken Indonesian Text-To-Speech (with Android Chrome fix)
  public speak(text: string, force: boolean = false, minIntervalMs: number = 2200): void {
    if (this.isMuted) return;

    this.unlock();

    const now = Date.now();
    if (!force && this.lastSpokenText === text && now - this.lastSpokenTime < minIntervalMs) {
      return;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel(); // Clear any queued utterances

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'id-ID';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Match Indonesian voice if present
        if (this.voices.length === 0) {
          this.voices = window.speechSynthesis.getVoices();
        }

        const indonesianVoice = this.voices.find(
          (v) =>
            v.lang.toLowerCase().includes('id') ||
            v.lang.toLowerCase().includes('ind') ||
            v.name.toLowerCase().includes('indonesia')
        );

        if (indonesianVoice) {
          utterance.voice = indonesianVoice;
        }

        this.lastSpokenText = text;
        this.lastSpokenTime = now;
        this.currentUtterance = utterance;

        // Chrome bug workaround: keep speaking active
        window.speechSynthesis.resume();
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('Speech synthesis speak error:', e);
      }
    }
  }

  public speakIndonesian(text: string): void {
    this.playNotificationBell();
    this.speak(text, true, 1000);
  }

  // Indonesian Voice Prompts with Synchronized Audio Cues
  public speakLookCamera(): void {
    this.playPromptDing();
    this.speak('Posisikan wajah Anda di tengah kamera', false);
  }

  public speakSmile(): void {
    this.playPromptDing();
    this.speak('Silakan tersenyum', false);
  }

  public speakBlink(): void {
    this.playPromptDing();
    this.speak('Silakan berkedip', false);
  }

  public speakFaceMismatch(name?: string): void {
    this.playErrorBuzzer();
    const target = name ? `anggota ${name}` : 'terpilih';
    this.speak(`Peringatan, wajah tidak cocok dengan data ${target}`, true, 3500);
  }

  public speakSuccess(name?: string): void {
    this.playSuccessChime();
    const text = name
      ? `Verifikasi wajah berhasil, terima kasih ${name}`
      : 'Verifikasi wajah berhasil, terima kasih';
    setTimeout(() => {
      this.speak(text, true, 1000);
    }, 300);
  }

  public async requestAudioPermissions(): Promise<boolean> {
    this.unlock();
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Release the microphone stream tracks right after permission is granted
        stream.getTracks().forEach((track) => track.stop());
      }
      this.playSuccessChime();
      this.speak('Izin speaker dan mikrofon berhasil diaktifkan.', true, 500);
      return true;
    } catch (err) {
      console.warn('Microphone permission request error or user dismissed:', err);
      // Even if mic was dismissed, unlock speaker audio context
      this.playPromptDing();
      return false;
    }
  }

  public speakTestAudio(): void {
    this.unlock();
    this.playSuccessChime();
    setTimeout(() => {
      this.speak('Sistem notifikasi suara dan panduan biometrik Karang Taruna aktif dan berfungsi dengan baik.', true);
    }, 400);
  }

  public stopSpeaking(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        console.warn(e);
      }
    }
  }
}

export const audioService = new AudioService();
