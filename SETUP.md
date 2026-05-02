# HZU18 Custom CTFd Setup

This repository contains a customized CTFd instance for Haruul Zangi U18 2026 Final.

It includes:

- CTFd with the `marvel-rivals` custom theme
- HZU18 Marvel Rivals hero selection plugin
- `/hero` custom hero selection page
- standalone realtime scoreboard app in `apps/scoreboard`
- custom fonts and scoreboard sound effects

## Services

The Docker Compose stack runs:

- `ctfd` on port `8000`
- `nginx` on port `80`
- `scoreboard` on port `3000`
- `mariadb`
- `redis`

Local URLs:

```text
CTFd via nginx:      http://localhost
CTFd direct:         http://localhost:8000
Scoreboard:          http://localhost:3000
Hero selection:      http://localhost/hero
Hero admin:          http://localhost/admin/hzu18/heroes
```

## Docker Setup

Start everything:

```bash
docker compose up --build
```

Run in the background:

```bash
docker compose up --build -d
```

Stop:

```bash
docker compose down
```

Reset local Docker data:

```bash
docker compose down -v
rm -rf .data
```

This removes database, Redis data, uploads, scoreboard build cache, and installed scoreboard `node_modules`.

## CTFd First Run

1. Open `http://localhost`.
2. Complete the CTFd setup wizard.
3. Set user mode to `Teams`.
4. Create/import users, teams, challenges, and flags.
5. Set the competition start, freeze, and end times in CTFd admin config.

The HZU18 plugin is loaded from:

```text
CTFd/plugins/hzu18_marvel_rivals
```

The custom theme is loaded from:

```text
CTFd/themes/marvel-rivals
```

## Theme Setup

In CTFd admin:

1. Go to `Admin Panel -> Config -> Theme`.
2. Select `marvel-rivals`.
3. Save.

Theme fonts live in:

```text
CTFd/themes/marvel-rivals/static/webfonts
```

Important fonts:

- `RefrigeratorDeluxeBold.ttf`
- `RefrigeratorDeluxeExtrabold.ttf`
- `RefrigeratorDeluxeHeavy.ttf`
- `NunitoSans10ptCondensedMedium.ttf`

## Hero Selection

Competitors use:

```text
/hero
```

Only the team captain can confirm a hero. A selected hero is not saved until the captain presses `Confirm`.

Confirmed heroes are unique across teams. A hero already confirmed by another team cannot be selected.

Admin page:

```text
/admin/hzu18/heroes
```

Use this page to:

- add heroes
- edit hero metadata
- remove heroes
- configure allowed scoreboard origins

For local Docker, allowed scoreboard origins should include:

```text
http://localhost:3000
http://127.0.0.1:3000
```

For production, include:

```text
https://scoreboard.haruulzangi.mn
```

## Scoreboard

The standalone scoreboard app lives in:

```text
apps/scoreboard
```

Docker Compose exposes it at:

```text
http://localhost:3000
```

It reads the plugin API from:

```text
http://localhost/api/v1/hzu18
```

Useful plugin endpoints:

```text
GET /api/v1/hzu18/state
GET /api/v1/hzu18/scoreboard
GET /api/v1/hzu18/events
GET /api/v1/hzu18/events/recent
```

The scoreboard shows:

- prestart countdown
- team hero roster
- live standings
- hero icons
- first blood popup
- scoreboard freeze popup
- final 10 second countdown
- final ended popup

## Scoreboard Development

Run CTFd separately on `localhost:4000`, then:

```bash
cd apps/scoreboard
cp .env.example .env.local
pnpm install
pnpm dev
```

Local `.env.local` example:

```env
NEXT_PUBLIC_CTFD_PUBLIC_BASE=http://127.0.0.1:4000
NEXT_PUBLIC_SCOREBOARD_PUBLIC_BASE=http://127.0.0.1:3000
NEXT_PUBLIC_SCOREBOARD_API_BASE=http://127.0.0.1:4000/api/v1/hzu18
CTFD_ADMIN_API_BASE=http://127.0.0.1:4000/api/v1
CTFD_ADMIN_API_KEY=
```

Build and verify:

```bash
pnpm lint
pnpm build
```

## Sound Assets

Scoreboard sounds are served from:

```text
apps/scoreboard/public/sounds
```

Current expected files:

```text
kill.mp3
first-blood.mp3
freeze.mp3
notification.mp3
Galacta_-_Round_start_countdown.ogg
Galacta_-_10_seconds_left.ogg
```

Sound behavior:

- correct submission: `kill.mp3`
- first blood: `first-blood.mp3`
- scoreboard freeze: `freeze.mp3`
- round start countdown at 6 seconds: `Galacta_-_Round_start_countdown.ogg`
- final 10 seconds: `Galacta_-_10_seconds_left.ogg`

Browser autoplay requires a user interaction. The scoreboard shows an `Allow sound` modal first.

## Reset Hero Selection

This resets hero picks without deleting users, teams, challenges, or solves.

For SQLite development:

```bash
sqlite3 CTFd/ctfd.db "
DELETE FROM hzu18_team_hero_picks;
DELETE FROM config WHERE key = 'hzu18_hero_picks_locked';
INSERT INTO config (key, value) VALUES ('hzu18_hero_picks_locked', 'false');
DELETE FROM hzu18_event_log WHERE event_type = 'hero_selected';
"
```

For Docker/MariaDB, run SQL inside the database container instead.

## Production Notes

Recommended host split:

```text
https://u18-final.haruulzangi.mn       -> CTFd
https://scoreboard.haruulzangi.mn     -> scoreboard
```

Production scoreboard environment:

```env
NEXT_PUBLIC_CTFD_PUBLIC_BASE=https://u18-final.haruulzangi.mn
NEXT_PUBLIC_SCOREBOARD_PUBLIC_BASE=https://scoreboard.haruulzangi.mn
NEXT_PUBLIC_SCOREBOARD_API_BASE=https://u18-final.haruulzangi.mn/api/v1/hzu18
```

These `NEXT_PUBLIC_*` values are baked into the Next.js browser bundle at build
time. After changing them, rebuild the scoreboard container:

```bash
docker compose up --build -d scoreboard
```

In `/admin/hzu18/heroes`, set allowed scoreboard origins to include:

```text
https://scoreboard.haruulzangi.mn
```

If using a reverse proxy, route:

```text
u18-final.haruulzangi.mn       -> ctfd:8000
scoreboard.haruulzangi.mn     -> scoreboard:3000
```
