export type CompetitionPhase =
  | "prestart"
  | "live"
  | "frozen"
  | "ended"
  | "reveal";

export type ScoreboardEventType =
  | "countdown_checkpoint"
  | "ctf_started"
  | "hero_picked"
  | "hero_selected"
  | "flag_correct"
  | "first_blood"
  | "leader_changed"
  | "organizer_announcement"
  | "scoreboard_frozen"
  | "ctf_ended"
  | "reveal_third"
  | "reveal_second"
  | "reveal_champion";

export type TeamHero = {
  slug?: string;
  codename: string;
  role: string;
  accent: string;
  portraitPath?: string | null;
  soundPath?: string | null;
};

export type TeamStanding = {
  rank: number;
  teamId: number;
  name: string;
  score: number;
  delta: number;
  solvedChallenges: number;
  lastSolve: string;
  lastSolveAt?: string | null;
  trend: "up" | "hold" | "down";
  hero: TeamHero;
};

export type ScoreboardEvent = {
  id: string;
  type: ScoreboardEventType;
  title: string;
  detail: string;
  timestamp: string;
  accent: string;
};

export type BroadcastSnapshot = {
  ctfName: string;
  dataSource: "live" | "fallback";
  phase: CompetitionPhase;
  countdownLabel: string;
  countdownTargetUnix: number | null;
  ctfEndUnix: number | null;
  freezeLabel: string;
  audioReady: boolean;
  snapshotTime: string;
  standings: TeamStanding[];
  heroSelectTeams?: TeamStanding[];
  recentEvents: ScoreboardEvent[];
  notes: string[];
};

export type RealtimeStatus =
  | "connecting"
  | "live"
  | "polling"
  | "reconnecting"
  | "offline";
