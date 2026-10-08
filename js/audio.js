/**
 * DonorPulse Audio & Ringtone Synthesizer (Web Audio API)
 * Generates realistic incoming emergency call ringtones, confirmation chimes,
 * and audio cues without requiring external sound files.
 */

(function() {
  'use strict';

  class AudioManager {
    constructor() {
      this.audioCtx = null;
      this.isRinging = false;
      this.isMuted = false;
      this.ringInterval = null;
      this.activeOscillators = [];
      this.ringCadenceDuration = 1800; // 1.8s ring
      this.ringPauseDuration = 2000;   // 2.0s pause
    }

    getAudioContext() {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      return this.audioCtx;
    }

    /**
     * Start continuous phone ringtone
     * Uses classic dual-frequency telephone supervisory tone (440 Hz + 480 Hz)
     * with pulsating cadence.
     */
    startPhoneRinging(options = {}) {
      if (this.isRinging) return;
      this.isRinging = true;

      const playBurst = () => {
        if (!this.isRinging || this.isMuted) return;
        const ctx = this.getAudioContext();
        if (!ctx) return;

        try {
          const now = ctx.currentTime;
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gainNode = ctx.createGain();

          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(440, now); // 440 Hz tone A

          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(480, now); // 480 Hz tone B

          // Pulsing amplitude modulation (20Hz warble for realistic electronic pager/ringer)
          const warbleOsc = ctx.createOscillator();
          const warbleGain = ctx.createGain();
          warbleOsc.frequency.setValueAtTime(20, now);
          warbleGain.gain.setValueAtTime(0.2, now);
          warbleOsc.connect(gainNode.gain);

          // Envelope: smooth fade-in, sustain, smooth fade-out
          const burstDur = 1.6;
          gainNode.gain.setValueAtTime(0.001, now);
          gainNode.gain.linearRampToValueAtTime(0.22, now + 0.05);
          gainNode.gain.setValueAtTime(0.22, now + burstDur - 0.08);
          gainNode.gain.linearRampToValueAtTime(0.001, now + burstDur);

          osc1.connect(gainNode);
          osc2.connect(gainNode);
          gainNode.connect(ctx.destination);

          osc1.start(now);
          osc2.start(now);
          try { warbleOsc.start(now); } catch(e){}

          osc1.stop(now + burstDur);
          osc2.stop(now + burstDur);
          try { warbleOsc.stop(now + burstDur); } catch(e){}

          this.activeOscillators.push(osc1, osc2, warbleOsc);
        } catch (err) {
          console.warn('Ringtone playback notice:', err);
        }
      };

      // Play immediate first burst
      playBurst();

      // Schedule periodic ring bursts
      const cycleTotal = this.ringCadenceDuration + this.ringPauseDuration;
      this.ringInterval = setInterval(() => {
        if (this.isRinging) {
          playBurst();
        } else {
          clearInterval(this.ringInterval);
        }
      }, cycleTotal);

      // Trigger custom UI event
      window.dispatchEvent(new CustomEvent('donorpulse:ring-start', { detail: options }));
    }

    /**
     * Stop active ringtone
     */
    stopPhoneRinging() {
      this.isRinging = false;
      if (this.ringInterval) {
        clearInterval(this.ringInterval);
        this.ringInterval = null;
      }

      this.activeOscillators.forEach(osc => {
        try { osc.stop(); } catch(e) {}
      });
      this.activeOscillators = [];

      window.dispatchEvent(new CustomEvent('donorpulse:ring-stop'));
    }

    /**
     * Play harmonic confirmation chime (C5 - E5 - G5 - C6)
     */
    playConfirmationChime() {
      const ctx = this.getAudioContext();
      if (!ctx || this.isMuted) return;

      try {
        const now = ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.09);

          gain.gain.setValueAtTime(0.001, now + idx * 0.09);
          gain.gain.linearRampToValueAtTime(0.24, now + idx * 0.09 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.55);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + idx * 0.09);
          osc.stop(now + idx * 0.09 + 0.6);
        });
      } catch (err) {
        console.warn('Confirmation chime notice:', err);
      }
    }

    /**
     * Play decline / cancelled audio cue
     */
    playDeclineTone() {
      const ctx = this.getAudioContext();
      if (!ctx || this.isMuted) return;

      try {
        const now = ctx.currentTime;
        const notes = [392.00, 329.63]; // G4 down to E4

        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.14);

          gain.gain.setValueAtTime(0.18, now + idx * 0.14);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.28);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + idx * 0.14);
          osc.stop(now + idx * 0.14 + 0.3);
        });
      } catch (err) {
        console.warn('Decline tone notice:', err);
      }
    }

    toggleMute() {
      this.isMuted = !this.isMuted;
      if (this.isMuted && this.isRinging) {
        this.activeOscillators.forEach(osc => {
          try { osc.stop(); } catch(e){}
        });
        this.activeOscillators = [];
      }
      return this.isMuted;
    }
  }

  window.PulseAudio = new AudioManager();
})();
