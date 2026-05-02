"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { BroadcastSnapshot, CompetitionPhase } from "@/lib/types";

import { CountdownWidget } from "@/components/scoreboard/countdown-widget";
import { HeroSelectionRoster } from "@/components/scoreboard/hero-selection-roster";
import {
  boardGridClass,
  displayFontClass,
} from "@/components/scoreboard/presentation";
import { ScoreboardReveal } from "@/components/scoreboard/scoreboard-reveal";
import { StandingRow } from "@/components/scoreboard/standing-row";
import {
  getEventSoundUrl,
  HZU18_EVENT_TYPES,
  hzu18EventsUrl,
  loadHzu18Snapshot,
  mapHzu18Event,
  mergeScoreboardEvents,
  SCOREBOARD_REFRESH_INTERVAL_MS,
  shouldRefreshForEvent,
  type HZU18EventLogPayload,
} from "@/lib/hzu18";
import {
  armScoreboardAudio,
  enableScoreboardAudio,
  playScoreboardEventSound,
} from "@/lib/sounds";
import type { RealtimeStatus } from "@/lib/types";

const TEN_SECONDS_LEFT_SOUND = "/sounds/Galacta_-_10_seconds_left.ogg";

type ScoreboardPopup = {
  id: string;
  title: string;
  headline: string;
  detail: string;
  timeLabel: string;
  tone: "first-blood" | "frozen";
};

function readPayloadString(
  payload: Record<string, unknown>,
  key: string,
  fallback: string,
) {
  const value = payload[key];

  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function formatPopupTime(value: string | null) {
  if (!value) {
    return "Now";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Now";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Ulaanbaatar",
  }).format(date);
}

function parseEventPayload(data: string): HZU18EventLogPayload | null {
  if (!data || data === "ping") {
    return null;
  }

  try {
    const parsed = JSON.parse(data) as Partial<HZU18EventLogPayload>;

    if (
      typeof parsed.id !== "number" ||
      typeof parsed.event_type !== "string"
    ) {
      return null;
    }

    return {
      id: parsed.id,
      event_type: parsed.event_type,
      payload:
        parsed.payload &&
        typeof parsed.payload === "object" &&
        !Array.isArray(parsed.payload)
          ? (parsed.payload as Record<string, unknown>)
          : {},
      created_at:
        typeof parsed.created_at === "string" ? parsed.created_at : null,
      visible_at:
        typeof parsed.visible_at === "string" ? parsed.visible_at : null,
      replayable: Boolean(parsed.replayable),
    };
  } catch {
    return null;
  }
}

function ScoreboardTitle({
  phase,
  ended,
}: {
  phase: CompetitionPhase;
  ended: boolean;
}) {
  const isFrozen = phase === "frozen" && !ended;

  return (
    <header className="relative z-10 mb-6 text-center">
      <h1
        className={`${displayFontClass} text-5xl font-black uppercase italic leading-none text-white sm:text-6xl lg:text-7xl`}
      >
        HARUUL ZANGI U18 2026 FINAL
      </h1>
      {ended ? (
        <div className="mt-4 inline-flex border border-[#ffd95a]/70 bg-[#130b0f]/82 px-5 py-2 text-[0.86rem] font-black uppercase tracking-[0.22em] text-[#ffd95a] shadow-[0_0_34px_rgba(255,217,90,0.28)]">
          Final Ended
        </div>
      ) : isFrozen ? (
        <div className="mt-4 inline-flex border border-[#93e7ff]/70 bg-[#061121]/82 px-5 py-2 text-[0.86rem] font-black uppercase tracking-[0.22em] text-[#93e7ff] shadow-[0_0_34px_rgba(56,189,248,0.28)]">
          Scoreboard Frozen
        </div>
      ) : null}
    </header>
  );
}

function ScoreboardAnnouncement({ popup }: { popup: ScoreboardPopup }) {
  const isFrozen = popup.tone === "frozen";
  const bannerClass = isFrozen
    ? "bg-[linear-gradient(90deg,#1d4ed8_0%,#38bdf8_50%,#f8fafc_100%)]"
    : "bg-[linear-gradient(90deg,#f01f3d_0%,#ff8f3d_48%,#ffd95a_100%)]";
  const bannerTextClass = isFrozen ? "text-[#061121]" : "text-[#130b0f]";
  const accentClass = isFrozen ? "text-[#93e7ff]" : "text-[#ffd95a]";

  return (
    <div className="scoreboard-popup-backdrop pointer-events-none fixed inset-0 z-40 flex items-center justify-center px-6">
      <div className="scoreboard-popup-card w-full max-w-5xl overflow-hidden border border-[#ffd95a]/80 bg-[#10182d]/96 text-center text-white shadow-[0_38px_120px_rgba(0,0,0,0.72),0_0_80px_rgba(255,217,90,0.18),inset_0_1px_0_rgba(255,255,255,0.22)]">
        <div className={`${bannerClass} px-5 py-3`}>
          <p
            className={`text-[clamp(2.5rem,7vw,6.5rem)] font-black uppercase italic leading-none ${bannerTextClass}`}
          >
            {popup.title}
          </p>
        </div>
        <div className="px-6 py-8 sm:px-10 sm:py-10">
          <p
            className={`text-[0.86rem] font-black uppercase tracking-[0.24em] ${accentClass}`}
          >
            {popup.timeLabel}
          </p>
          <h2
            className={`${displayFontClass} mt-3 text-[clamp(3.8rem,10vw,9rem)] font-black uppercase italic leading-[0.82] text-white`}
          >
            {popup.headline}
          </h2>
          <p className="mt-7 text-[clamp(1.4rem,3vw,2.8rem)] font-black uppercase leading-tight text-white/86">
            {popup.detail}
          </p>
        </div>
      </div>
    </div>
  );
}

function EndCountdownOverlay({ seconds }: { seconds: number }) {
  return (
    <div className="final-countdown-backdrop pointer-events-none fixed inset-0 z-45 flex items-center justify-center px-6">
      <div
        key={seconds}
        className={`${displayFontClass} final-countdown-card countdown-drop text-[clamp(12rem,34vw,30rem)] font-black italic leading-[0.78] text-white drop-shadow-[0_0_58px_rgba(255,217,90,0.58)]`}
      >
        {seconds}
      </div>
    </div>
  );
}

function RoundStartModal() {
  return (
    <div className="round-start-backdrop pointer-events-none fixed inset-0 z-35 flex items-center justify-center px-6">
      <div className="round-start-card text-center">
        <p className="text-[clamp(1rem,2.4vw,2rem)] font-black uppercase tracking-[0.32em] text-[#ffd95a]">
          Haruul Zangi U18 2026 Final
        </p>
        <h2
          className={`${displayFontClass} mt-3 text-[clamp(5rem,16vw,15rem)] font-black uppercase italic leading-[0.78] text-white drop-shadow-[0_0_58px_rgba(255,217,90,0.46)]`}
        >
          Battle Starts
        </h2>
      </div>
    </div>
  );
}

function FinalEndedPopup() {
  return (
    <div className="final-ended-backdrop pointer-events-none fixed inset-0 z-50 flex items-center justify-center px-6">
      <h2
        className={`${displayFontClass} final-ended-title text-center text-[clamp(3.5rem,11vw,11rem)] font-black uppercase italic leading-[0.85] text-white drop-shadow-[0_0_58px_rgba(255,217,90,0.42)]`}
      >
        Haruul Zangi U18 2026 Final ended
      </h2>
    </div>
  );
}

export function ScoreboardPage({
  snapshot,
  mode = "broadcast",
}: {
  snapshot: BroadcastSnapshot;
  mode?: "broadcast" | "result";
}) {
  const isResultMode = mode === "result";
  const [liveSnapshot, setLiveSnapshot] = useState(snapshot);
  const [, setRealtimeStatus] = useState<RealtimeStatus>("connecting");
  const [displayNow, setDisplayNow] = useState<number | null>(null);
  const [showSoundPrompt, setShowSoundPrompt] = useState(true);
  const [scoreboardPopup, setScoreboardPopup] =
    useState<ScoreboardPopup | null>(null);
  const refreshInFlightRef = useRef(false);
  const popupTimerRef = useRef<number | null>(null);
  const previousPhaseRef = useRef(snapshot.phase);
  const tenSecondsAudioRef = useRef<HTMLAudioElement | null>(null);
  const tenSecondsSoundPlayedForEndRef = useRef<number | null>(null);
  const processedEventIdsRef = useRef(
    new Set(snapshot.recentEvents.map((event) => event.id)),
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setDisplayNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const armAudio = () => {
      void armScoreboardAudio();
      tenSecondsAudioRef.current?.load();
    };

    const tenSecondsAudio = new Audio(TEN_SECONDS_LEFT_SOUND);
    tenSecondsAudio.preload = "auto";
    tenSecondsAudio.volume = 0.92;
    tenSecondsAudioRef.current = tenSecondsAudio;

    armAudio();
    window.addEventListener("pointerdown", armAudio, {
      capture: true,
      passive: true,
    });
    window.addEventListener("touchstart", armAudio, {
      capture: true,
      passive: true,
    });
    window.addEventListener("keydown", armAudio, { capture: true });

    return () => {
      window.removeEventListener("pointerdown", armAudio, { capture: true });
      window.removeEventListener("touchstart", armAudio, { capture: true });
      window.removeEventListener("keydown", armAudio, { capture: true });
      if (popupTimerRef.current !== null) {
        window.clearTimeout(popupTimerRef.current);
      }
      tenSecondsAudio.pause();
      tenSecondsAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    setLiveSnapshot((current) => ({
      ...snapshot,
      recentEvents: mergeScoreboardEvents(
        current.recentEvents,
        snapshot.recentEvents,
      ),
    }));

    snapshot.recentEvents.forEach((event) => {
      processedEventIdsRef.current.add(event.id);
    });
  }, [snapshot]);

  const refreshSnapshot = useCallback(async () => {
    if (refreshInFlightRef.current) {
      return;
    }

    refreshInFlightRef.current = true;

    try {
      const nextSnapshot = await loadHzu18Snapshot(mode);

      if (!nextSnapshot) {
        setRealtimeStatus((current) =>
          current === "live" ? "reconnecting" : "offline",
        );
        return;
      }

      setLiveSnapshot((current) => ({
        ...nextSnapshot,
        recentEvents: mergeScoreboardEvents(
          current.recentEvents,
          nextSnapshot.recentEvents,
        ),
      }));
      setRealtimeStatus((current) =>
        current === "live" || current === "reconnecting" ? current : "polling",
      );
    } finally {
      refreshInFlightRef.current = false;
    }
  }, [mode]);

  const playEventSound = useCallback((event: HZU18EventLogPayload) => {
    playScoreboardEventSound(event, getEventSoundUrl(event));
  }, []);

  const showScoreboardPopup = useCallback((popup: ScoreboardPopup) => {
    if (popupTimerRef.current !== null) {
      window.clearTimeout(popupTimerRef.current);
    }

    setScoreboardPopup(popup);

    popupTimerRef.current = window.setTimeout(() => {
      setScoreboardPopup(null);
      popupTimerRef.current = null;
    }, 10000);
  }, []);

  const showEventPopup = useCallback(
    (event: HZU18EventLogPayload) => {
      if (event.event_type === "first_blood") {
        showScoreboardPopup({
          id: String(event.id),
          title: "First Blood",
          headline: readPayloadString(event.payload, "team_name", "Unknown Team"),
          detail: readPayloadString(
            event.payload,
            "challenge_name",
            "Solved Challenge",
          ),
          timeLabel: formatPopupTime(event.visible_at ?? event.created_at),
          tone: "first-blood",
        });
        return;
      }

      if (event.event_type === "scoreboard_frozen") {
        showScoreboardPopup({
          id: String(event.id),
          title: "Scoreboard Frozen",
          headline: "Freeze Active",
          detail: readPayloadString(
            event.payload,
            "detail",
            "Public standings are now locked",
          ),
          timeLabel: formatPopupTime(event.visible_at ?? event.created_at),
          tone: "frozen",
        });
      }
    },
    [showScoreboardPopup],
  );

  const handleEventMessage = useCallback(
    (message: MessageEvent<string>) => {
      const event = parseEventPayload(message.data);
      if (!event) {
        return;
      }

      const eventId = String(event.id);
      if (processedEventIdsRef.current.has(eventId)) {
        return;
      }
      processedEventIdsRef.current.add(eventId);

      const displayEvent = mapHzu18Event(event);
      if (displayEvent) {
        setLiveSnapshot((current) => ({
          ...current,
          recentEvents: mergeScoreboardEvents(current.recentEvents, [
            displayEvent,
          ]),
        }));
      }

      playEventSound(event);
      showEventPopup(event);

      if (shouldRefreshForEvent(event.event_type)) {
        void refreshSnapshot();
      }
    },
    [playEventSound, refreshSnapshot, showEventPopup],
  );

  useEffect(() => {
    const previousPhase = previousPhaseRef.current;
    previousPhaseRef.current = liveSnapshot.phase;

    if (previousPhase !== "frozen" && liveSnapshot.phase === "frozen") {
      showScoreboardPopup({
        id: `phase-frozen-${Date.now()}`,
        title: "Scoreboard Frozen",
        headline: "Freeze Active",
        detail: "Public standings are now locked",
        timeLabel: formatPopupTime(new Date().toISOString()),
        tone: "frozen",
      });
    }
  }, [liveSnapshot.phase, showScoreboardPopup]);

  useEffect(() => {
    void refreshSnapshot();

    const timer = window.setInterval(
      () => void refreshSnapshot(),
      SCOREBOARD_REFRESH_INTERVAL_MS,
    );

    return () => {
      window.clearInterval(timer);
    };
  }, [refreshSnapshot]);

  useEffect(() => {
    if (!("EventSource" in window)) {
      setRealtimeStatus("polling");
      return;
    }

    let closed = false;
    const eventSource = new EventSource(hzu18EventsUrl(0));
    const listener = (event: Event) => {
      handleEventMessage(event as MessageEvent<string>);
    };

    eventSource.onopen = () => {
      if (!closed) {
        setRealtimeStatus("live");
      }
    };

    eventSource.onerror = () => {
      if (!closed) {
        setRealtimeStatus("reconnecting");
      }
    };

    eventSource.onmessage = listener as (event: MessageEvent<string>) => void;
    eventSource.addEventListener("ping", () => undefined);
    HZU18_EVENT_TYPES.forEach((eventType) => {
      eventSource.addEventListener(eventType, listener);
    });

    return () => {
      closed = true;
      HZU18_EVENT_TYPES.forEach((eventType) => {
        eventSource.removeEventListener(eventType, listener);
      });
      eventSource.close();
    };
  }, [handleEventMessage]);

  const isPrestart = liveSnapshot.phase === "prestart" && !isResultMode;
  const startCountdownSeconds =
    liveSnapshot.countdownTargetUnix !== null && displayNow !== null
      ? liveSnapshot.countdownTargetUnix - Math.floor(displayNow / 1000)
      : null;
  const showRoundStartModal =
    isPrestart &&
    startCountdownSeconds !== null &&
    startCountdownSeconds <= 0;
  const endCountdownSeconds =
    liveSnapshot.ctfEndUnix !== null && displayNow !== null
      ? Math.max(
          0,
          liveSnapshot.ctfEndUnix - Math.floor(displayNow / 1000),
        )
      : null;
  const ctfEndedOnClient =
    !isResultMode &&
    liveSnapshot.ctfEndUnix !== null &&
    displayNow !== null &&
    Math.floor(displayNow / 1000) >= liveSnapshot.ctfEndUnix;
  const showEndCountdown =
    endCountdownSeconds !== null &&
    endCountdownSeconds > 0 &&
    endCountdownSeconds <= 10 &&
    !isResultMode &&
    (liveSnapshot.phase === "live" || liveSnapshot.phase === "frozen");

  useEffect(() => {
    if (
      isResultMode ||
      liveSnapshot.ctfEndUnix === null ||
      endCountdownSeconds === null ||
      endCountdownSeconds <= 0 ||
      endCountdownSeconds > 10 ||
      tenSecondsSoundPlayedForEndRef.current === liveSnapshot.ctfEndUnix
    ) {
      return;
    }

    tenSecondsSoundPlayedForEndRef.current = liveSnapshot.ctfEndUnix;
    const audio = tenSecondsAudioRef.current;
    if (!audio) {
      return;
    }

    audio.currentTime = 0;
    void audio.play().catch(() => undefined);
  }, [endCountdownSeconds, isResultMode, liveSnapshot.ctfEndUnix]);

  const handleEnableSound = () => {
    void enableScoreboardAudio().finally(() => {
      setShowSoundPrompt(false);
    });
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_26%),linear-gradient(180deg,#2b2d5f_0%,#3a438f_18%,#a5afe9_100%)]">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-0 w-[18rem] bg-[linear-gradient(180deg,rgba(27,29,58,0.98),rgba(49,54,109,0.88))] [clip-path:polygon(0_0,100%_0,38%_100%,0_100%)] max-[1200px]:w-[14vw] max-[860px]:w-36" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-0 w-[18rem] bg-[linear-gradient(180deg,rgba(29,31,63,0.98),rgba(62,71,142,0.88))] [clip-path:polygon(64%_0,100%_0,100%_100%,0_100%)] max-[1200px]:w-[14vw] max-[860px]:w-36" />
      <div className="pointer-events-none absolute inset-0 z-0 opacity-40 bg-[linear-gradient(rgba(143,220,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(143,220,255,0.08)_1px,transparent_1px)] bg-size-[88px_88px] mask-[linear-gradient(180deg,rgba(0,0,0,0.9),transparent_92%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-80 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.2),transparent_52%)]" />

      {isPrestart ? (
        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-472 flex-col px-4 py-7 sm:px-6 lg:px-9">
          <ScoreboardTitle ended={false} phase={liveSnapshot.phase} />
          <div className="flex flex-1 items-center justify-center">
            <CountdownWidget
              fallbackLabel={liveSnapshot.countdownLabel}
              targetUnix={liveSnapshot.countdownTargetUnix}
              title="Haruul Zangi U18 2026 Final starts soon"
              className="mt-0 w-full max-w-5xl"
            />
          </div>
          <HeroSelectionRoster
            standings={liveSnapshot.heroSelectTeams ?? liveSnapshot.standings}
          />
        </div>
      ) : (
        <ScoreboardReveal>
          <ScoreboardTitle
            ended={ctfEndedOnClient}
            phase={liveSnapshot.phase}
          />
          {!ctfEndedOnClient ? (
            <section className="relative mx-auto w-full max-w-[1400px] bg-[linear-gradient(135deg,rgba(243,246,255,0.96),rgba(223,231,255,0.93))]">
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(130deg,rgba(255,255,255,0.6),transparent_34%),repeating-linear-gradient(128deg,rgba(111,130,220,0.09)_0,rgba(111,130,220,0.09)_76px,rgba(255,255,255,0)_76px,rgba(255,255,255,0)_220px)] opacity-90" />
              <div className="relative z-10 overflow-x-auto">
                <div className="min-w-176">
                  <div
                    className={`${boardGridClass} bg-[linear-gradient(90deg,#1e2435_0%,#20283a_76%,#1a2132_100%)] px-6 py-4 text-[0.78rem] font-bold uppercase tracking-[0.18em] text-[#e3ebffeb]`}
                  >
                    <span>Team Name</span>
                    <span className="text-center">Solves</span>
                    <span className="text-center">Last Solve</span>
                    <span className="text-center">Score</span>
                  </div>

                  {liveSnapshot.standings.length === 0 ? (
                    <div className="mt-3 rounded-[1.25rem] border border-dashed border-[#59639457] bg-white/45 px-5 py-10 text-center text-[0.95rem] font-semibold text-[#4d5b7a]">
                      No public standings are available yet from CTFd.
                    </div>
                  ) : (
                    <div className="grid">
                      {liveSnapshot.standings.map((standing) => (
                        <StandingRow
                          key={standing.teamId}
                          now={displayNow}
                          standing={standing}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          ) : null}
        </ScoreboardReveal>
      )}

      {showSoundPrompt ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050815]/74 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm border border-white/18 bg-[#10182d]/94 p-5 text-center text-white shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-white/58">
              Broadcast audio
            </p>
            <h2 className="mt-2 text-3xl font-bold leading-none">
              Allow sound
            </h2>
            <p className="mt-3 text-sm font-medium leading-snug text-white/68">
              Enable live effects for submissions, first blood, and alerts.
            </p>
            <button
              className="mt-5 w-full border border-[#ffd95a]/60 bg-[linear-gradient(135deg,#ffd95a,#ff8f3d)] px-4 py-3 text-[0.78rem] font-black uppercase tracking-[0.18em] text-[#171921] shadow-[0_14px_28px_rgba(255,149,61,0.26)] transition hover:brightness-105 focus:outline focus:outline-3 focus:outline-white/70"
              type="button"
              onClick={handleEnableSound}
            >
              Enable sound
            </button>
          </div>
        </div>
      ) : null}

      {scoreboardPopup ? (
        <ScoreboardAnnouncement
          key={scoreboardPopup.id}
          popup={scoreboardPopup}
        />
      ) : null}

      {showEndCountdown ? (
        <EndCountdownOverlay seconds={endCountdownSeconds} />
      ) : null}

      {showRoundStartModal ? <RoundStartModal /> : null}

      {ctfEndedOnClient ? <FinalEndedPopup /> : null}
    </main>
  );
}
