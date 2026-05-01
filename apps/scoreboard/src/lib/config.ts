const ctfdPublicBase =
  process.env.NEXT_PUBLIC_CTFD_PUBLIC_BASE ?? "http://127.0.0.1:4000";

const scoreboardPublicBase =
  process.env.NEXT_PUBLIC_SCOREBOARD_PUBLIC_BASE ?? "http://127.0.0.1:3000";

const apiBase =
  process.env.NEXT_PUBLIC_SCOREBOARD_API_BASE ??
  `${ctfdPublicBase}/api/v1/hzu18`;

export const appConfig = {
  apiBase,
  ctfdPublicBase,
  scoreboardPublicBase,
} as const;
