// Audio Synthesizer & Indonesian Text-To-Speech (TTS) Service

class AudioService {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private lastSpokenText: string = '';
  private lastSpokenTime: number = 0;

  constructor() {
    // Lazy init AudioContext on user interaction
    const initCtx = () => {
      if (!this.audioCtx && typeof window !== 'undefined') {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      window.removeEventListener('click', initCtx);
      window.removeEventListener('touchstart', initCtx);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('click', initCtx, { once: true });
      window.addEventListener('touchstart', initCtx, { once: true });
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

  // Play Harmonic Success Chime (C5 -> E5 -> G5 -> C6)
  public playSuccessChime(): void {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const startTime = ctx.currentTime;

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime + index * 0.09);

      // Smooth attack and decay envelope
      gain.gain.setValueAtTime(0, startTime + index * 0.09);
      gain.gain.linearRampToValueAtTime(0.3, startTime + index * 0.09 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + index * 0.09 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime + index * 0.09);
      osc.stop(startTime + index * 0.09 + 0.45);
    });
  }

  // Play Warning / Error Buzzer (Two low alert tones)
  public playErrorBuzzer(): void {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const startTime = ctx.currentTime;
    const tones = [220, 180]; // Low buzzing frequencies

    tones.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, startTime + index * 0.14);

      gain.gain.setValueAtTime(0.25, startTime + index * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + index * 0.14 + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime + index * 0.14);
      osc.stop(startTime + index * 0.14 + 0.13);
    });
  }

  // Play Camera Shutter Click Sound
  public playCameraShutter(): void {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const startTime = ctx.currentTime;

    // High snap pulse
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, startTime);
    osc.frequency.exponentialRampToValueAtTime(100, startTime + 0.05);

    gain.gain.setValueAtTime(0.2, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.07);
  }

  // Play Notification Ding / Bell
  public playNotificationBell(): void {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

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
  }

  // Indonesian Text-to-Speech (TTS) with Throttle
  public speak(text: string, force: boolean = false, minIntervalMs: number = 2500): void {
    if (this.isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const now = Date.now();
    if (!force && this.lastSpokenText === text && now - this.lastSpokenTime < minIntervalMs) {
      return; // Prevent repeating identical prompt too fast
    }

    try {
      window.speechSynthesis.cancel(); // Stop any pending speech

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Select Indonesian voice if available
      const voices = window.speechSynthesis.getVoices();
      const indonesianVoice = voices.find(
        (v) => v.lang.includes('id') || v.lang.includes('ID') || v.name.toLowerCase().includes('indonesia')
      );
      if (indonesianVoice) {
        utterance.voice = indonesianVoice;
      }

      this.lastSpokenText = text;
      this.lastSpokenTime = now;

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }

  // Predefined Indonesian Voice Prompts
  public speakLookCamera(): void {
    this.speak('Posisikan wajah Anda di tengah lingkaran kamera');
  }

  public speakSmile(): void {
    this.speak('Silakan tersenyum');
  }

  public speakBlink(): void {
    this.speak('Silakan berkedip');
  }

  public speakFaceMismatch(name?: string): void {
    const target = name ? `milik ${name}` : 'terpilih';
    this.playErrorBuzzer();
    this.speak(`Peringatan, wajah tidak sesuai dengan data anggota ${target}`, true, 4000);
  }

  public speakSuccess(name?: string): void {
    this.playSuccessChime();
    const text = name ? `Verifikasi wajah berhasil, terima kasih ${name}` : 'Verifikasi wajah berhasil, terima kasih';
    setTimeout(() => {
      this.speak(text, true, 1000);
    }, 250);
  }

  public stopSpeaking(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const audioService = new AudioService();
