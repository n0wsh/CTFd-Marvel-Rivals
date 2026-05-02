# HZU18 Final Round Plan

## Goal

Build an HZU18 Final Round experience with a Marvel Rivals theme direction and these features:

- Team hero selection, controlled by the team captain only
- Chosen hero shown on a separate custom scoreboard
- Live scoreboard announcements for:
  - countdown before CTF start
  - first blood
  - correct flag submissions with chosen hero sound
  - new leader
  - organizer announcements such as new challenge, fix, or hint
  - scoreboard freeze
  - 3rd, 2nd, and champion reveal after the CTF ends

## Hard Constraints

- Do not modify the stock CTFd scoreboard page or core scoreboard UX
- Build the live scoreboard as a standalone app, preferably Next.js
- Keep CTFd as the source of truth for teams, solves, start/end/freeze times, and organizer actions
- Final-round deployment uses separate public hosts for CTF and scoreboard
- Do not commit third-party Marvel or Marvel Rivals copyrighted art/audio into the repo unless the assets are provided and licensed by you

## Final Round Deployment Target

Final round target host:

- CTF: `https://u18-final.haruulzangi.mn/`
- Custom scoreboard: `https://scoreboard.haruulzangi.mn/`

Important deployment note:

- The scoreboard is now a separate public app host, so it no longer has to share routing with CTFd
- Public scoreboard APIs should be exposed in a way that does not depend on browser session cookies from the CTF domain
- Cross-origin access from `https://scoreboard.haruulzangi.mn/` to the CTF backend must be handled explicitly with CORS or a server-side proxy

## Recommended Architecture

### 1. CTFd stays the competition backend

CTFd should continue to own:

- teams and captains
- challenges and solves
- official start, freeze, and end timestamps
- admin-side event authoring

### 2. Add one custom CTFd plugin

Create a plugin under:

```text
CTFd/plugins/hzu18_marvel_rivals/
```

This plugin should own:

- hero catalog
- team hero picks
- custom public scoreboard API
- custom public live event stream
- admin announcement tools
- event generation for first blood, leader changes, freeze, and reveal flow

### 3. Create a standalone Next.js scoreboard app

Recommended path:

```text
apps/scoreboard/
```

This app should be the only place where the custom scoreboard UI exists.

Deployment assumption for final round:

- the Next.js app is standalone at runtime
- it is exposed on `https://scoreboard.haruulzangi.mn/`
- it consumes public read-only data from CTFd without relying on authenticated browser session state

It will:

- render the public scoreboard screen
- subscribe to the plugin's public event feed
- play hero sounds
- handle countdown, freeze mode, and podium reveal scenes

## Why This Architecture Fits This Repo

This repo already gives us useful primitives:

- Team captain already exists via `Teams.captain_id`
- CTFd has a plugin system under `CTFd/plugins/`
- CTFd already supports server-sent events internally
- Score calculations already exist and can be reused from the backend without touching the stock scoreboard page

Important caveat:

- The built-in `/events` stream is authenticated, so the public display should not depend on it directly
- The plugin should expose its own sanitized public event stream for the standalone scoreboard

## Scope Split

### CTFd plugin scope

- Add hero data model and admin management
- Add team hero selection flow on the private team page
- Restrict hero selection to the captain
- Expose public scoreboard data enriched with hero info
- Expose public event feed for the standalone scoreboard
- Emit events when a solve changes the public narrative
- Provide admin endpoints/UI for organizer announcements

### Next.js app scope

- Fullscreen public scoreboard page
- Hero-aware standings table
- Event ticker / toast / overlay system
- Audio playback system with one-time operator sound enable
- Countdown scene before start
- Freeze scene during freeze
- Final reveal scene after end

## Data Model

Recommended plugin tables:

### `hzu18_heroes`

- `id`
- `slug`
- `name`
- `role`
- `enabled`
- `sort_order`
- `portrait_path`
- `sound_path`
- `theme_color`

### `hzu18_team_hero_picks`

- `id`
- `team_id` unique
- `hero_id`
- `picked_by_user_id`
- `picked_at`
- `locked`

### `hzu18_event_log`

- `id`
- `event_type`
- `payload_json`
- `created_at`
- `visible_at`
- `replayable`

### Optional plugin state/config

Use either config keys or a small state table for:

- first blood already emitted
- last leader team id
- reveal sequence already generated
- whether hero changes are locked

## Product Assumptions

These should be treated as defaults unless you want different behavior.

- One hero per team
- Only the captain can pick or change hero
- Hero picks lock when the CTF starts
- Duplicate heroes across teams are allowed
- Hero choice is presentation only and does not affect scoring/gameplay
- Organizer announcements are manual, not inferred automatically from every admin action

## Open Decisions

These are the main items still needing confirmation later.

1. Are hero picks cosmetic only, or should heroes be globally unique across teams?
2. Should captains be allowed to change hero after registration but before start?
3. Should the live display show all teams or only top N teams?
4. Do you want a public web page only, or also a stage-screen layout optimized for 16:9 projection?
5. Will you provide hero portraits and short sound clips, or should we use original non-infringing placeholder assets first?

## Backend API Contract

The standalone scoreboard should not scrape HTML. It should only use plugin-owned JSON/SSE endpoints.

### Public endpoints

#### `GET /api/v1/hzu18/state`

Returns:

- current phase: `prestart | live | frozen | ended | reveal`
- `start`
- `freeze`
- `end`
- sound enabled flag or policy metadata
- reveal schedule metadata if needed

#### `GET /api/v1/hzu18/heroes`

Returns enabled heroes and their display metadata.

#### `GET /api/v1/hzu18/scoreboard`

Returns public standings enriched with:

- team id
- team name
- score
- rank
- hero slug / name / portrait / theme color
- bracket if needed
- account URL if needed

This endpoint should reuse CTFd score calculations rather than reimplementing scoring.

#### `GET /api/v1/hzu18/events`

Public SSE or JSON replay endpoint for live display consumption.

Recommended behavior:

- support replay from `since_id`
- include heartbeat/ping
- only emit sanitized public events

### Authenticated team endpoints

#### `GET /api/v1/hzu18/team/hero`

Returns the current team's hero pick and whether the current user can edit it.

#### `PUT /api/v1/hzu18/team/hero`

Captain-only endpoint to set or update the team hero.

### Admin endpoints

#### `POST /api/v1/hzu18/announcements`

Creates a public display announcement event such as:

- new challenge unlocked
- infra fix
- hint released
- general broadcast

## Event Model

Recommended event types:

- `countdown_checkpoint`
- `ctf_started`
- `hero_selected`
- `flag_correct`
- `first_blood`
- `leader_changed`
- `organizer_announcement`
- `scoreboard_frozen`
- `ctf_ended`
- `reveal_third`
- `reveal_second`
- `reveal_champion`

### `flag_correct` payload

Should include:

- team id
- team name
- hero name / slug
- challenge id
- challenge name
- score delta
- new total score
- sound URL

### `leader_changed` payload

Should include:

- previous leader team id/name
- new leader team id/name
- new score

### `organizer_announcement` payload

Should include:

- title
- body
- severity or style
- optional pinned duration

## Event Generation Rules

### Countdown

Do not persist every second in the backend.

Instead:

- the backend exposes canonical `start`, `freeze`, and `end`
- the Next.js app renders the live countdown locally
- optional named checkpoints can still be emitted for dramatic overlays at `10m`, `5m`, `1m`, `30s`, and `10s`

### First blood

- Emit once for the first accepted solve after official start time
- Persist to event log so reconnecting clients can replay it if needed

### Flag submission

- Emit on every accepted solve
- Use the team's current hero to choose the sound effect
- Suppress sound on replay mode unless explicitly requested

### New leader

- Compare top team before and after a correct solve
- Emit only if the public leader actually changes
- Respect freeze for the public feed

### Freeze

- Public scoreboard should stop updating standings at freeze time
- Final standings must still be computed privately for the end reveal
- This means the plugin needs two scoreboard views:
  - public frozen standings
  - private final standings used only after end

### Podium reveal

- After end, reveal 3rd, then 2nd, then champion from final standings
- Do not rely on public frozen standings for this
- Use server-side final standings computed with freeze bypass logic and only expose them after `end`

## Integration Strategy Inside CTFd

### Hero selection UI

Add hero selection to the team private page, not the public scoreboard.

Recommended UX:

- show current hero
- show hero grid/modal for selection
- disable editing for non-captains
- disable editing after lock time

### Solve event hook

The plugin should hook solve-side effects centrally rather than editing scoreboard code.

Recommended approach:

- intercept successful solve handling at the challenge solve path
- after solve commit:
  - inspect whether this is first blood
  - compute updated standings
  - detect leader change
  - append public events to `hzu18_event_log`
  - publish the sanitized event to the plugin's public event stream

### Organizer announcements

Phase 1 recommendation:

- create a dedicated HZU18 admin announcement composer in the plugin

Optional later enhancement:

- mirror stock CTFd notifications into the public event log to avoid double entry

## Next.js App Structure

Recommended app structure:

```text
apps/scoreboard/
  app/
    page.tsx
    layout.tsx
  components/
    scoreboard/
    overlays/
    audio/
    countdown/
    reveal/
  lib/
    api.ts
    events.ts
    types.ts
    audio.ts
  public/
    heroes/
    sounds/
```

## Next.js Frontend Features

### Main live screen

- ranked standings table
- hero portrait/name next to team
- score delta animation on correct solve
- live announcement rail
- freeze badge and timer state

### Countdown mode

- full-screen countdown before start
- optional rotating hero backgrounds or faction colors
- operator toggle for enabling sound before the show begins

### Reveal mode

- staged reveal for 3rd, 2nd, champion
- dedicated typography and spotlight animation
- final champion state held until manual reset or page reload

### Audio

- browser autoplay restrictions require one manual interaction to enable sound
- add an operator-visible `Enable sound` button on initial load
- keep short preprocessed clips in `webm` and `mp3`

## Visual Direction

Use a Marvel Rivals inspired direction, but do not depend on copying official UI assets.

Recommended approach:

- strong faction colors per hero/role
- bold display typography
- angular HUD-style panels
- animated rank changes and reveal transitions
- custom original iconography or user-provided art

## Implementation Phases

### Phase 1. Plugin skeleton and data model

Deliverables:

- plugin folder scaffold
- plugin migrations
- hero, team pick, and event log tables
- admin menu entry for HZU18 controls

### Phase 2. Hero pick workflow

Deliverables:

- hero admin CRUD or static seed data
- captain-only team hero picker
- team API endpoints
- lock-time enforcement

### Phase 3. Public scoreboard and event backend

Deliverables:

- public state endpoint
- public enriched scoreboard endpoint
- public event replay endpoint
- solve hook for `flag_correct`, `first_blood`, and `leader_changed`
- manual organizer announcement endpoint/UI

### Phase 4. Next.js scoreboard app

Deliverables:

- app scaffold
- scoreboard table
- event overlay system
- SSE client with reconnect and replay support
- local countdown logic

### Phase 5. Freeze and reveal logic

Deliverables:

- public freeze behavior
- final standings computation after end
- 3rd / 2nd / champion reveal sequence
- operator-safe audio enable flow

### Phase 6. Polish and rehearsal

Deliverables:

- theme pass for CTFd team pages if desired
- stage-screen responsive layout
- sound balancing
- animation timing tuning
- operator runbook

## Testing Plan

### Backend tests

- captain can set hero
- non-captain cannot set hero
- hero lock activates at the configured time
- public scoreboard returns hero metadata correctly
- first blood only emits once
- leader change only emits on actual leader swap
- freeze blocks public score movement but not final reveal computation

### Frontend tests

- countdown transitions to live correctly
- SSE reconnect resumes from last event id
- sound enable gating works under browser autoplay policy
- reveal flow renders correct 3rd, 2nd, champion order

### Manual rehearsal

- open one team browser and one display browser
- submit controlled solves
- verify first blood, hero sound, leader change, freeze, and reveal behavior in sequence

## Deployment Notes

- Prefer exposing only public read-only endpoints to the display app
- Do not embed admin tokens in browser code
- Final-round deployment uses a separate public scoreboard host: `https://scoreboard.haruulzangi.mn/`
- Enable explicit CORS for public scoreboard endpoints if the Next.js app calls CTFd directly from the browser
- Prefer server-side fetches or a small proxy layer in Next.js if you want tighter control over caching, rate limiting, and payload shaping
- Do not use cookie-authenticated endpoints from the scoreboard host unless you intentionally design cross-site auth for operator tooling
- Keep hero sounds compressed and short to avoid latency

### Recommended public URLs

Suggested final-round route layout:

- `https://u18-final.haruulzangi.mn/` -> CTFd
- `https://scoreboard.haruulzangi.mn/` -> custom Marvel Rivals scoreboard

If you later want a vanity route on the main domain, it can redirect to `https://scoreboard.haruulzangi.mn/`, but the plan should assume the scoreboard is hosted separately.

## Suggested Build Order For This Repo

1. Create the plugin skeleton and migrations
2. Implement hero pick data and captain-only UI
3. Implement public plugin endpoints for state, scoreboard, and events
4. Scaffold the Next.js app
5. Wire live event consumption and scoreboard rendering
6. Implement freeze and final reveal
7. Add visual polish and run a full rehearsal

## Local Development

### CTFd

```bash
python3.11 -m venv env
source env/bin/activate
python3.11 -m pip install -r requirements.txt
cd CTFd
python3.11 -m flask run
```

### Next.js scoreboard

After the app is created:

```bash
cd apps/scoreboard
pnpm install
pnpm dev
```

## First Deliverable After This Plan

The next implementation step should be:

1. scaffold `CTFd/plugins/hzu18_marvel_rivals/`
2. add plugin migrations for heroes, team picks, and event log
3. expose one minimal JSON endpoint returning current public standings plus hero placeholder data
