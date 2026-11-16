/* Plays the approved recording only. No synthesized sounds or replacement audio. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object') module.exports = api;
  else root.MindLockAudio = api;
})(globalThis, () => {
  'use strict';

  function shouldPlayClockChime(before, after, action) {
    return ['time','phrase'].includes(action) && !before.compartmentOpen && after.compartmentOpen &&
      after.repaired && after.hour === 9 && after.minute === 0;
  }

  class ClockAudio {
    constructor({enabled = false, AudioClass = globalThis.Audio,
      schedule = globalThis.requestAnimationFrame?.bind(globalThis),
      now = () => performance.now(), onStatus = () => {}} = {}) {
      this.enabled = enabled;
      this.AudioClass = AudioClass;
      this.schedule = schedule;
      this.now = now;
      this.onStatus = onStatus;
      this.handled = false;
      this.active = new Set();
    }

    setEnabled(enabled) {
      this.enabled = Boolean(enabled);
      // Muting never pauses, seeks or restarts an in-flight recording.
      for (const clip of this.active) clip.muted = !this.enabled;
    }

    resetInvestigation() {
      this.handled = false;
      // A recording already playing is allowed to finish naturally.
    }

    clockSolved() {
      if (this.handled) return false;
      this.handled = true;
      if (!this.enabled) { this.onStatus('muted'); return false; }
      const clip = new this.AudioClass('assets/Clock_Chime.m4a');
      clip.loop = false;
      clip.preload = 'auto';
      clip.muted = false;
      clip.volume = this.schedule ? 0 : 0.45;
      this.active.add(clip);
      let finished = false;
      const fail = error => {
        if (finished) return;
        finished = true;
        this.active.delete(clip);
        this.onStatus('error', error || clip.error);
      };
      clip.addEventListener('error', () => fail(clip.error), {once:true});
      clip.addEventListener('ended', () => {
        if (finished) return;
        finished = true;
        this.active.delete(clip);
        this.onStatus('ended');
      }, {once:true});
      // Start on the successful user gesture, without waiting for render or metadata.
      try {
        Promise.resolve(clip.play()).then(() => {
          if (finished) return;
          this.onStatus('playing');
          if (!this.schedule) return;
          const start = this.now();
          const fade = () => {
            if (finished) return;
            const progress = Math.min(1, Math.max(0, (this.now() - start) / 220));
            clip.volume = 0.45 * progress;
            if (progress < 1) this.schedule(fade);
          };
          this.schedule(fade);
        }).catch(fail);
      } catch (error) { fail(error); }
      return true;
    }
  }
  return {ClockAudio, shouldPlayClockChime};
});

