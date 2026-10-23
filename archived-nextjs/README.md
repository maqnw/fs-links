# Archived Next.js app (2026-10-23)

This folder is a frozen copy of the pre-Astro App Router site. **Root `npm run build` does not build this.**

Live site after migration: GitHub Pages project path `/fs-links` (`lib/siteBasePath.js` at the repo root).

This snapshot used **`/q-ext-link-grid`** as `basePath` (see `next.config.mjs` in this folder). `app/` still imports `@/lib/*` from the old repo-root aliases; those modules now live at the repo root for the Astro build.

`package.json` here is the dependency/scripts snapshot from before the Astro swap.
