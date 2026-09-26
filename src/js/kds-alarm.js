/**
 * Alarma sonora del KDS: suena sin parar hasta que se atiende el pedido
 * que la disparó. 3 tipos de sonido elegibles (preferencia por
 * dispositivo, en localStorage — no es config del negocio).
 */
(function () {
  const STORAGE_KEY = 'lta_kds_sound';
  let audioCtx = null;
  let loopHandle = null;

  function ensureAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function tone(ctx, time, freq, dur, type) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.28, time + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(time);
    osc.stop(time + dur + 0.05);
  }

  const SOUND_PROFILES = {
    chicharra: {
      cycleSec: 0.75,
      play: (ctx, t) => {
        tone(ctx, t, 220, 0.22, 'sawtooth');
        tone(ctx, t + 0.22, 330, 0.22, 'sawtooth');
        tone(ctx, t + 0.44, 175, 0.28, 'sawtooth');
      }
    },
    campana: {
      cycleSec: 1.3,
      play: (ctx, t) => {
        tone(ctx, t, 784, 0.55, 'sine');
        tone(ctx, t + 0.32, 659, 0.55, 'sine');
        tone(ctx, t + 0.64, 523, 0.85, 'sine');
      }
    },
    corneta: {
      cycleSec: 0.95,
      play: (ctx, t) => {
        tone(ctx, t, 233, 0.16, 'sawtooth');
        tone(ctx, t + 0.19, 233, 0.16, 'sawtooth');
        tone(ctx, t + 0.48, 175, 0.35, 'sawtooth');
      }
    }
  };

  function getSelected() {
    return localStorage.getItem(STORAGE_KEY) || 'chicharra';
  }

  function setSelected(name) {
    if (SOUND_PROFILES[name]) localStorage.setItem(STORAGE_KEY, name);
  }

  function start() {
    if (loopHandle) return; // ya sonando
    const ctx = ensureAudio();
    const profile = SOUND_PROFILES[getSelected()];
    const scheduleAhead = () => profile.play(ctx, ctx.currentTime + 0.03);
    scheduleAhead();
    loopHandle = setInterval(scheduleAhead, profile.cycleSec * 1000);
  }

  function stop() {
    if (loopHandle) { clearInterval(loopHandle); loopHandle = null; }
  }

  function isPlaying() {
    return loopHandle !== null;
  }

  function preview(name) {
    const ctx = ensureAudio();
    const profile = SOUND_PROFILES[name];
    if (!profile) return;
    profile.play(ctx, ctx.currentTime + 0.03);
  }

  window.LTA_KDS_ALARM = { start, stop, isPlaying, getSelected, setSelected, preview, SOUNDS: Object.keys(SOUND_PROFILES) };
})();
