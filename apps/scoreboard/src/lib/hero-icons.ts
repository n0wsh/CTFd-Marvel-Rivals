import type { TeamHero } from "@/lib/types";

const RIVALSKINS_AVATAR_BASE =
  "https://rivalskins.com/wp-content/uploads/marvel-assets/assets/hero-icons-avatars";

const RIVALSKINS_AVATAR_FILE_SLUGS = new Set([
  "adam-warlock",
  "angela",
  "black-panther",
  "black-widow",
  "blade",
  "captain-america",
  "cloak-and-dagger",
  "daredevil",
  "doctor-strange",
  "emma-frost",
  "gambit",
  "groot",
  "hawkeye",
  "hela",
  "hulk",
  "human-torch",
  "invisible-woman",
  "iron-fist",
  "iron-man",
  "jeff-the-land-shark",
  "loki",
  "luna-snow",
  "magik",
  "magneto",
  "mantis",
  "mister-fantastic",
  "moon-knight",
  "namor",
  "peni-parker",
  "phoenix",
  "psylocke",
  "rocket-raccoon",
  "scarlet-witch",
  "spider-man",
  "squirrel-girl",
  "star-lord",
  "storm",
  "the-punisher",
  "the-thing",
  "thor",
  "ultron",
  "venom",
  "winter-soldier",
  "wolverine",
]);

const RIVALSKINS_AVATAR_ALIASES: Record<string, string> = {
  "bruce-banner": "hulk",
  "cloak-dagger": "cloak-and-dagger",
};

export function heroIconUrl(hero: TeamHero) {
  if (!hero.slug) {
    return null;
  }

  const fileSlug = RIVALSKINS_AVATAR_ALIASES[hero.slug] ?? hero.slug;

  if (RIVALSKINS_AVATAR_FILE_SLUGS.has(fileSlug)) {
    return `${RIVALSKINS_AVATAR_BASE}/${fileSlug}_avatar.png`;
  }

  return hero.portraitPath ?? null;
}
