
class SoundSystem {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.initialized = false;
        // Pre-calculated major scale ratios for harmonious random chimes
        this.majorScale = [1, 1.125, 1.25, 1.334, 1.5, 1.667, 1.875, 2];
    }

    init() {
        if (this.initialized) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.3; // Gentle master volume
            this.masterGain.connect(this.ctx.destination);
            this.initialized = true;
        } catch (e) {
            console.error("Web Audio API not supported", e);
        }
    }

    ensureContext() {
        if (!this.initialized) this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    get currentTime() {
        return this.ctx ? this.ctx.currentTime : 0;
    }

    // --- HELPER SYNTHS ---

    // Crisp, snappy envelope for UI and quick effects
    playPip(freq, type = 'sine', decay = 0.1) {
        if (!this.ctx) return;
        const t = this.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.5, t + 0.005); // Fast attack
        gain.gain.exponentialRampToValueAtTime(0.001, t + decay);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + decay);
    }

    // Smooth "Magic" Shimmer
    playShimmer(freq, duration) {
        if (!this.ctx) return;
        const t = this.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        // Tremolo for "shimmer"
        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 15; // Fast wobble
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 0.5;

        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.linearRampToValueAtTime(0, t + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        lfo.start(t);
        osc.stop(t + duration);
        lfo.stop(t + duration);
    }

    // --- SFX LIBRARY: Crisp, Clean, Bright ---

    // 1. UI: "Pop" and "Glass"
    playHover() {
        this.ensureContext();
        // Very short, high "tick"
        this.playPip(1200, 'sine', 0.05);
    }

    playClick() {
        this.ensureContext();
        // "Bubble" pop sound
        const t = this.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(800, t + 0.1); // Pitch up slide

        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.1);
    }

    // 2. GAME EVENTS: Magical & Energetic

    playGameStart() {
        this.ensureContext();
        const t = this.currentTime;
        // Bright Ascending Arpeggio (Magic Wand)
        const base = 440;
        const notes = [1, 1.25, 1.5, 2, 2.5, 3]; // Major intervals
        notes.forEach((ratio, i) => {
            setTimeout(() => {
                this.playPip(base * ratio, 'sine', 0.3);
            }, i * 60);
        });
    }

    playCharge() {
        this.ensureContext();
        const t = this.currentTime;
        // Rising "Power" Tone (Clean Sine)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.frequency.setValueAtTime(220, t);
        osc.frequency.exponentialRampToValueAtTime(880, t + 0.5); // Sweet spot range

        gain.gain.setValueAtTime(0.05, t);
        gain.gain.linearRampToValueAtTime(0.2, t + 0.1);
        gain.gain.linearRampToValueAtTime(0, t + 0.5);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.5);
    }

    playShield() {
        this.ensureContext();
        const t = this.currentTime;
        // "Crystal" Ping - Pure and glassy
        this.playPip(2000, 'sine', 0.5); // High ping
        setTimeout(() => this.playPip(2500, 'sine', 0.4), 50); // Harmonc overtone
    }

    playFireball() {
        this.ensureContext();
        const t = this.currentTime;
        // "Whoosh" (Breath of air) - No bass
        const bufferSize = this.ctx.sampleRate * 0.4;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass'; // Remove mud
        filter.frequency.value = 500;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start(t);

        // Add a subtle "snap" at the start
        this.playPip(600, 'triangle', 0.1);
    }

    playBeam() {
        this.ensureContext();
        const t = this.currentTime;
        // Fast "Zapping" sound (Sci-fi)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth'; // Slight bite
        osc.frequency.setValueAtTime(1500, t);
        osc.frequency.exponentialRampToValueAtTime(200, t + 0.2); // Fast drop

        // Lowpass sweep to soften the edge
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, t);
        filter.frequency.linearRampToValueAtTime(500, t + 0.2);

        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.2);
    }

    playRebound() {
        this.ensureContext();
        const t = this.currentTime;
        // "Rubber Band" Boing
        const osc = this.ctx.createOscillator();
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.linearRampToValueAtTime(600, t + 0.1); // Up
        osc.frequency.linearRampToValueAtTime(400, t + 0.25); // Down

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.25);
    }

    playUltimate() {
        this.ensureContext();
        const t = this.currentTime;
        // Magical Burst (Chime chord + White noise flush)
        const chord = [440, 554, 659, 880];
        chord.forEach((f, i) => {
            // Staggered slightly for "strum" feel
            setTimeout(() => this.playPip(f, 'sine', 0.8), i * 30);
        });

        // "Aura" Noise
        const noise = this.ctx.createBufferSource();
        const bufferSize = this.ctx.sampleRate * 1.0;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1000, t);
        filter.frequency.linearRampToValueAtTime(2000, t + 1); // Rising aura

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.linearRampToValueAtTime(0, t + 1);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start(t);
    }

    playWin() {
        this.ensureContext();
        const t = this.currentTime;
        // Bright "Level Up" Jingle (Fast high arpeggio)
        const notes = [523, 659, 784, 1046, 1318, 1568]; // C Major
        notes.forEach((f, i) => {
            setTimeout(() => {
                this.playPip(f, 'triangle', 0.4);
            }, i * 80);
        });
    }

    playLose() {
        this.ensureContext();
        const t = this.currentTime;
        // Sad "Womp" - Pitch Slide Down
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.frequency.setValueAtTime(300, t);
        osc.frequency.linearRampToValueAtTime(100, t + 0.6);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.6);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.6);
    }

    playClash() {
        this.ensureContext();
        const t = this.currentTime;
        // Short snappy "Crack" - like a whip or spark
        this.playPip(1500, 'square', 0.1);
        // Little noise burst
        const bufferSize = this.ctx.sampleRate * 0.1;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = this.ctx.createGain();

        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

        noise.connect(gain);
        gain.connect(this.masterGain);
        noise.start(t);
    }

    playChat() {
        this.ensureContext();
        // Friendly "Bloop"
        this.playPip(800, 'sine', 0.1);
    }
}

const soundSystem = new SoundSystem();
export default soundSystem;
