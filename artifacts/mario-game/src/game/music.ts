let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let _muted = false;
let loopHandle: number | null = null;
let isStarted = false;

const BPM = 155;
const BEAT = 60 / BPM;

// [midiNote (-1 = rest), durationInBeats]
const MELODY: [number, number][] = [
  [72, 0.5], [76, 0.5], [79, 0.5], [76, 0.5], [72, 1], [67, 1],
  [69, 0.5], [72, 0.5], [76, 0.5], [72, 0.5], [69, 1], [64, 1],
  [65, 0.5], [69, 0.5], [72, 0.5], [69, 0.5], [65, 1], [60, 1],
  [67, 0.5], [71, 0.5], [74, 0.5], [71, 0.5], [67, 2],
];

const BASS: [number, number][] = [
  [48, 1], [-1, 1], [55, 1], [-1, 1],
  [57, 1], [-1, 1], [52, 1], [-1, 1],
  [53, 1], [-1, 1], [48, 1], [-1, 1],
  [55, 1], [-1, 1], [55, 2],
];

const LOOP_BEATS = MELODY.reduce((s, [, b]) => s + b, 0);

function midiToFreq(m: number) {
  return 440 * 2 ** ((m - 69) / 12);
}

function playNote(
  freq: number,
  start: number,
  dur: number,
  type: OscillatorType,
  vol: number,
) {
  if (!audioCtx || !masterGain) return;
  const osc = audioCtx.createOscillator();
  const env = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(env);
  env.connect(masterGain);
  const atk = 0.015;
  const rel = Math.min(0.06, dur * 0.25);
  env.gain.setValueAtTime(0, start);
  env.gain.linearRampToValueAtTime(vol, start + atk);
  env.gain.setValueAtTime(vol, start + dur - rel);
  env.gain.linearRampToValueAtTime(0, start + dur);
  osc.start(start);
  osc.stop(start + dur + 0.01);
}

function scheduleLoop(loopStart: number) {
  if (!audioCtx) return;

  let t = loopStart;
  for (const [midi, beats] of MELODY) {
    const dur = beats * BEAT;
    if (midi >= 0) playNote(midiToFreq(midi), t, dur * 0.82, "square", 0.18);
    t += dur;
  }

  t = loopStart;
  for (const [midi, beats] of BASS) {
    const dur = beats * BEAT;
    if (midi >= 0) playNote(midiToFreq(midi), t, dur * 0.65, "triangle", 0.13);
    t += dur;
  }

  const loopDur = LOOP_BEATS * BEAT;
  const msUntilNext = (loopStart + loopDur - audioCtx.currentTime) * 1000 - 250;
  loopHandle = window.setTimeout(
    () => scheduleLoop(loopStart + loopDur),
    Math.max(0, msUntilNext),
  );
}

export function startMusic() {
  if (isStarted) return;
  isStarted = true;
  try {
    audioCtx = new AudioContext();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = _muted ? 0 : 0.45;
    masterGain.connect(audioCtx.destination);
    scheduleLoop(audioCtx.currentTime + 0.05);
  } catch {
    // Audio not supported
  }
}

export function setMuted(muted: boolean) {
  _muted = muted;
  if (masterGain && audioCtx) {
    masterGain.gain.setTargetAtTime(muted ? 0 : 0.45, audioCtx.currentTime, 0.05);
  }
}

export function isMuted() {
  return _muted;
}
