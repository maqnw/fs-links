# DO

```bash
npm run build
git subtree push --prefix out origin gh-pages
```

This is an [Astro](https://astro.build) static site. The homepage is a JSON-driven grid of outgoing links.

Styling uses **Tailwind CSS v3** with `@astrojs/tailwind` and PostCSS (`tailwindcss` + `autoprefixer`).

## Getting Started

This app uses a **GitHub Pages–style base path** (`lib/siteBasePath.js`). Pick one:

**Static preview (matches production `out/`):**

```bash
npm run dev
```

This runs `astro build` then `scripts/serve-out.mjs` on port **8080** (override with `PORT`). Open **`http://127.0.0.1:8080/fs-links/`** — not the site root alone, or assets 404 (see `docs/github-pages.md`). If you see **EADDRINUSE**, something else is bound to that port; stop it or run e.g. **`PORT=8081 npm run start`** (after `npm run build`).

**Hot reload (Astro dev server):**

```bash
npm run dev:astro
```

Open **`http://localhost:4321/fs-links/`**.

This homepage is driven by `data/pages.json`.

Each entry should look like:

```json
[
  {
    "category": "Tools",
    "links": [
      { "url": "https://example.com", "title": "Example" },
      { "url": "https://no-title.example.com" }
    ]
  },
  {
    "category": "Docs",
    "links": [{ "url": "https://another.com", "title": "Another" }]
  }
]
```

If `title` is missing, the UI falls back to a truncated version of the `url`.
If the app can read the linked page's title (from the HTML `<title>` or `og:title`), it uses that instead. If that also fails, it falls back to truncated `url`.
During build, the icon for each link is resolved by trying the page favicon first, then falling back to `og:image`.

After changing `data/pages.json`, rebuild:

```bash
npm run build
```

On a **full** build (not `build:fast` with fetch skipped), if a link has **no `title`** in JSON but a title is **read from the page** (`<title>` / `og:title`), that string is **written back** into `data/pages.json` so the next build can skip fetching it for title only.

To **strip generated fields** from `data/pages.json` and keep only `url`, `title`, and `useImage` per link (and `category` per group), run manually:

```bash
npm run purge
```

This does **not** run on build.

**Fastest build (no link HTTP):** `npm run build:fast` sets `LINK_GRID_SKIP_FETCH=1` so icons/titles skip network (guessed favicons only). Use when you only need a working `out/` quickly.

**Faster rebuilds with network:** later `npm run build` runs reuse `.cache/link-grid-fetch.json` (gitignored). Delete `.cache/` or set `LINK_GRID_FETCH_CACHE=0` to refetch. Tune with `LINK_GRID_FETCH_CONCURRENCY`, `LINK_GRID_FETCH_TIMEOUT_MS`.

The generated static site will be in `out/` (open `out/index.html` or host `out/` on a static server).

The previous Next.js app is kept under [`archived-nextjs/`](archived-nextjs/) and is not part of the live build.

## GitHub Pages

See `docs/github-pages.md` for **base**, **`.nojekyll`** (Jekyll vs `_astro`), subtree deploy, and local testing under a repo subpath.
