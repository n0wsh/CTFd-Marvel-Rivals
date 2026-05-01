# Marvel Rivals CTFd Theme

This theme is based on CTFd's bundled `core` theme and keeps the same template
and static asset structure. It follows the CTFd core-beta style workflow:

- `assets/` contains editable source files.
- `static/` contains generated files served by CTFd.
- `templates/` contains Jinja templates.
- `vite.config.js` builds source assets into `static/manifest.json`.

The Marvel Rivals visual layer lives in `assets/scss/marvel-rivals.scss` and is
imported by `assets/scss/main.scss`.

## Development

Install dependencies and start Vite watch mode from this theme directory:

```sh
pnpm i
pnpm dev
```

Build once for production:

```sh
pnpm build
```

Activate it from the CTFd admin panel:

1. Go to `Admin Panel > Config > Theme`.
2. Set the theme value to `marvel-rivals`.
3. Save the configuration.

The theme does not bundle Marvel or Marvel Rivals artwork. Event-specific art
should be added only when the organizer has the rights to use it.
