# HZU18 Scoreboard

Standalone Next.js application for the final-round public scoreboard at `https://scoreboard.haruulzangi.mn/`.

This app is wired to the HZU18 CTFd plugin public endpoints. It ships with:

- a themed broadcast-style scoreboard page
- typed fallback standings and event data for offline development
- initial server-side reads from `/api/v1/hzu18/state`, `/scoreboard`, and `/events/recent`
- browser-side SSE consumption from `/api/v1/hzu18/events`
- periodic polling fallback for live standings refresh
- an operator sound gate for hero/event audio
- environment variable placeholders for the final deployment hosts

## Environment

Copy `.env.example` to `.env.local` and adjust as needed.

```bash
cp .env.example .env.local
```

Current defaults:

- `NEXT_PUBLIC_CTFD_PUBLIC_BASE=https://u18-2026.haruulzangi.mn`
- `NEXT_PUBLIC_SCOREBOARD_PUBLIC_BASE=https://scoreboard.haruulzangi.mn`
- `NEXT_PUBLIC_SCOREBOARD_API_BASE=https://u18-2026.haruulzangi.mn/api/v1/hzu18`

Optional server-only variables for richer live development data:

- `CTFD_ADMIN_API_BASE=https://u18-2026.haruulzangi.mn/api/v1`
- `CTFD_ADMIN_API_KEY=`

## Development

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Available Scripts

- `pnpm dev` starts local development
- `pnpm build` creates a production build
- `pnpm start` serves the production build
- `pnpm lint` runs ESLint

## Live Data Flow

- Server render calls the public HZU18 plugin endpoints for the first snapshot.
- The browser subscribes to `GET /api/v1/hzu18/events` with `EventSource`.
- The browser refreshes `/scoreboard` periodically and after scoreboard-changing events.
- If the plugin API is unavailable, the app renders local fallback data.

## Structure

```text
src/
	app/
		globals.css
		layout.tsx
		page.tsx
	lib/
		config.ts
		demo-data.ts
		types.ts
```

## Notes

- The final round uses a separate scoreboard host, not a route under the CTF domain.
- Public browser calls to the CTF backend will need explicit CORS support or a proxy layer.
- The current page already reads stock CTFd score/config data server-side; the admin API key stays on the Next.js server only.
