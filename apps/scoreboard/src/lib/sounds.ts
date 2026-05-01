import type { HZU18EventLogPayload } from "@/lib/hzu18";

type ScoreboardAudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

let audioContext: AudioContext | null = null;
let masterBus: GainNode | null = null;
const activeMedia = new Set<HTMLAudioElement>();
const soundQueue: Array<{ eventType: string; soundUrl: string | null }> = [];
let soundQueueActive = false;

const scoreboardSoundPaths: Record<string, string> = {
  flag_correct: "/sounds/kill.mp3",
  first_blood: "/sounds/first-blood.mp3",
  leader_changed: "/sounds/leader-changed.mp3",
  hero_selected: "/sounds/hero-confirm.mp3",
  organizer_announcement: "/sounds/notification.mp3",
  scoreboard_frozen: "/sounds/freeze.mp3",
};

const syntheticSoundDurations: Record<string, number> = {
  flag_correct: 470,
  first_blood: 780,
  leader_changed: 620,
  hero_picked: 390,
  hero_selected: 390,
  ctf_started: 620,
  ctf_ended: 620,
  scoreboard_frozen: 620,
  reveal_third: 620,
  reveal_second: 620,
  reveal_champion: 620,
  organizer_announcement: 360,
};

const SOUND_QUEUE_GAP_MS = 90;
const MEDIA_SOUND_TIMEOUT_MS = 8000;

function sleep(duration: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });
}

function getAudioContext() {
  if (typeof window === "undefined") {
    return null;
  }

  if (audioContext) {
    return audioContext;
  }

  const audioWindow = window as ScoreboardAudioWindow;
  const AudioContextConstructor =
    audioWindow.AudioContext ?? audioWindow.webkitAudioContext;

  if (!AudioContextConstructor) {
    return null;
  }

  audioContext = new AudioContextConstructor();
  return audioContext;
}

export async function armScoreboardAudio() {
  const context = getAudioContext();

  if (!context) {
    return false;
  }

  if (context.state === "suspended") {
    await context.resume().catch(() => undefined);
  }

  return context.state === "running";
}

function soundBus(context: AudioContext) {
  if (masterBus) {
    return masterBus;
  }

  const gain = context.createGain();
  const compressor = context.createDynamicsCompressor();

  gain.gain.value = 0.42;
  compressor.threshold.value = -18;
  compressor.knee.value = 24;
  compressor.ratio.value = 6;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.18;
  gain.connect(compressor);
  compressor.connect(context.destination);

  masterBus = gain;
  return gain;
}

function playTone(
  context: AudioContext,
  destination: AudioNode,
  start: number,
  frequency: number,
  duration: number,
  type: OscillatorType,
  volume: number
) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function playNoiseHit(
  context: AudioContext,
  destination: AudioNode,
  start: number,
  duration: number,
  volume: number
) {
  const sampleRate = context.sampleRate;
  const buffer = context.createBuffer(1, sampleRate * duration, sampleRate);
  const data = buffer.getChannelData(0);

  for (let index = 0; index < data.length; index += 1) {
    data[index] = (Math.random() * 2 - 1) * (1 - index / data.length);
  }

  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();

  source.buffer = buffer;
  filter.type = "highpass";
  filter.frequency.setValueAtTime(620, start);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  source.start(start);
  source.stop(start + duration);
}

function playFlagCorrect(context: AudioContext, destination: AudioNode) {
  const now = context.currentTime;

  playTone(context, destination, now, 659.25, 0.12, "triangle", 0.18);
  playTone(context, destination, now + 0.08, 880, 0.13, "triangle", 0.2);
  playTone(context, destination, now + 0.17, 1318.51, 0.2, "sine", 0.22);
}

function playFirstBlood(context: AudioContext, destination: AudioNode) {
  const now = context.currentTime;

  playNoiseHit(context, destination, now, 0.18, 0.13);
  playTone(context, destination, now, 164.81, 0.24, "sawtooth", 0.16);
  playTone(context, destination, now + 0.12, 392, 0.18, "triangle", 0.2);
  playTone(context, destination, now + 0.24, 523.25, 0.22, "triangle", 0.22);
  playTone(context, destination, now + 0.38, 783.99, 0.3, "sine", 0.24);
}

function playNotification(context: AudioContext, destination: AudioNode) {
  const now = context.currentTime;

  playTone(context, destination, now, 587.33, 0.11, "sine", 0.15);
  playTone(context, destination, now + 0.15, 783.99, 0.15, "sine", 0.17);
}

function playLeaderChanged(context: AudioContext, destination: AudioNode) {
  const now = context.currentTime;

  playTone(context, destination, now, 440, 0.12, "triangle", 0.15);
  playTone(context, destination, now + 0.08, 554.37, 0.12, "triangle", 0.17);
  playTone(context, destination, now + 0.16, 659.25, 0.14, "triangle", 0.19);
  playTone(context, destination, now + 0.28, 987.77, 0.24, "sine", 0.2);
}

function playHeroLocked(context: AudioContext, destination: AudioNode) {
  const now = context.currentTime;

  playTone(context, destination, now, 246.94, 0.12, "square", 0.12);
  playTone(context, destination, now + 0.1, 493.88, 0.18, "triangle", 0.2);
}

function playRoundState(context: AudioContext, destination: AudioNode) {
  const now = context.currentTime;

  playTone(context, destination, now, 196, 0.18, "sawtooth", 0.12);
  playTone(context, destination, now + 0.12, 392, 0.18, "triangle", 0.17);
  playTone(context, destination, now + 0.24, 784, 0.26, "sine", 0.18);
}

function syntheticSoundDuration(eventType: string) {
  return syntheticSoundDurations[eventType] ?? 360;
}

function playSyntheticEventSound(eventType: string) {
  const context = getAudioContext();

  if (!context) {
    return 0;
  }

  if (context.state === "suspended") {
    void context.resume().catch(() => undefined);
  }

  const destination = soundBus(context);

  switch (eventType) {
    case "first_blood":
      playFirstBlood(context, destination);
      break;
    case "flag_correct":
      playFlagCorrect(context, destination);
      break;
    case "leader_changed":
      playLeaderChanged(context, destination);
      break;
    case "hero_picked":
    case "hero_selected":
      playHeroLocked(context, destination);
      break;
    case "ctf_started":
    case "ctf_ended":
    case "scoreboard_frozen":
    case "reveal_third":
    case "reveal_second":
    case "reveal_champion":
      playRoundState(context, destination);
      break;
    default:
      playNotification(context, destination);
      break;
  }

  return syntheticSoundDuration(eventType);
}

export async function enableScoreboardAudio() {
  const armed = await armScoreboardAudio();

  if (armed) {
    playSyntheticEventSound("organizer_announcement");
  }

  return armed;
}

function playMediaSound(soundUrl: string, eventType: string) {
  const audio = new Audio(soundUrl);

  audio.volume = 0.72;
  activeMedia.add(audio);

  return new Promise<void>((resolve) => {
    let settled = false;
    let fallbackStarted = false;
    let timeout: number | null = null;

    const settle = () => {
      if (settled) {
        return;
      }

      settled = true;
      activeMedia.delete(audio);
      if (timeout !== null) {
        window.clearTimeout(timeout);
      }
      resolve();
    };

    const fallback = () => {
      if (settled || fallbackStarted) {
        return;
      }

      fallbackStarted = true;
      activeMedia.delete(audio);
      const duration = playSyntheticEventSound(eventType);
      window.setTimeout(settle, duration);
    };

    timeout = window.setTimeout(settle, MEDIA_SOUND_TIMEOUT_MS);

    audio.addEventListener("ended", settle, {
      once: true,
    });
    audio.addEventListener("error", fallback, {
      once: true,
    });

    void audio.play().catch(fallback);
  });
}

async function playQueuedSound(eventType: string, soundUrl: string | null) {
  const armed = await armScoreboardAudio();

  if (!armed) {
    return;
  }

  if (soundUrl) {
    await playMediaSound(soundUrl, eventType);
    return;
  }

  await sleep(playSyntheticEventSound(eventType));
}

async function drainSoundQueue() {
  if (soundQueueActive) {
    return;
  }

  soundQueueActive = true;

  while (soundQueue.length > 0) {
    const next = soundQueue.shift();
    if (!next) {
      continue;
    }

    await playQueuedSound(next.eventType, next.soundUrl);

    if (soundQueue.length > 0) {
      await sleep(SOUND_QUEUE_GAP_MS);
    }
  }

  soundQueueActive = false;
}

export function playScoreboardEventSound(
  event: HZU18EventLogPayload,
  soundUrl: string | null
) {
  const scoreboardSoundUrl = scoreboardSoundPaths[event.event_type];
  const eventSoundUrl = scoreboardSoundUrl ?? soundUrl;

  soundQueue.push({
    eventType: event.event_type,
    soundUrl: eventSoundUrl,
  });
  void drainSoundQueue();
}
