"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { displayFontClass } from "@/components/scoreboard/presentation";

const COUNTDOWN_HANDOFF_DELAY_MS = 4200;
const ROUND_START_COUNTDOWN_SOUND =
  "/sounds/Galacta_-_Round_start_countdown.ogg";

function formatDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutesValue = Math.floor((safeSeconds % 3600) / 60);
  const secondsValue = Math.floor(safeSeconds % 60);

  if (hours === 0 && minutesValue === 0) {
    return secondsValue.toString();
  }

  const minutes = minutesValue.toString().padStart(2, "0");
  const seconds = secondsValue.toString().padStart(2, "0");

  if (hours === 0) {
    return `${minutes}:${seconds}`;
  }

  return `${hours.toString().padStart(2, "0")}:${minutes}:${seconds}`;
}

function normalizeLabel(label: string) {
  return label.replace(/^T-/, "").trim();
}

function parseDuration(label: string) {
  const parts = normalizeLabel(label)
    .split(":")
    .map((part) => Number.parseInt(part, 10));

  if (parts.some((part) => Number.isNaN(part))) {
    return null;
  }

  if (parts.length === 2) {
    const [minutes = 0, seconds = 0] = parts;
    return minutes * 60 + seconds;
  }

  if (parts.length === 1) {
    const [seconds = 0] = parts;
    return seconds;
  }

  if (parts.length === 3) {
    const [hours = 0, minutes = 0, seconds = 0] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }

  return null;
}

function getRemainingSeconds(targetUnix: number | null, fallbackLabel: string) {
  if (targetUnix === null) {
    return parseDuration(fallbackLabel);
  }

  return Math.max(0, targetUnix - Math.floor(Date.now() / 1000));
}

export function CountdownWidget({
  targetUnix,
  fallbackLabel,
  title,
  className,
}: {
  targetUnix: number | null;
  fallbackLabel: string;
  title: string;
  className?: string;
}) {
  const router = useRouter();
  const [secondsRemaining, setSecondsRemaining] = useState(() =>
    parseDuration(fallbackLabel)
  );
  const [liveLabel, setLiveLabel] = useState(() => normalizeLabel(fallbackLabel));
  const handoffTimeoutRef = useRef<number | null>(null);
  const startAudioRef = useRef<HTMLAudioElement | null>(null);
  const playedStartSoundForTargetRef = useRef<number | null>(null);

  useEffect(() => {
    if (!targetUnix) {
      const fallbackTimer = window.setTimeout(() => {
        const nextRemaining = getRemainingSeconds(targetUnix, fallbackLabel);
        setSecondsRemaining(nextRemaining);
        setLiveLabel(
          nextRemaining !== null
            ? formatDuration(nextRemaining)
            : normalizeLabel(fallbackLabel)
        );
      }, 0);

      return () => {
        window.clearTimeout(fallbackTimer);
      };
    }

    const target = targetUnix;
    const tick = () => {
      const nextRemaining = Math.max(0, target - Math.floor(Date.now() / 1000));
      setSecondsRemaining(nextRemaining);

      if (nextRemaining > 0) {
        setLiveLabel(formatDuration(nextRemaining));
      } else {
        setLiveLabel("");
      }
    };

    const initialTimer = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 1000);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [fallbackLabel, targetUnix]);

  useEffect(() => {
    return () => {
      if (handoffTimeoutRef.current !== null) {
        window.clearTimeout(handoffTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const audio = new Audio(ROUND_START_COUNTDOWN_SOUND);
    audio.preload = "auto";
    audio.volume = 0.92;
    startAudioRef.current = audio;

    return () => {
      audio.pause();
      startAudioRef.current = null;
    };
  }, []);

  const fallbackSecondsRemaining =
    targetUnix === null ? parseDuration(fallbackLabel) : null;
  const activeSecondsRemaining =
    targetUnix !== null ? secondsRemaining : fallbackSecondsRemaining;
  const label =
    targetUnix !== null
      ? liveLabel
      : fallbackSecondsRemaining !== null
        ? formatDuration(fallbackSecondsRemaining)
      : normalizeLabel(fallbackLabel);
  const shouldHandOff = targetUnix !== null && secondsRemaining === 0;
  const isFinalCountdown =
    activeSecondsRemaining !== null &&
    activeSecondsRemaining > 0 &&
    activeSecondsRemaining <= 10;

  useEffect(() => {
    if (
      targetUnix === null ||
      secondsRemaining === null ||
      secondsRemaining <= 0 ||
      secondsRemaining > 6 ||
      playedStartSoundForTargetRef.current === targetUnix
    ) {
      return;
    }

    playedStartSoundForTargetRef.current = targetUnix;
    const audio = startAudioRef.current;
    if (!audio) {
      return;
    }

    audio.currentTime = 0;
    void audio.play().catch(() => undefined);
  }, [secondsRemaining, targetUnix]);

  useEffect(() => {
    if (!shouldHandOff || handoffTimeoutRef.current !== null) {
      return;
    }

    handoffTimeoutRef.current = window.setTimeout(() => {
      handoffTimeoutRef.current = null;
      startTransition(() => {
        router.refresh();
      });
    }, COUNTDOWN_HANDOFF_DELAY_MS);
  }, [router, shouldHandOff]);

  return (
    <section
      className={`relative overflow-hidden transition-[opacity,transform,filter] duration-500 ${
        shouldHandOff ? "scale-95 opacity-0 blur-[2px]" : "opacity-100"
      } ${className ?? ""}`}
    >
      <div className="pointer-events-none absolute inset-0" />
      <div className="relative z-10 flex flex-col items-center justify-center gap-4 text-center">
        <h2 className="max-w-4xl text-balance text-2xl font-semibold tracking-[0.02em] text-white sm:text-3xl lg:text-4xl">
          {title}
        </h2>
        <div className="text-[clamp(4rem,14vw,8.5rem)] font-bold leading-none text-white">
          <span
            key={isFinalCountdown ? label : "stable-countdown"}
            className={`${displayFontClass} inline-block transition duration-300 ${
              isFinalCountdown ? "countdown-drop" : ""
            }`}
          >
            {label}
          </span>
        </div>
      </div>
    </section>
  );
}
