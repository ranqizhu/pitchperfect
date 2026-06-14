// audio.js — real sampled grand piano via Tone.js + the Salamander Grand
// samples (bundled locally in samples/piano/, so it works fully offline).
//
// Pitch is exact: Tone.Sampler maps each note to the nearest recorded sample
// (every minor third, A0–C8) and pitch-shifts to fill the gaps, anchored to
// A4 = 440 Hz. The public API (resume/playChord/playNote/reward/sparkle/
// combo/fanfare) is unchanged, so the rest of the app needs no edits.

const piano = (() => {
  // Note -> sample filename (Salamander set: one per minor third).
  const URLS = {
    A0: "A0.mp3", C1: "C1.mp3", "D#1": "Ds1.mp3", "F#1": "Fs1.mp3",
    A1: "A1.mp3", C2: "C2.mp3", "D#2": "Ds2.mp3", "F#2": "Fs2.mp3",
    A2: "A2.mp3", C3: "C3.mp3", "D#3": "Ds3.mp3", "F#3": "Fs3.mp3",
    A3: "A3.mp3", C4: "C4.mp3", "D#4": "Ds4.mp3", "F#4": "Fs4.mp3",
    A4: "A4.mp3", C5: "C5.mp3", "D#5": "Ds5.mp3", "F#5": "Fs5.mp3",
    A5: "A5.mp3", C6: "C6.mp3", "D#6": "Ds6.mp3", "F#6": "Fs6.mp3",
    A6: "A6.mp3", C7: "C7.mp3", "D#7": "Ds7.mp3", "F#7": "Fs7.mp3",
    A7: "A7.mp3", C8: "C8.mp3",
  };

  let sampler = null, started = false, ready = false, silentEl = null;
  const nn = (l, o) => l + o;                 // [letter, octave] -> "C#4"
  const now = () => Tone.now();
  // Audio output latency (ms) — large on iPad Safari, tiny on desktop. We add
  // it so the spoken color name lands AFTER the actually-heard chord.
  function outLatencyMs() {
    try { const c = Tone.getContext().rawContext; return ((c.outputLatency || 0) + (c.baseLatency || 0)) * 1000; }
    catch { return 0; }
  }

  // --- iOS mute-switch bypass (a silent looping <audio> flips the audio
  // session to "playback" so Web Audio isn't silenced by the ring switch). ---
  function silentWavUrl(seconds = 0.5, sr = 8000) {
    const n = Math.floor(seconds * sr), buf = new ArrayBuffer(44 + n), v = new DataView(buf);
    const str = (off, s) => { for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i)); };
    str(0, "RIFF"); v.setUint32(4, 36 + n, true); str(8, "WAVE"); str(12, "fmt ");
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, sr, true); v.setUint32(28, sr, true); v.setUint16(32, 1, true);
    v.setUint16(34, 8, true); str(36, "data"); v.setUint32(40, n, true);
    for (let i = 0; i < n; i++) v.setUint8(44 + i, 128);
    return URL.createObjectURL(new Blob([buf], { type: "audio/wav" }));
  }
  function bypassMuteSwitch() {
    if (silentEl) return;
    try {
      silentEl = new Audio(silentWavUrl());
      silentEl.loop = true; silentEl.volume = 0.001;
      silentEl.setAttribute("playsinline", "");
      silentEl.play().catch(() => {});
    } catch { /* ignore */ }
  }

  // Must be called from a user gesture.
  async function resume() {
    if (!started) {
      started = true;
      await Tone.start();              // unlock audio within the gesture
      bypassMuteSwitch();

      // Output polish: a touch of reverb for a natural room, then a loud-but-
      // clean ceiling. Volume in dB drives perceived loudness.
      const vol = new Tone.Volume(1);
      // Short, light reverb — long convolution tails are costly on tablets.
      const reverb = new Tone.Reverb({ decay: 1.0, preDelay: 0.01, wet: 0.12 });
      const limiter = new Tone.Limiter(-1);

      sampler = new Tone.Sampler({ urls: URLS, baseUrl: "samples/piano/", release: 1.1 });
      sampler.chain(vol, reverb, limiter, Tone.getDestination());

      try { await Tone.loaded(); } catch { /* a sample failed; play what loaded */ }
      ready = true;
    } else if (Tone.getContext().state !== "running") {
      await Tone.getContext().resume();
    }
  }

  // ---- playback (same API as the old synth) ----

  // Play a chord. Arpeggiate: notes low->high, THEN a block chord. Returns ms
  // (from now) until the block chord sounds, so callers can time the spoken word.
  function playChord(notes, dur = 1.8, arpeggiate = false) {
    if (!ready) return 0;
    const t = now() + 0.03;
    if (!arpeggiate) {
      // Lower per-note velocity so a 3-note chord stays under the limiter
      // (avoids the sudden volume "pump" when all three sound together).
      notes.forEach(([l, o]) => sampler.triggerAttackRelease(nn(l, o), dur, t, 0.7));
      return 0;
    }
    const gap = 0.26;
    notes.forEach(([l, o], i) => sampler.triggerAttackRelease(nn(l, o), 0.5, t + i * gap, 0.72));
    const blockAt = t + notes.length * gap + 0.15;
    notes.forEach(([l, o]) => sampler.triggerAttackRelease(nn(l, o), dur, blockAt, 0.7));
    return Math.max(0, (blockAt - now()) * 1000 + 280 + outLatencyMs());
  }

  function playNote(letter, octave, dur = 1.6) {
    if (ready) sampler.triggerAttackRelease(nn(letter, octave), dur, now() + 0.03, 0.85);
  }

  function seq(events) {            // events: [[note, dur, offset, vel], ...]
    if (!ready) return;
    const t = now() + 0.02;
    events.forEach(([note, dur, off, vel]) => sampler.triggerAttackRelease(note, dur, t + off, vel));
  }

  function reward() {
    seq([["C5", 0.5, 0, 0.7], ["E5", 0.5, 0.09, 0.7], ["G5", 0.5, 0.18, 0.7], ["C6", 0.5, 0.27, 0.7]]);
  }
  function sparkle() {
    seq([["G5", 0.35, 0, 0.5], ["C6", 0.35, 0.05, 0.5], ["E6", 0.35, 0.1, 0.5], ["G6", 0.35, 0.15, 0.5]]);
  }
  function combo(n) {
    if (!ready) return;
    const base = 60 + Math.min(n, 12) * 2;
    seq([0, 4, 7].map((s, i) => [Tone.Frequency(base + s, "midi").toNote(), 0.4, i * 0.07, 0.65]));
  }
  function fanfare() {
    seq([["C5", 0.9, 0, 0.7], ["E5", 0.9, 0.12, 0.7], ["G5", 0.9, 0.24, 0.7],
         ["C6", 0.9, 0.36, 0.7], ["E6", 0.9, 0.36, 0.7], ["G6", 0.9, 0.52, 0.7]]);
  }

  return { resume, playChord, playNote, reward, sparkle, combo, fanfare };
})();
