const ctfdPublicBase =
  process.env.NEXT_PUBLIC_CTFD_PUBLIC_BASE ??
  "https://u18-final.haruulzangi.mn";

const scoreboardPublicBase =
  process.env.NEXT_PUBLIC_SCOREBOARD_PUBLIC_BASE ??
  "https://scoreboard.haruulzangi.mn";

const apiBase =
  process.env.NEXT_PUBLIC_SCOREBOARD_API_BASE ??
  `${ctfdPublicBase}/api/v1/hzu18`;

export const appConfig = {
  apiBase,
  ctfdPublicBase,
  scoreboardPublicBase,
} as const;
