import type { CompetitionPhase } from "@/lib/types";

export const displayFontClass =
  "[font-family:var(--font-display),var(--font-body),sans-serif]";

export const boardGridClass =
  "grid items-center gap-4 [grid-template-columns:minmax(22rem,2.8fr)_minmax(4.5rem,0.7fr)_minmax(7rem,1fr)_minmax(6rem,0.9fr)]";

export const titleStyle = {
  backgroundImage:
    "linear-gradient(90deg, #ffffff 0%, #fff8ca 22%, #ffe55f 55%, #ff9d4d 88%)",
  WebkitBackgroundClip: "text",
  color: "transparent",
  textShadow:
    "-3px 0 0 rgba(71, 177, 255, 0.72), 3px 0 0 rgba(255, 85, 104, 0.56), 0 14px 30px rgba(0, 0, 0, 0.3)",
} as const;

export const phaseMeta: Record<
  CompetitionPhase,
  { banner: string; label: string }
> = {
  prestart: {
    banner: "Scoreboard",
    label: "Prestart",
  },
  live: {
    banner: "Scoreboard",
    label: "Live",
  },
  frozen: {
    banner: "Freeze",
    label: "Frozen",
  },
  ended: {
    banner: "Victory",
    label: "Ended",
  },
  reveal: {
    banner: "Victory",
    label: "Reveal",
  },
};

export function formatEventType(value: string) {
  return value.replaceAll("_", " ");
}

export function rankLabel(rank: number) {
  return rank.toString().padStart(2, "0");
}

export function formatScore(score: number) {
  return score.toLocaleString("en-US");
}

export function heroToken(codename: string) {
  return codename
    .split(/\s+/)
    .slice(0, 2)
    .map((chunk) => chunk[0] ?? "")
    .join("")
    .toUpperCase();
}
