// Tiny synthesized sound effects with WebAudio: no audio files, nothing loaded
// over the network. Every call is guarded so the game stays silent (and never
// throws) until the player has interacted with the page.
const sounds = {
  pickup: [660, 0.07],
  place: [440, 0.07],
  chop: [220, 0.05],
  ding: [880, 0.18],
  serve: [523, 0.09, 784, 0.14],
  fail: [196, 0.22],
  spawn: [392, 0.08],
};

let context = null;

function ensureContext() {
  if (context) return context;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    context = new AudioContextClass();
  } catch {
    return null;
  }
  return context;
}

function tone(when, frequency, duration) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(0.12, when + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(when);
  oscillator.stop(when + duration + 0.02);
}

export function playSound(name) {
  const audioContext = ensureContext();
  if (!audioContext || audioContext.state === 'suspended') {
    if (audioContext) audioContext.resume().catch(() => {});
    return;
  }
  const pattern = sounds[name];
  if (!pattern) return;
  let when = audioContext.currentTime;
  for (let index = 0; index < pattern.length; index += 2) {
    tone(when, pattern[index], pattern[index + 1]);
    when += pattern[index + 1];
  }
}
