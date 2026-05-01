/* eslint-disable @next/next/no-img-element */
import type { TeamStanding } from "@/lib/types";

import {
  displayFontClass,
  heroToken,
} from "@/components/scoreboard/presentation";
import { heroIconUrl } from "@/lib/hero-icons";

function HeroSlot({ standing }: { standing: TeamStanding }) {
  const hasHero = Boolean(standing.hero.slug);
  const accent = hasHero ? standing.hero.accent : "#94A3B8";
  const iconUrl = heroIconUrl(standing.hero);

  return (
    <article
      className={`relative min-h-[10.5rem] overflow-hidden border bg-[#111a31]/86 p-3 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] ${
        hasHero ? "" : "border-dashed"
      }`}
      style={{ borderColor: `${accent}70` }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1"
        style={{ backgroundColor: accent }}
      />
      <div
        className="mx-auto flex aspect-square w-full max-w-24 items-center justify-center overflow-hidden border bg-[#0b1120]"
        style={{
          borderColor: `${accent}80`,
          boxShadow: `0 0 34px ${accent}28`,
        }}
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
        ) : hasHero ? (
          <span
            className={`${displayFontClass} text-4xl font-semibold leading-none text-white`}
          >
            {heroToken(standing.hero.codename)}
          </span>
        ) : (
          <span
            className={`${displayFontClass} text-6xl font-semibold leading-none text-white/54`}
          >
            ?
          </span>
        )}
      </div>
      <div className="mt-3 min-w-0 text-center">
        <h2 className="truncate text-sm font-bold leading-tight text-white">
          {standing.name}
        </h2>
        <p
          className="mt-1 truncate text-[0.68rem] font-bold uppercase tracking-[0.16em]"
          style={{ color: hasHero ? accent : "#CBD5E1" }}
        >
          {hasHero ? standing.hero.codename : "Not chosen"}
        </p>
      </div>
    </article>
  );
}

export function HeroSelectionRoster({
  standings,
}: {
  standings: TeamStanding[];
}) {
  const pickedCount = standings.filter((standing) => standing.hero.slug).length;

  return (
    <section className="mt-5">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-white">
        <h2 className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-white/68">
          Hero Select
        </h2>
        <span className="rounded-full border border-white/18 bg-white/10 px-3 py-1.5 text-[0.66rem] font-bold uppercase tracking-[0.16em] text-white/70">
          {pickedCount}/{standings.length} locked
        </span>
      </div>
      <div className="grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(8.5rem,1fr))]">
        {standings.map((standing) => (
          <HeroSlot key={standing.teamId} standing={standing} />
        ))}
      </div>
    </section>
  );
}
