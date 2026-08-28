let audioContext = null;

function getAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioContext || audioContext.state === "closed") audioContext = new AudioContextClass();
  return audioContext;
}

// Browsers require sound to be unlocked by a user interaction. Reusing the
// same context lets a later automatic reminder ring after any click or keypress.
export async function unlockReminderAudio() {
  const context = getAudioContext();
  if (!context) return false;
  if (context.state === "suspended") await context.resume();
  return context.state === "running";
}

export async function playReminderChime(type = "soft") {
  if (type === "none") return true;
  const context = getAudioContext();
  if (!context) return false;

  try {
    if (context.state === "suspended") await context.resume();
    if (context.state !== "running") return false;

    const frequencies = type === "bell"
      ? [740, 940, 740]
      : type === "digital"
        ? [520, 680, 520]
        : [620, 780, 620];

    frequencies.forEach((frequency, index) => {
      const start = context.currentTime + index * 0.32;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.type = type === "digital" ? "square" : "sine";
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.26);
      oscillator.start(start);
      oscillator.stop(start + 0.28);
    });
    return true;
  } catch (_) {
    return false;
  }
}
