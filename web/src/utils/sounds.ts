/**
 * Programmatic vintage camera and bulletin board micro-interaction sounds
 * Powered by Web Audio API (zero dependencies, works completely offline)
 */
class SoundEffects {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Sharp double-tap wood-cork board pin sound
   */
  playPinClick() {
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.05);
      
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.05);

      // Subtle high click to simulate impact point
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1200, now);
      osc2.frequency.exponentialRampToValueAtTime(800, now + 0.015);
      gain2.gain.setValueAtTime(0.08, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now);
      osc2.stop(now + 0.015);
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  }

  /**
   * Retro camera mechanical shutter snap (noise + metallic springs)
   */
  playShutter() {
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      
      // White noise buffer for the shutter click
      const bufferSize = ctx.sampleRate * 0.12; // 0.12s duration
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = buffer;
      
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 1200;
      noiseFilter.Q.value = 2.0;
      
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.35, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      
      noiseNode.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      
      // Metallic spring double-snap oscillators
      const osc1 = ctx.createOscillator();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(900, now);
      osc1.frequency.exponentialRampToValueAtTime(250, now + 0.04);
      
      const gain1 = ctx.createGain();
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      
      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(600, now + 0.03); // Slightly delayed snap
      osc2.frequency.exponentialRampToValueAtTime(150, now + 0.08);
      
      const gain2 = ctx.createGain();
      gain2.gain.setValueAtTime(0.15, now + 0.03);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      
      noiseNode.start(now);
      osc1.start(now);
      osc2.start(now + 0.03);
      
      noiseNode.stop(now + 0.12);
      osc1.stop(now + 0.04);
      osc2.stop(now + 0.08);
    } catch (e) {
      console.warn('Shutter play failed', e);
    }
  }

  /**
   * Rising high-frequency studio capacitor charge sound
   */
  playFlashCharge() {
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      const duration = 1.0;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(3200, now + duration);
      
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.04, now + duration * 0.75);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      console.warn('Flash play failed', e);
    }
  }

  /**
   * Vintage Polaroid mechanical eject whirr
   */
  playEject() {
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      const duration = 0.75;
      
      const osc = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      const gain = ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(98, now);
      osc.frequency.linearRampToValueAtTime(82, now + duration);
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(280, now);
      
      // Modulate frequency rapidly with LFO to generate physical engine hum
      lfo.frequency.setValueAtTime(32, now); 
      lfoGain.gain.setValueAtTime(12, now);
      
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.linearRampToValueAtTime(0.15, now + duration - 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      lfo.start(now);
      osc.start(now);
      lfo.stop(now + duration);
      osc.stop(now + duration);
    } catch (e) {
      console.warn('Eject play failed', e);
    }
  }
}

export const soundEffects = new SoundEffects();
