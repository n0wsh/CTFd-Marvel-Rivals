import { appConfig } from "@/lib/config";
import { formatElapsedSince, formatTimeAgo } from "@/lib/time";
import type {
  BroadcastSnapshot,
  CompetitionPhase,
  ScoreboardEvent,
  ScoreboardEventType,
  TeamHero,
  TeamStanding,
} from "@/lib/types";

type HZU18ApiResponse<T> = {
  success: boolean;
  data: T;
  errors?: Record<string, string[] | string>;
};

type HZU18StatePayload = {
  ctf_name: string;
  phase: CompetitionPhase;
  start: number | string | null;
  freeze: number | string | null;
  end: number | string | null;
  hero_picks_locked: boolean;
  hero_lock_on_start: boolean;
  scoreboard_origins: string[];
};

type HZU18HeroPayload = {
  id: number;
  slug: string;
  name: string;
  role: string;
  portrait_path: string | null;
  sound_path: string | null;
  theme_color: string;
};

type HZU18StandingPayload = {
  rank: number;
  team_id: number;
  team_name: string;
  score: number;
  bracket_id: number | null;
  bracket_name: string | null;
  hero: HZU18HeroPayload | null;
  hero_pick_locked: boolean;
  solved_challenges: number;
  last_solve: string | null;
  delta: number;
};

type HZU18ScoreboardPayload = {
  ctf_name: string;
  phase: CompetitionPhase;
  locked: boolean;
  scoreboard_frozen: boolean;
  standings: HZU18StandingPayload[];
};

export type HZU18EventLogPayload = {
  id: number;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string | null;
  visible_at: string | null;
  replayable: boolean;
};

const MAX_VISIBLE_STANDINGS = 10;
const MAX_VISIBLE_EVENTS = 6;

export const SCOREBOARD_REFRESH_INTERVAL_MS = 5000;
export const HZU18_EVENT_REPLAY_LIMIT = 25;

export type SnapshotMode = "broadcast" | "result";

export const HZU18_EVENT_TYPES = [
  "countdown_checkpoint",
  "ctf_started",
  "hero_picked",
  "hero_selected",
  "flag_correct",
  "first_blood",
  "leader_changed",
  "organizer_announcement",
  "scoreboard_frozen",
  "ctf_ended",
  "reveal_third",
  "reveal_second",
  "reveal_champion",
] as const;

const accentPalette = [
  "#2DD4BF",
  "#FB923C",
  "#A78BFA",
  "#38BDF8",
  "#F43F5E",
  "#FACC15",
];

function safeApiBase() {
  return appConfig.apiBase.replace(/\/$/, "");
}

export function hzu18ApiUrl(path: string) {
  return `${safeApiBase()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function hzu18EventsUrl(replay = HZU18_EVENT_REPLAY_LIMIT) {
  return hzu18ApiUrl(`/events?replay=${replay}`);
}

function isScoreboardEventType(value: string): value is ScoreboardEventType {
  return HZU18_EVENT_TYPES.includes(value as (typeof HZU18_EVENT_TYPES)[number]);
}

function normalizeEventType(value: string): ScoreboardEventType {
  return isScoreboardEventType(value) ? value : "organizer_announcement";
}

function readString(
  payload: Record<string, unknown>,
  keys: string[],
  fallback = ""
) {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return fallback;
}

function readNumber(payload: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return null;
}

function readHero(payload: Record<string, unknown>) {
  const hero = payload.hero;
  return hero && typeof hero === "object" && !Array.isArray(hero)
    ? (hero as Record<string, unknown>)
    : null;
}

function getAccent(teamId: number) {
  return accentPalette[Math.abs(teamId) % accentPalette.length] ?? accentPalette[0];
}

function parseUnixValue(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function formatDuration(totalSeconds: number): string {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((safeSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(safeSeconds % 60)
    .toString()
    .padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
}

function formatClockLabel(
  phase: CompetitionPhase,
  start: number | null,
  end: number | null
) {
  const now = Math.floor(Date.now() / 1000);

  if (phase === "prestart" && start) {
    return `T-${formatDuration(start - now)}`;
  }

  if ((phase === "live" || phase === "frozen") && end) {
    return `Ends ${formatDuration(end - now)}`;
  }

  return phase === "ended" || phase === "reveal" ? "Complete" : "Live";
}

function formatFreezeLabel(phase: CompetitionPhase, freeze: number | null) {
  const now = Math.floor(Date.now() / 1000);

  if (!freeze) {
    return "Off";
  }

  if (phase === "frozen" || phase === "ended" || phase === "reveal") {
    return "Locked";
  }

  return formatDuration(freeze - now);
}

export function formatSnapshotTime(date = new Date()) {
  return `${date.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

function resolveAssetPath(path: string | null | undefined) {
  if (!path) {
    return null;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (path.startsWith("/")) {
    return `${appConfig.ctfdPublicBase.replace(/\/$/, "")}${path}`;
  }

  return path;
}

function createPendingHero(teamId: number): TeamHero {
  return {
    codename: "Awaiting Pick",
    role: "Captain selection",
    accent: getAccent(teamId),
  };
}

function mapHero(hero: HZU18HeroPayload | null, teamId: number): TeamHero {
  if (!hero) {
    return createPendingHero(teamId);
  }

  return {
    slug: hero.slug,
    codename: hero.name,
    role: hero.role,
    accent: hero.theme_color || getAccent(teamId),
    portraitPath: resolveAssetPath(hero.portrait_path),
    soundPath: resolveAssetPath(hero.sound_path),
  };
}

function deriveTrend(standing: HZU18StandingPayload): TeamStanding["trend"] {
  if (!standing.last_solve) {
    return "hold";
  }

  const timestamp = Date.parse(standing.last_solve);
  if (Number.isNaN(timestamp)) {
    return "hold";
  }

  const ageMinutes = (Date.now() - timestamp) / 60000;

  if (ageMinutes <= 15 && standing.delta > 0) {
    return "up";
  }

  if (ageMinutes >= 60) {
    return "down";
  }

  return "hold";
}

function mapStanding(standing: HZU18StandingPayload): TeamStanding {
  return {
    rank: standing.rank,
    teamId: standing.team_id,
    name: standing.team_name,
    score: standing.score,
    delta: standing.delta,
    solvedChallenges: standing.solved_challenges,
    lastSolve: formatElapsedSince(standing.last_solve),
    lastSolveAt: standing.last_solve,
    trend: deriveTrend(standing),
    hero: mapHero(standing.hero, standing.team_id),
  };
}

function eventTitle(event: HZU18EventLogPayload) {
  const { payload } = event;
  const hero = readHero(payload);

  switch (event.event_type) {
    case "hero_picked":
    case "hero_selected":
      return `${readString(payload, ["team_name"], "A team")} selected ${
        readString(hero ?? {}, ["name"], "a hero")
      }`;
    case "flag_correct":
      return `${readString(payload, ["team_name"], "A team")} solved ${
        readString(payload, ["challenge_name"], "a challenge")
      }`;
    case "first_blood":
      return `First blood by ${readString(payload, ["team_name"], "a team")}`;
    case "leader_changed":
      return `${readString(payload, ["new_leader_name", "team_name"], "A team")} takes the lead`;
    case "scoreboard_frozen":
      return "Scoreboard freeze is active";
    case "ctf_started":
      return "The final round is live";
    case "ctf_ended":
      return "The final round has ended";
    default:
      return readString(payload, ["title"], "Organizer announcement");
  }
}

function eventDetail(event: HZU18EventLogPayload) {
  const { payload } = event;
  const hero = readHero(payload);
  const delta = readNumber(payload, ["score_delta", "delta", "value"]);
  const score = readNumber(payload, ["new_score", "score"]);

  switch (event.event_type) {
    case "hero_picked":
    case "hero_selected":
      return `${readString(payload, ["picked_by_name"], "Captain")} locked ${
        readString(hero ?? {}, ["name"], "the hero")
      } for the broadcast board.`;
    case "flag_correct":
      return `${delta ? `+${delta} points` : "Correct submission"}${
        score !== null ? `, now ${score} total` : ""
      }.`;
    case "first_blood":
      return `${readString(payload, ["challenge_name"], "Opening challenge")} was the first public solve.`;
    case "leader_changed":
      return score !== null
        ? `${readString(payload, ["new_leader_name", "team_name"], "The leader")} is now at ${score} points.`
        : "The public leader changed on the live board.";
    default:
      return readString(payload, ["detail", "body"], "");
  }
}

export function mapHzu18Event(event: HZU18EventLogPayload): ScoreboardEvent | null {
  if (event.event_type === "ping") {
    return null;
  }

  const hero = readHero(event.payload);
  const teamId = readNumber(event.payload, ["team_id"]) ?? event.id;
  const accent =
    readString(event.payload, ["accent"]) ||
    readString(hero ?? {}, ["theme_color"]) ||
    getAccent(teamId);

  return {
    id: String(event.id),
    type: normalizeEventType(event.event_type),
    title: eventTitle(event),
    detail: eventDetail(event),
    timestamp: formatTimeAgo(event.visible_at ?? event.created_at),
    accent,
  };
}

export function mergeScoreboardEvents(
  current: ScoreboardEvent[],
  incoming: ScoreboardEvent[],
  limit = MAX_VISIBLE_EVENTS
) {
  const merged = [...incoming, ...current];
  const seen = new Set<string>();

  return merged
    .filter((event) => {
      if (seen.has(event.id)) {
        return false;
      }
      seen.add(event.id);
      return true;
    })
    .slice(0, limit);
}

export function shouldRefreshForEvent(eventType: string) {
  return !["countdown_checkpoint", "organizer_announcement"].includes(eventType);
}

export function getEventSoundUrl(event: HZU18EventLogPayload) {
  const explicit = readString(event.payload, ["sound_url", "soundPath"]);
  if (explicit) {
    return resolveAssetPath(explicit);
  }

  const hero = readHero(event.payload);
  return hero ? resolveAssetPath(readString(hero, ["sound_path"])) : null;
}

async function fetchHzu18<T>(path: string): Promise<T> {
  const response = await fetch(hzu18ApiUrl(path), {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`HZU18 API request failed: ${response.status}`);
  }

  const json = (await response.json()) as HZU18ApiResponse<T>;

  if (json.success === false) {
    throw new Error("HZU18 API returned an error");
  }

  return json.data;
}

async function safeFetchHzu18<T>(path: string): Promise<T | null> {
  try {
    return await fetchHzu18<T>(path);
  } catch {
    return null;
  }
}

function buildSnapshot(
  scoreboard: HZU18ScoreboardPayload | null,
  state: HZU18StatePayload | null,
  events: HZU18EventLogPayload[] | null
): BroadcastSnapshot | null {
  if (!scoreboard && !state) {
    return null;
  }

  const phase = scoreboard?.phase ?? state?.phase ?? "live";
  const start = parseUnixValue(state?.start);
  const freeze = parseUnixValue(state?.freeze);
  const end = parseUnixValue(state?.end);
  const heroSelectTeams = scoreboard?.standings.map(mapStanding) ?? [];
  const standings = heroSelectTeams.slice(0, MAX_VISIBLE_STANDINGS);
  const recentEvents =
    events?.map(mapHzu18Event).filter((event): event is ScoreboardEvent => Boolean(event)) ??
    [];

  return {
    ctfName: scoreboard?.ctf_name ?? state?.ctf_name ?? "HZU18 Final Round",
    dataSource: "live",
    phase,
    countdownLabel: formatClockLabel(phase, start, end),
    countdownTargetUnix: start,
    ctfEndUnix: end,
    freezeLabel: formatFreezeLabel(phase, freeze),
    audioReady: false,
    snapshotTime: formatSnapshotTime(),
    standings,
    heroSelectTeams,
    recentEvents,
    notes: [
      "Live data is sourced from the HZU18 CTFd plugin.",
      `Scoreboard API: ${hzu18ApiUrl("/scoreboard")}`,
      scoreboard?.scoreboard_frozen
        ? "Public standings are inside the freeze window."
        : "Public standings are refreshing from the live endpoint.",
    ],
  };
}

export async function loadHzu18Snapshot(
  mode: SnapshotMode = "broadcast",
): Promise<BroadcastSnapshot | null> {
  const scoreboardPath =
    mode === "result" ? "/scoreboard/result" : "/scoreboard";
  const [state, scoreboard, events] = await Promise.all([
    safeFetchHzu18<HZU18StatePayload>("/state"),
    safeFetchHzu18<HZU18ScoreboardPayload>(scoreboardPath),
    safeFetchHzu18<HZU18EventLogPayload[]>("/events/recent?limit=6"),
  ]);

  return buildSnapshot(scoreboard, state, events);
}
