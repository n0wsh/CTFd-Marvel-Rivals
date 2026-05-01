import type {
  BroadcastSnapshot,
  RealtimeStatus,
  ScoreboardEvent,
} from "@/lib/types";

import {
  displayFontClass,
  formatEventType,
  phaseMeta,
} from "@/components/scoreboard/presentation";

const statusMeta: Record<RealtimeStatus, { label: string; tone: string }> = {
  connecting: {
    label: "Connecting",
    tone: "border-sky-300/55 bg-sky-300/12 text-sky-50",
  },
  live: {
    label: "Live feed",
    tone: "border-emerald-300/55 bg-emerald-300/12 text-emerald-50",
  },
  polling: {
    label: "Polling",
    tone: "border-amber-300/55 bg-amber-300/12 text-amber-50",
  },
  reconnecting: {
    label: "Reconnecting",
    tone: "border-orange-300/55 bg-orange-300/12 text-orange-50",
  },
  offline: {
    label: "Offline",
    tone: "border-rose-300/55 bg-rose-300/12 text-rose-50",
  },
};

export function ScoreboardHud({
  snapshot,
  realtimeStatus,
}: {
  snapshot: BroadcastSnapshot;
  realtimeStatus: RealtimeStatus;
}) {
  const phase = phaseMeta[snapshot.phase];
  const status = statusMeta[realtimeStatus];

  return (
    <header className="mb-4 flex flex-wrap items-end justify-between gap-3 text-white">
      <div className="min-w-0">
        <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-white/62">
          {snapshot.ctfName}
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <h1 className={`${displayFontClass} text-5xl font-semibold leading-none sm:text-6xl`}>
            {phase.banner}
          </h1>
          <span className="mb-2 rounded-full border border-white/22 bg-white/10 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-white/82">
            {phase.label}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <span
          className={`rounded-full border px-3 py-2 text-[0.68rem] font-bold uppercase tracking-[0.18em] ${status.tone}`}
        >
          {status.label}
        </span>
        <span className="rounded-full border border-white/18 bg-white/10 px-3 py-2 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-white/78">
          {snapshot.countdownLabel}
        </span>
        <span className="rounded-full border border-white/18 bg-white/10 px-3 py-2 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-white/78">
          Freeze {snapshot.freezeLabel}
        </span>
      </div>
    </header>
  );
}

export function LiveEventFeed({ events }: { events: ScoreboardEvent[] }) {
  return (
    <aside className="mt-4 grid gap-2 lg:grid-cols-3">
      {events.length === 0 ? (
        <div className="border border-white/18 bg-[#10182d]/78 px-4 py-3 text-sm font-semibold text-white/72 lg:col-span-3">
          Waiting for the first live event from CTFd.
        </div>
      ) : (
        events.slice(0, 3).map((event) => (
          <article
            key={event.id}
            className="relative min-h-31 overflow-hidden border bg-[#10182d]/86 px-4 py-3 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]"
            style={{ borderColor: `${event.accent}66` }}
          >
            <div
              className="pointer-events-none absolute inset-y-0 left-0 w-1"
              style={{ backgroundColor: event.accent }}
            />
            <div className="flex items-center justify-between gap-3">
              <span className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-white/48">
                {formatEventType(event.type)}
              </span>
              <span className="text-[0.72rem] font-bold text-white/60">
                {event.timestamp}
              </span>
            </div>
            <h2 className="mt-2 text-base font-bold leading-tight text-white">
              {event.title}
            </h2>
            {event.detail ? (
              <p className="mt-1 line-clamp-2 text-sm font-medium leading-snug text-white/68">
                {event.detail}
              </p>
            ) : null}
          </article>
        ))
      )}
    </aside>
  );
}
