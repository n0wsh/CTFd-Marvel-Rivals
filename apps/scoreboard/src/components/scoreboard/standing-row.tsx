/* eslint-disable @next/next/no-img-element */
import type { TeamStanding } from "@/lib/types";

import {
  boardGridClass,
  displayFontClass,
  formatScore,
  heroToken,
  rankLabel,
} from "@/components/scoreboard/presentation";
import { heroIconUrl } from "@/lib/hero-icons";
import { formatElapsedSince } from "@/lib/time";

function lastSolveLabel(standing: TeamStanding, now: number | null) {
  if (!standing.lastSolveAt || now === null) {
    return standing.lastSolve;
  }

  return formatElapsedSince(standing.lastSolveAt, now);
}

function StandingHeroIcon({ standing }: { standing: TeamStanding }) {
  const hasHero = Boolean(standing.hero.slug);
  const iconUrl = heroIconUrl(standing.hero);

  return (
    <span
      className="relative z-10 inline-flex size-14 shrink-0 items-center justify-center mr-5"
      title={hasHero ? standing.hero.codename : "Hero not chosen"}
    >
      {hasHero && iconUrl ? (
        <img
          src={iconUrl}
          alt=""
          className="h-full w-full object-cover"
          decoding="async"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span
          className={`${displayFontClass} ${
            hasHero ? "text-xl" : "text-4xl"
          } font-bold leading-none text-white`}
        >
          {hasHero ? heroToken(standing.hero.codename) : "?"}
        </span>
      )}
    </span>
  );
}

export function StandingRow({
  standing,
  now,
}: {
  standing: TeamStanding;
  now: number | null;
}) {
  const rowTone =
    standing.rank === 1
      ? "shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_0_0_2px_rgba(255,209,84,0.22)]"
      : "shadow-[inset_0_1px_0_rgba(255,255,255,0.78)]";

  return (
    <article
      className={`${boardGridClass} border bg-white/84 ${rowTone}`}
      style={{ borderColor: `${standing.hero.accent}33` }}
    >
      <div className="grid min-w-0 grid-cols-[10.5rem_minmax(0,1fr)] items-center gap-4">
        <div
          className="relative flex items-center justify-between gap-3 overflow-hidden border border-white/20 bg-[linear-gradient(90deg,#244bb6_0%,#21428e_63%,#152c58_100%)] px-[0.95rem] text-white [clip-path:polygon(0_0,90%_0,100%_100%,0_100%)]"
          style={{
            boxShadow: `inset 0 0 0 2px ${standing.hero.accent}2a`,
            backgroundImage: `linear-gradient(90deg, color-mix(in srgb, ${standing.hero.accent} 78%, #1e3a8a) 0%, color-mix(in srgb, ${standing.hero.accent} 42%, #1e293b) 65%, #14213d 100%)`,
          }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.24),transparent_52%)] opacity-75" />
          <span
            className={`relative z-10 ${displayFontClass} text-[2.2rem] font-bold leading-none tracking-[-0.06em]`}
          >
            {rankLabel(standing.rank)}
          </span>
          <StandingHeroIcon standing={standing} />
        </div>

        <div className="min-w-0">
          <span className="block text-[1.28rem] font-bold leading-[1.15] text-[#1f2740]">
            {standing.name}
          </span>
        </div>
      </div>

      <div className="text-center text-base font-bold text-[#2d3550]">
        {standing.solvedChallenges}
      </div>
      <div className="text-center text-[0.9rem] font-semibold text-[#67718a]">
        {lastSolveLabel(standing, now)}
      </div>
      <div
        className={`text-center text-[2rem] leading-none tracking-[-0.05em] text-[#2d3550] ${displayFontClass}`}
      >
        {formatScore(standing.score)}
      </div>
    </article>
  );
}
